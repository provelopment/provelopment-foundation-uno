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
              Foundation Uno will bring an organisation&apos;s websites, information and regional
              editions into one coherent publishing foundation. Clear ownership and reusable
              content will make updates simpler, keep messages consistent and give visitors a
              dependable experience across every page.
            </p>
            <div className="uno-actions">
              <a className="uno-button" href={SOURCE_URL} rel="noreferrer">
                Explore the open-source project
              </a>
              <a className="uno-button uno-button--quiet" href="#status">
                See how it will work
              </a>
            </div>
            <p className="uno-note">
              This is the live single-page introduction to Foundation Uno. The examples below
              illustrate the experience its complete publishing foundation will deliver.
            </p>
          </div>
        </section>

        <section id="how-it-is-organized" className="uno-section" aria-labelledby="organized-title">
          <div className="uno-shell">
            <h2 id="organized-title">A clear structure. Less duplication. Better decisions.</h2>
            <p className="uno-section__lede">
              Every part of the web presence will belong to one accountable organisation.
              Five connected layers will keep information organised while giving each audience
              the clarity and relevance it needs.
            </p>
            <ol className="uno-stack">
              <li>
                <h3>One Entity</h3>
                <p>
                  One organisation will own the entire foundation. Teams will know who is
                  responsible for every publication decision, without competing owners or
                  duplicated governance.
                </p>
              </li>
              <li>
                <h3>Purposeful Facets</h3>
                <p>
                  Services, programmes and other areas of work will have distinct places within
                  that organisation. Visitors will find the information relevant to them without
                  losing the connection to the wider brand.
                </p>
              </li>
              <li>
                <h3>Deliberate Sites</h3>
                <p>
                  Each Site will serve a defined purpose. Publication will select one public
                  Site at a time, providing a clear, intentional experience instead of
                  competing versions of the same presence.
                </p>
              </li>
              <li>
                <h3>Reliable Pages</h3>
                <p>
                  Pages will draw from explicitly authored content sources, including Markdown
                  and JSON. Editors will review changes before publication, and teams will
                  retain a transparent record of what was changed and why.
                </p>
              </li>
              <li>
                <h3>Thoughtful regional editions</h3>
                <p>
                  Language-and-region editions will be written and maintained deliberately.
                  International and regional visitors will receive relevant information without
                  the site guessing their language from a device or location.
                </p>
              </li>
            </ol>
            <p className="uno-note uno-note--inline">
              The result will be a more understandable content structure for teams and a more
              consistent, trustworthy experience for their audiences.
            </p>
          </div>
        </section>

        <section id="status" className="uno-section" aria-labelledby="status-title">
          <div className="uno-shell">
            <h2 id="status-title">What this will mean in practice</h2>
            <p className="uno-section__lede">
              Foundation Uno is designed for organisations that want clear communication,
              reliable publishing and room to grow. These illustrative examples show the
              practical benefits of the finished system.
            </p>
            <div className="uno-grid">
              <article className="uno-card">
                <h3>Example: a community organisation</h3>
                <p>
                  A community organisation delivering training, outreach and membership
                  services will present each programme in a dedicated area of one coherent
                  website. Staff will publish reviewed updates without rebuilding the same
                  information in several places.
                </p>
                <ul>
                  <li>Members will find the right service faster through clear organisation.</li>
                  <li>Editors will maintain one accountable source for each page.</li>
                  <li>The organisation will keep a consistent identity across its programmes.</li>
                </ul>
              </article>
              <article className="uno-card">
                <h3>Example: a service provider with regional audiences</h3>
                <p>
                  A service provider working with local and international clients will publish
                  separately authored regional editions of its key pages. Each audience will
                  receive information written for its needs, with explicit page addresses and
                  deliberate publication choices.
                </p>
                <ul>
                  <li>Visitors will receive relevant wording and guidance by region.</li>
                  <li>Editors will control each edition instead of relying on automatic guesses.</li>
                  <li>Teams will review changes with predictable, testable publishing rules.</li>
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
