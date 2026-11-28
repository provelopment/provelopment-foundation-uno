/**
 * Foundation Uno — public, independently deployed single-page demonstration.
 * Visitor copy describes the intended finished product in direct, forward-looking language.
 * Illustrative scenarios are examples, not assertions of live customers or delivered features.
 * This static page is NOT an authored EFS Page, and it does not serve a locale route.
 */
import Image from 'next/image';

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
            <Image
              className="uno-brand__mark"
              src="/uno-logo.svg"
              alt="Foundation Uno"
              width={30}
              height={30}
              unoptimized
            />
            <span className="uno-brand__name">Foundation Uno</span>
          </p>
          <nav className="uno-nav" aria-label="On this page">
            <ul>
              <li><a href="#how-it-is-organized">Approach</a></li>
              <li><a href="#status">Examples</a></li>
              <li><a href="#explore">Open source</a></li>
            </ul>
          </nav>
        </div>
      </header>

      <main id="main">
        <section className="uno-hero" aria-labelledby="hero-title">
          <div className="uno-shell">
            <p className="uno-eyebrow">A Provelopment initiative · Open source · Next.js + TypeScript</p>
            <h1 id="hero-title" className="uno-hero__title">
              One organisation. One connected digital presence.
            </h1>
            <p className="uno-hero__lede">
              Foundation Uno brings an organisation&apos;s websites, information and regional
              editions into one coherent publishing foundation. Clear ownership and reusable
              content keep updates simple, messages consistent and the experience dependable
              across every page.
            </p>
            <div className="uno-actions">
              {/* A document navigation is correct here: the published Site has its own root layout. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a className="uno-button" href="/en-001">
                Open the published Site
              </a>
              <a className="uno-button uno-button--quiet" href={SOURCE_URL} rel="noreferrer">
                Explore the open-source project
              </a>
            </div>
            <p className="uno-note">
              This is the non-indexable introduction to Foundation Uno. The pages below describe the
              publishing foundation as it works today; {' '}
              {/* A document navigation is correct here: the published Site has its own root layout. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/en-001">Home</a>,{" "}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/en-001/about">About</a> and{" "}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/en-001/components">Components</a> are published by the same authoring and
              validation rules this page describes.
            </p>
          </div>
        </section>

        <section id="how-it-is-organized" className="uno-section" aria-labelledby="organized-title">
          <div className="uno-shell">
            <h2 id="organized-title">A clear structure. Less duplication. Better decisions.</h2>
            <p className="uno-section__lede">
              Every part of the web presence belongs to one accountable organisation.
              Five connected layers keep information organised while giving each audience
              the clarity and relevance it needs.
            </p>
            <ol className="uno-stack">
              <li>
                <h3>One Entity</h3>
                <p>
                  One organisation owns the entire foundation. Teams know who is
                  responsible for every publication decision, without competing owners or
                  duplicated governance.
                </p>
              </li>
              <li>
                <h3>Purposeful Facets</h3>
                <p>
                  Services, programmes and other areas of work have distinct places within
                  that organisation. Visitors find the information relevant to them without
                  losing the connection to the wider brand.
                </p>
              </li>
              <li>
                <h3>Deliberate Sites</h3>
                <p>
                  Each Site serves a defined purpose, and several Sites can be published side by
                  side — each on its own address, each with its own authored Pages. Nothing is
                  duplicated silently: a visitor only ever sees the Site that address belongs to.
                </p>
              </li>
              <li>
                <h3>Reliable Pages</h3>
                <p>
                  Pages are drawn from explicitly authored content sources, including Markdown
                  and JSON, and each one is validated before it can be published. A Page that is
                  not published for an address is refused there rather than guessed at.
                </p>
              </li>
              <li>
                <h3>Thoughtful regional editions</h3>
                <p>
                  Language-and-region editions are written and maintained deliberately, and
                  several can be published at once. International and regional visitors receive
                  the edition that address declares, never one guessed from a device or location.
                </p>
              </li>
            </ol>
            <p className="uno-note uno-note--inline">
              The result is a more understandable content structure for teams and a more
              consistent, trustworthy experience for their audiences.
            </p>
          </div>
        </section>

        <section id="status" className="uno-section" aria-labelledby="status-title">
          <div className="uno-shell">
            <h2 id="status-title">What this means in practice</h2>
            <p className="uno-section__lede">
              Foundation Uno is designed for organisations that want clear communication,
              reliable publishing and room to grow. These examples describe what the foundation
              delivers today, and how an organisation uses it.
            </p>
            <div className="uno-grid">
              <article className="uno-card">
                <h3>Example: a community organisation</h3>
                <p>
                  A community organisation delivering training, outreach and membership
                  services presents each programme in a dedicated area of one coherent
                  website. Staff publish reviewed updates without rebuilding the same
                  information in several places.
                </p>
                <ul>
                  <li>Members find the right service faster through clear organisation.</li>
                  <li>Editors maintain one accountable source for each page.</li>
                  <li>The organisation keeps a consistent identity across its programmes.</li>
                </ul>
              </article>
              <article className="uno-card">
                <h3>Example: a service provider with regional audiences</h3>
                <p>
                  A service provider working with local and international clients publishes
                  separately authored regional editions of its key pages. Each audience will
                  receive information written for its needs, with explicit page addresses and
                  deliberate publication choices.
                </p>
                <ul>
                  <li>Visitors receive relevant wording and guidance by region.</li>
                  <li>Editors control each edition instead of relying on automatic guesses.</li>
                  <li>Teams review changes with predictable, testable publishing rules.</li>
                </ul>
              </article>
            </div>
            <p className="uno-note uno-note--inline">
              These scenarios are illustrations of the intended product experience, not
              descriptions of existing customers or customer deployments.
            </p>
          </div>
        </section>

        <section id="explore" className="uno-section" aria-labelledby="explore-title">
          <div className="uno-shell">
            <h2 id="explore-title">Built in the open. Designed for long-term ownership.</h2>
            <p className="uno-section__lede">
              Foundation Uno is a Provelopment open-source initiative. Its public repository
              brings together the application, architecture and automated tests, so the work
              behind the foundation is visible and independently reviewable.
            </p>
            <p>
              <a className="uno-link" href={SOURCE_URL} rel="noreferrer">
                View Foundation Uno on GitHub
              </a>
            </p>
            <p className="uno-note uno-note--inline">
              The source is available under the Apache-2.0 licence. This live example introduces
              the Foundation Uno approach and its benefits for organisations.
            </p>
          </div>
        </section>
      </main>

      <footer className="uno-footer">
        <div className="uno-shell">
          <p>
            © 2026 Provelopment. Foundation Uno is an open-source website foundation and a
            Provelopment initiative. This is its live single-page demonstration.
          </p>
        </div>
      </footer>
    </div>
  );
}
