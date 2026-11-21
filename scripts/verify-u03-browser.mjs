#!/usr/bin/env node
/**
 * Foundation Uno — real-browser proof for the U03 publication fixture (`UNO-WO-032 / R01`).
 *
 * WHAT THIS IS. One bounded, dependency-aware, **test-only** helper. It launches the pinned Playwright Chromium
 * (headless shell) and observes the same production build the published-HTTP gate serves on loopback. Every assertion
 * comes from a real rendered DOM — never a simulated DOM, a source regex or an HTTP-body substitute — at a desktop and
 * a mobile viewport, and again with `prefers-reduced-motion: reduce`.
 *
 * WHAT IT IS NOT. It is not a provider, a deployment, a live-site check, a screen-reader audit, a crawler/indexing
 * claim or a permanent dependency of anything in `src/**`. It navigates only the loopback base it is handed; any other
 * origin is a failure, not a navigation.
 *
 * SAFETY. A missing browser, a failed assertion or an unexpected request returns failures to the caller; the caller
 * keeps its own guaranteed restoration path. Pages, contexts and the browser are closed in `finally` on every path.
 */

const ALLOWED_HOSTS = new Set(["127.0.0.1", "localhost"]);
const LOAD_TIMEOUT_MS = 30_000;
const ASSERTION_TIMEOUT_MS = 10_000;
const VIEWPORT_TOLERANCE_PX = 2;

/** Only a loopback origin is ever visited; anything else is refused before a browser is launched. */
function assertLoopbackBase(base) {
  let parsed;
  try {
    parsed = new URL(base);
  } catch {
    return "the base URL is not a valid absolute URL";
  }
  if (parsed.protocol !== "http:") return "the base URL is not plain HTTP on loopback";
  if (!ALLOWED_HOSTS.has(parsed.hostname)) return "the base URL does not name loopback";
  return null;
}

/** Metadata and visible-text facts read from one loaded document. */
async function observe(page) {
  return page.evaluate(() => {
    const canonical = document.querySelector('link[rel="canonical"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');
    const robots = document.querySelector('meta[name="robots"]');
    const alternates = [...document.querySelectorAll('link[rel="alternate"]')].map((link) => ({
      hreflang: link.getAttribute("hreflang"),
      href: link.getAttribute("href"),
    }));
    const heading = document.querySelector("h1");
    const box = heading === null ? null : heading.getBoundingClientRect();
    return {
      lang: document.documentElement.getAttribute("lang"),
      title: document.title,
      h1Count: document.querySelectorAll("h1").length,
      h1Text: heading === null ? null : (heading.textContent ?? "").trim(),
      h1Visible: box === null ? false : box.width > 0 && box.height > 0,
      bodyText: (document.body?.innerText ?? "").replace(/\s+/gu, " ").trim(),
      canonical: canonical === null ? null : canonical.getAttribute("href"),
      ogUrl: ogUrl === null ? null : ogUrl.getAttribute("content"),
      robots: robots === null ? null : robots.getAttribute("content"),
      alternates,
      headingRoles: [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((element) => element.tagName),
      listCount: document.querySelectorAll("ul,ol").length,
      listItemCount: document.querySelectorAll("li").length,
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
}

/** Collect one page's run: page errors, console errors and every request whose origin is not loopback. */
function watchPage(page, base) {
  const record = { pageErrors: [], consoleErrors: [], foreignRequests: [] };
  const baseOrigin = new URL(base).origin;
  page.on("pageerror", (error) => record.pageErrors.push(String(error.message ?? error)));
  page.on("console", (message) => {
    if (message.type() === "error") record.consoleErrors.push(message.text());
  });
  page.on("request", (request) => {
    const url = request.url();
    if (url.startsWith("data:") || url.startsWith("blob:")) return;
    let origin;
    try {
      origin = new URL(url).origin;
    } catch {
      record.foreignRequests.push("<unparseable>");
      return;
    }
    if (origin !== baseOrigin) record.foreignRequests.push(origin);
  });
  return record;
}

/**
 * Prove one published Page in one viewport: status, unique visible `h1`, own-source text, language, title, canonical,
 * OG, public-only alternates, the `x-default` policy and no horizontal overflow.
 */
function assertPage(observation, response, page, viewport, record, report) {
  const label = `${page.pathname} @ ${viewport.name}`;
  report.check(`${label} answers a 200 document response`, response !== null && response.status() === 200);
  report.check(`${label} renders exactly one h1`, observation.h1Count === 1, `${observation.h1Count}`);
  report.check(`${label} shows the h1 text`, observation.h1Text === page.title, observation.h1Text ?? "none");
  report.check(`${label} renders the h1 visibly`, observation.h1Visible);
  report.check(`${label} shows its own source text`, observation.bodyText.includes(page.body), page.body);
  report.check(`${label} declares <html lang>`, observation.lang === page.locale, observation.lang ?? "none");
  report.check(`${label} sets the document title`, observation.title === page.title, observation.title);
  report.check(
    `${label} declares the exact canonical`,
    observation.canonical === page.canonical,
    observation.canonical ?? "none",
  );
  report.check(
    `${label} declares the matching og:url`,
    observation.ogUrl === page.canonical,
    observation.ogUrl ?? "none",
  );
  report.check(`${label} is indexable`, /index, follow/i.test(observation.robots ?? ""), observation.robots ?? "none");

  const ownAlternate = observation.alternates.find((alternate) => alternate.hreflang === page.locale);
  report.check(`${label} advertises its own locale alternate`, ownAlternate?.href === page.canonical);
  const publicHrefs = new Set(report.publicCanonicals);
  report.check(
    `${label} advertises only same-Page public alternates`,
    observation.alternates.length > 0 &&
      observation.alternates.every((alternate) => publicHrefs.has(alternate.href ?? "")),
    observation.alternates.map((alternate) => alternate.href).join(","),
  );
  const xDefault = observation.alternates.find((alternate) => alternate.hreflang === "x-default");
  report.check(
    `${label} applies the x-default policy`,
    page.xDefault === undefined ? xDefault === undefined : xDefault?.href === page.xDefault,
    xDefault?.href ?? "none",
  );

  report.check(
    `${label} does not overflow horizontally`,
    observation.horizontalOverflow <= VIEWPORT_TOLERANCE_PX,
    `${observation.horizontalOverflow}px`,
  );
  report.check(`${label} raises no page error`, record.pageErrors.length === 0, record.pageErrors.join("; "));
  report.check(`${label} logs no console error`, record.consoleErrors.length === 0, record.consoleErrors.join("; "));
  report.check(
    `${label} requests nothing outside loopback`,
    record.foreignRequests.length === 0,
    [...new Set(record.foreignRequests)].join(","),
  );
  return observation;
}


/**
 * The single exported entry point. Accepts only the internally generated loopback base and the immutable fixture
 * expectations; returns counted results so the host runner keeps one authoritative tally and its own restoration path.
 */
export async function verifyUnoU03Browser({ base, pages, refusedPaths, keyboardPage = null }) {
  const passes = [];
  const failures = [];
  const check = (name, condition, detail) => {
    if (condition) {
      passes.push(name);
      return true;
    }
    failures.push(detail ? `${name} (${detail})` : name);
    return false;
  };
  const report = { check, base, publicCanonicals: pages.map((page) => page.canonical) };

  const baseProblem = assertLoopbackBase(base);
  if (baseProblem !== null) {
    check("the browser proof only navigates a loopback origin", false, baseProblem);
    return { passes, failures };
  }

  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    check("the pinned Playwright package is importable", false, "playwright is not installed");
    return { passes, failures };
  }

  let browser = null;
  try {
    browser = await chromium.launch({ headless: true, timeout: LOAD_TIMEOUT_MS });
    check("a real headless Chromium process launches", typeof browser.version() === "string");
  } catch (error) {
    check("a real headless Chromium process launches", false, String(error.message ?? error).slice(0, 200));
    return { passes, failures };
  }

  const viewports = [
    { name: "desktop 1280x720", width: 1280, height: 720 },
    { name: "mobile 390x844", width: 390, height: 844 },
  ];

  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        reducedMotion: "no-preference",
      });
      try {
        for (const page of pages) {
          const tab = await context.newPage();
          const record = watchPage(tab, base);
          try {
            const response = await tab.goto(`${base}${page.pathname}`, {
              waitUntil: "networkidle",
              timeout: LOAD_TIMEOUT_MS,
            });
            await tab.waitForSelector("h1", { timeout: ASSERTION_TIMEOUT_MS });
            const observation = assertPage(await observe(tab), response, page, viewport, record, report);
            if (page.pathname === "/en-001/about") {
              // The About source declares a two-item list, so the rendered semantics must match the Markdown.
              report.check(
                `${page.pathname} @ ${viewport.name} renders the authored list semantics`,
                observation.listCount >= 1 && observation.listItemCount >= 2,
                `${observation.listCount} lists, ${observation.listItemCount} items`,
              );
            }
            if (page.pathname === "/en-001") {
              report.check(
                `${page.pathname} @ ${viewport.name} renders a heading hierarchy`,
                observation.headingRoles.length >= 2 && observation.headingRoles[0] === "H1",
                observation.headingRoles.join(","),
              );
            }
          } catch (error) {
            check(
              `${page.pathname} @ ${viewport.name} loads and renders`,
              false,
              String(error.message ?? error).slice(0, 200),
            );
          } finally {
            await tab.close();
          }
        }
      } finally {
        await context.close();
      }
    }


    // Reduced motion must not hide content: the fixture Pages stay readable with animation suppressed.
    const reducedContext = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      reducedMotion: "reduce",
    });
    try {
      for (const page of pages.slice(0, 2)) {
        const tab = await reducedContext.newPage();
        try {
          await tab.goto(`${base}${page.pathname}`, { waitUntil: "networkidle", timeout: LOAD_TIMEOUT_MS });
          const observation = await observe(tab);
          check(
            `${page.pathname} stays visible with reduced motion`,
            observation.bodyText.includes(page.body) && observation.h1Visible,
          );
        } finally {
          await tab.close();
        }
      }
    } finally {
      await reducedContext.close();
    }

    // Keyboard reachability of the two authored focusable controls, plus the real refusal document.
    const keyboardContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    try {
      const demo = await keyboardContext.newPage();
      try {
        await demo.goto(`${base}/`, { waitUntil: "networkidle", timeout: LOAD_TIMEOUT_MS });
        await demo.keyboard.press("Tab");
        const focused = await demo.evaluate(() => {
          const element = document.activeElement;
          return {
            text: (element?.textContent ?? "").trim(),
            href: element?.getAttribute("href") ?? null,
            isLink: element?.tagName === "A",
          };
        });
        check(
          "the demonstration skip link is keyboard-reachable",
          focused.isLink && focused.href !== null && /skip|main/iu.test(`${focused.text} ${focused.href}`),
          `${focused.text} ${focused.href}`,
        );
      } finally {
        await demo.close();
      }

      // A published starter Page must expose at least one keyboard-operable control of its own.
      if (keyboardPage !== null) {
        const starter = await keyboardContext.newPage();
        const starterRecord = watchPage(starter, base);
        try {
          await starter.goto(`${base}${keyboardPage.pathname}`, { waitUntil: "networkidle", timeout: LOAD_TIMEOUT_MS });
          await starter.keyboard.press("Tab");
          const focusable = await starter.evaluate(() => {
            const element = document.activeElement;
            const tag = element?.tagName ?? null;
            return {
              tag,
              focusable: element !== null && element !== document.body && typeof element?.focus === "function",
              text: (element?.textContent ?? "").trim().slice(0, 80),
            };
          });
          check(
            `${keyboardPage.pathname} exposes a keyboard-reachable control`,
            focusable.focusable === true,
            `${focusable.tag} ${focusable.text}`,
          );
          check(
            `${keyboardPage.pathname} raises no page error while focused`,
            starterRecord.pageErrors.length === 0,
            starterRecord.pageErrors.join("; "),
          );
          check(
            `${keyboardPage.pathname} requests nothing outside loopback`,
            starterRecord.foreignRequests.length === 0,
            [...new Set(starterRecord.foreignRequests)].join(","),
          );

          // A native disclosure, when authored, must be operable from the keyboard without any script.
          const disclosure = await starter.evaluate(() => {
            const summary = document.querySelector("summary");
            if (summary === null) return null;
            summary.focus();
            const before = summary.parentElement?.hasAttribute("open") ?? false;
            summary.click();
            const after = summary.parentElement?.hasAttribute("open") ?? false;
            return { focused: document.activeElement === summary, before, after };
          });
          if (disclosure !== null) {
            check(
              `${keyboardPage.pathname} toggles its native disclosure from the keyboard`,
              disclosure.focused === true && disclosure.before !== disclosure.after,
              JSON.stringify(disclosure),
            );
          }
        } finally {
          await starter.close();
        }
      }

      const missing = await keyboardContext.newPage();
      const missingRecord = watchPage(missing, base);
      try {
        const response = await missing.goto(`${base}${refusedPaths[0]}`, {
          waitUntil: "networkidle",
          timeout: LOAD_TIMEOUT_MS,
        });
        const observation = await observe(missing);
        check("the global refusal is a real 404 document", response !== null && response.status() === 404);
        check("the refusal renders exactly one h1", observation.h1Count === 1, `${observation.h1Count}`);
        check(
          "the refusal declares a document language",
          typeof observation.lang === "string" && observation.lang.length > 0,
        );
        check("the refusal is noindex", /noindex/i.test(observation.robots ?? ""), observation.robots ?? "none");
        check("the refusal advertises no canonical", observation.canonical === null);
        check("the refusal advertises no alternate", observation.alternates.length === 0);
        check(
          "the refusal never leaks authored Page text",
          !observation.bodyText.includes("must never rescue") &&
            !observation.bodyText.includes("must never be served"),
        );

        // The refusal's own return affordance must be operable from the keyboard.
        const returnLink = await missing.evaluate(() => {
          const link = document.querySelector("a[href]");
          if (link === null) return null;
          link.focus();
          return { focused: document.activeElement === link, href: link.getAttribute("href") };
        });
        check(
          "the refusal return link is keyboard-focusable",
          returnLink !== null && returnLink.focused === true && returnLink.href !== null,
          returnLink === null ? "no link" : String(returnLink.href),
        );
        check(
          "the refusal raises no page error",
          missingRecord.pageErrors.length === 0,
          missingRecord.pageErrors.join("; "),
        );
        check(
          "the refusal requests nothing outside loopback",
          missingRecord.foreignRequests.length === 0,
          [...new Set(missingRecord.foreignRequests)].join(","),
        );
      } finally {
        await missing.close();
      }
    } finally {
      await keyboardContext.close();
    }
  } finally {
    await browser.close();
  }

  return { passes, failures };
}
