/**
 * Foundation Uno — the sole client island's server-rendered contract (`UNO-WO-040 / R01`, U04).
 *
 * These tests render the island on the server and assert the accessibility semantics a browser then operates on: the
 * tab/panel relationship and roving tab stop, the dialog's trigger/title/close wiring, and the carousel's truthful
 * current item. Event-driven behaviour itself is proven in a real browser, not here.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  UnoCarouselIsland,
  UnoModalIsland,
  UnoTabsIsland,
} from "../../src/components/uno-interaction-island";

describe("UnoTabsIsland", () => {
  const markup = renderToStaticMarkup(
    <UnoTabsIsland
      id="tabs"
      label="Sections"
      tabs={[
        { sectionId: "panel-a", label: "Alpha" },
        { sectionId: "panel-b", label: "Beta" },
      ]}
      panels={[<p key="a">Alpha body</p>, <p key="b">Beta body</p>]}
    />,
  );

  it("renders one labelled tablist with a single roving tab stop", () => {
    expect(markup).toContain('role="tablist"');
    expect(markup).toContain('aria-label="Sections"');
    expect(markup).toContain('role="tab"');
    // The first tab is selected and is the only one in the tab order; the second is present but not a tab stop.
    expect(markup).toContain('aria-selected="true"');
    expect(markup).toContain('aria-selected="false"');
    expect(markup).toContain('tabindex="0"');
    expect(markup).toContain('tabindex="-1"');
    expect(markup).toContain('data-uno-active="true"');
  });

  it("wires every tab to its own panel and hides the inactive panel", () => {
    expect(markup).toContain('aria-controls="tabs-panel-panel-a"');
    expect(markup).toContain('id="tabs-tab-panel-a"');
    expect(markup).toContain('aria-labelledby="tabs-tab-panel-a"');
    expect(markup).toContain('role="tabpanel"');
    // Exactly one panel is visible; the other carries `hidden`, so it leaves the tab order and the a11y tree.
    expect(markup.match(/hidden=""/gu)?.length).toBe(1);
  });
});

describe("UnoModalIsland", () => {
  const markup = renderToStaticMarkup(
    <UnoModalIsland closeLabel="Close" id="modal" title="Details" triggerLabel="Open details">
      <p>Dialog body</p>
    </UnoModalIsland>,
  );

  it("renders a real dialog with an explicit trigger, title and close control", () => {
    expect(markup).toContain("<dialog");
    expect(markup).toContain('aria-haspopup="dialog"');
    expect(markup).toContain("Open details");
    expect(markup).toContain("Close");
    // The accessible name comes from `aria-labelledby` on a plain element, so no heading enters the outline.
    expect(markup).toMatch(/aria-labelledby="[^"]+"/u);
    expect(markup).not.toContain("<h2");
    // A closed dialog is `display: none` by the platform, and it is never opened in the server payload.
    expect(markup).not.toContain("open=");
  });
});

describe("UnoCarouselIsland", () => {
  it("states the truthful first item and offers both controls", () => {
    const markup = renderToStaticMarkup(
      <UnoCarouselIsland
        count={3}
        id="carousel"
        items={[<p key="1">One</p>, <p key="2">Two</p>, <p key="3">Three</p>]}
        label="Selected work"
      />,
    );
    expect(markup).toContain('aria-roledescription="carousel"');
    expect(markup).toContain('aria-label="Selected work"');
    expect(markup).toContain("Image 1 of 3");
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('aria-label="Previous image"');
    expect(markup).toContain('aria-label="Next image"');
    // Exactly one item is on stage: the counter can never announce more than is present.
    expect(markup).toContain("One");
    expect(markup).not.toContain("Two");
  });

  it("renders nothing when the item count does not match", () => {
    const markup = renderToStaticMarkup(
      <UnoCarouselIsland count={3} id="broken" items={[<p key="1">One</p>]} label="Broken" />,
    );
    expect(markup).toBe("");
  });
});
