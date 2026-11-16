/**
 * Foundation Uno — public single-page demonstration homepage.
 *
 * This is the visitor-facing introduction to the project. It is static server-rendered HTML: no
 * client component, no fetch, no manifest read and no route authority. The copy describes what is
 * true today — a live single-page demonstration, a validated single-Entity content graph with an
 * authored English Home source, and tested primitives — while stating plainly that content-driven
 * publishing and locale-aware routes are still in development. The authored EFS Home source is not
 * served by this route, and the root layout keeps the project's `noindex, nofollow` policy.
 */
const SOURCE_URL = 'https://github.com/provelopment/provelopment-foundation-uno';

export default function Page() {
  return (
    <div className="uno-page">
      <a className="uno-skip-link" href="#main">
        Skip to main content
      </a>

      <header className="uno-header">
        <div className="uno-shell uno-header__row">
          <p className="uno-brand">
            <img
              className="uno-brand__mark"
              src="/uno-logo.svg"
              alt="Foundation Uno"
              width={30}
              height={30}
            />
            <span className="uno-brand__name">Foundation Uno</span>
          </p>
          <nav className="uno-nav" aria-label="On this page">
            <ul>
              <li>
                <a href="#how-it-is-organized">Architecture</a>
              </li>
              <li>
                <a href="#status">Progress</a>
              </li>
              <li>
                <a href="#explore">Source code</a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main id="main">
        <section className="uno-hero" aria-labelledby="hero-title">
          <div className="uno-shell">
            <p className="uno-eyebrow">A Provelopment initiative · Open source · Next.js + TypeScript</p>
            <h1 id="hero-title" className="uno-hero__title">
              Foundation Uno — a focused foundation for the web
            </h1>
            <p className="uno-hero__lede">
              Foundation Uno is a working, open-source website demonstration from Provelopment,
              designed around a simple principle: one organization, one clear ownership model. Its
              foundation brings together structured content, modern web technology and a deliberate
              approach to extending what a website can do.
            </p>
            <div className="uno-actions">
              <a className="uno-button" href={SOURCE_URL} rel="noreferrer">
                Explore the source on GitHub
              </a>
              <a className="uno-button uno-button--quiet" href="#status">
                See the progress
              </a>
            </div>
            <p className="uno-note">
              You are viewing a live, single-page example of Foundation Uno. The wider
              content-publishing system is being developed in stages.
            </p>
          </div>
        </section>

        <section
          id="how-it-is-organized"
          className="uno-section"
          aria-labelledby="organized-title"
        >
          <div className="uno-shell">
            <h2 id="organized-title">A clear structure for everything you publish</h2>
            <p className="uno-section__lede">
              Uno organizes a website around one accountable owner. Content can be arranged into
              distinct areas, websites, pages and authored language versions without introducing
              competing ownership models.
            </p>
            <ol className="uno-stack">
              <li>
                <h3>Entity</h3>
                <p>The single organization that owns the website and its content.</p>
              </li>
              <li>
                <h3>Facets</h3>
                <p>Distinct areas of the organization&apos;s work, organized under the same owner.</p>
              </li>
              <li>
                <h3>Sites</h3>
                <p>
                  Individual web presences with clearly defined responsibilities and a deliberate
                  publication choice.
                </p>
              </li>
              <li>
                <h3>Pages</h3>
                <p>
                  Structured content with explicit sources, designed to support reliable publishing
                  as the platform grows.
                </p>
              </li>
              <li>
                <h3>Localized representations</h3>
                <p>
                  Language-and-region-specific content authored intentionally, rather than inferred
                  from a visitor&apos;s location.
                </p>
              </li>
            </ol>
            <p className="uno-note uno-note--inline">
              The single-Entity content structure and an English Home source are already defined and
              validated in the codebase. Content-driven publishing and locale-aware routes are
              forthcoming.
            </p>
          </div>
        </section>
        <section id="status" className="uno-section" aria-labelledby="status-title">
          <div className="uno-shell">
            <h2 id="status-title">Working today. Designed to grow.</h2>
            <p className="uno-section__lede">
              This deployed page demonstrates Uno&apos;s current web foundation. The next
              capabilities are being added with explicit contracts, automated tests and clear
              ownership.
            </p>
            <div className="uno-grid">
              <article className="uno-card">
                <h3>Available today</h3>
                <ul>
                  <li>
                    A live, responsive single-page website built with Next.js, React and TypeScript.
                  </li>
                  <li>A validated single-Entity content graph with an authored English Home source.</li>
                  <li>
                    Tested rules for content identity, safe URLs, source selection and authored
                    locale declarations.
                  </li>
                  <li>
                    Automated checks across Windows and Linux, including production HTTP and
                    dependency-security tests.
                  </li>
                  <li>Publicly reviewable source code released under the Apache-2.0 licence.</li>
                </ul>
              </article>
              <article className="uno-card">
                <h3>In development</h3>
                <ul>
                  <li>Serving authored JSON and Markdown content through the website.</li>
                  <li>Locale-aware page addresses, visibility controls and publication metadata.</li>
                  <li>A wider library of layouts, content and interactive components.</li>
                  <li>
                    Reproducible setup, upgrades and release workflows for independent installations.
                  </li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section id="explore" className="uno-section" aria-labelledby="explore-title">
          <div className="uno-shell">
            <h2 id="explore-title">Explore the source</h2>
            <p className="uno-section__lede">
              Foundation Uno is developed in the open. Review the implementation, tests and
              architecture in its GitHub repository, and follow how the foundation evolves.
            </p>
            <p>
              <a className="uno-link" href={SOURCE_URL} rel="noreferrer">
                View Foundation Uno on GitHub
              </a>
            </p>
            <p className="uno-note uno-note--inline">
              The page you are viewing is a self-contained demonstration; the authored content engine
              will power more of the experience as development continues.
            </p>
          </div>
        </section>
      </main>

      <footer className="uno-footer">
        <div className="uno-shell">
          <p>
            Foundation Uno is a Provelopment initiative. A live, open-source demonstration of a
            focused, single-owner website foundation. © 2026 Provelopment.
          </p>
        </div>
      </footer>
    </div>
  );
}
