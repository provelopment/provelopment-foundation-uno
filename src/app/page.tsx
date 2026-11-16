/**
 * Foundation Uno — English informational demonstration homepage.
 *
 * This is the visitor-facing introduction to the project, not the P05 authored EFS Home Page and
 * not a published Uno Site. It is static server-rendered HTML: no client component, no fetch, no
 * manifest, no module renderer and no route authority are involved. The page states plainly what
 * exists as tested GitHub code today versus what is still an intention, and it carries the
 * pre-publication `noindex, nofollow` policy set in the root layout.
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
          <p className="uno-brand">Foundation Uno</p>
          <nav className="uno-nav" aria-label="On this page">
            <ul>
              <li>
                <a href="#how-it-is-organized">How it is organized</a>
              </li>
              <li>
                <a href="#status">Status</a>
              </li>
              <li>
                <a href="#explore">Explore the code</a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main id="main">
        <section className="uno-hero" aria-labelledby="hero-title">
          <div className="uno-shell">
            <p className="uno-eyebrow">Independent · Apache-2.0 · Next.js + TypeScript</p>
            <h1 id="hero-title" className="uno-hero__title">
              Foundation Uno — a single-Entity website foundation
            </h1>
            <p className="uno-hero__lede">
              Foundation Uno is an independent Apache-2.0 Next.js and TypeScript website
              foundation built around <strong>one Entity</strong>: a single owner whose Facets,
              Sites, Pages and explicitly authored, region-qualified locales stay in one coherent
              and reviewable structure.
            </p>
            <div className="uno-actions">
              <a className="uno-button" href={SOURCE_URL} rel="noreferrer">
                Explore the code on GitHub
              </a>
              <a className="uno-button uno-button--quiet" href="#status">
                See what works today
              </a>
            </div>
            <p className="uno-note">
              English demonstration — full authored Site publication is not yet enabled.
            </p>
          </div>
        </section>

        <section
          id="how-it-is-organized"
          className="uno-section"
          aria-labelledby="organized-title"
        >
          <div className="uno-shell">
            <h2 id="organized-title">How it is organized</h2>
            <p className="uno-section__lede">
              One owner, four levels above it. This is the planned contract the foundation is
              being built toward: today only the smallest pure primitives for it exist as tested
              code.
            </p>
            <ol className="uno-stack">
              <li>
                <h3>Entity</h3>
                <p>Exactly one owner of the installation, and the only publisher in it.</p>
              </li>
              <li>
                <h3>Facets</h3>
                <p>Named areas of that owner&rsquo;s presence, each with a single purpose.</p>
              </li>
              <li>
                <h3>Sites</h3>
                <p>Exactly one public Site is selected at a time; no fan-out and no hidden publisher.</p>
              </li>
              <li>
                <h3>Pages</h3>
                <p>
                  Authored content, written as JSON or Markdown, with one declared source answering
                  for each Page representation.
                </p>
              </li>
              <li>
                <h3>Localized representations</h3>
                <p>
                  Explicitly authored, region-qualified locales such as en-001 — never guessed from
                  a browser header, a cookie or a visitor&rsquo;s address.
                </p>
              </li>
            </ol>
            <p className="uno-note uno-note--inline">
              Planned contract, not a working publication: no manifest, reader, route authority or
              module renderer for it is implemented yet.
            </p>
          </div>
        </section>

        <section id="status" className="uno-section" aria-labelledby="status-title">
          <div className="uno-shell">
            <h2 id="status-title">What works today and what comes next</h2>
            <p className="uno-section__lede">
              Uno is an engineering foundation, not a finished website. This split is the honest
              boundary between the two.
            </p>
            <div className="uno-grid">
              <article className="uno-card">
                <h3>What works today</h3>
                <ul>
                  <li>
                    A reproducible Next.js 16 and React 19 TypeScript baseline that builds and
                    serves, verified on Ubuntu and Windows CI.
                  </li>
                  <li>
                    Pure, unit-tested identity, content-slug, route-path and author-URL safety
                    primitives.
                  </li>
                  <li>
                    A tested declared-source policy, plus an application resolver that delegates
                    every precedence decision to it.
                  </li>
                  <li>
                    Architecture tests that refuse framework, adapter and Node I/O imports in the
                    pure and application layers.
                  </li>
                  <li>Apache-2.0 licensing and two-host GitHub Actions on every push.</li>
                </ul>
              </article>
              <article className="uno-card">
                <h3>What&rsquo;s next</h3>
                <ul>
                  <li>An EFS manifest with source ownership and confined readers.</li>
                  <li>
                    Authored page rendering and the 22-module presentation system across the 17
                    capability families.
                  </li>
                  <li>Region-qualified locale routing and public route authority.</li>
                  <li>
                    A publication decision, a deliberate release and an Owner-controlled
                    deployment.
                  </li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section id="explore" className="uno-section" aria-labelledby="explore-title">
          <div className="uno-shell">
            <h2 id="explore-title">Explore the code</h2>
            <p className="uno-section__lede">
              Everything described above is public, reviewable source with its own tests and
              continuous verification. The repository is the record of progress.
            </p>
            <p>
              <a className="uno-link" href={SOURCE_URL} rel="noreferrer">
                Read the Foundation Uno repository on GitHub
              </a>
            </p>
            <p className="uno-note uno-note--inline">
              This page is an English informational demonstration. It is not an authored EFS Site,
              it serves no locale route, and full authored Site publication is not yet enabled.
            </p>
          </div>
        </section>
      </main>

      <footer className="uno-footer">
        <div className="uno-shell">
          <p>
            Foundation Uno — an English demonstration page. The authored public A1 website is not
            implemented yet: there is no published Site, no locale route, no release and no live
            deployment behind this address.
          </p>
        </div>
      </footer>
    </div>
  );
}
