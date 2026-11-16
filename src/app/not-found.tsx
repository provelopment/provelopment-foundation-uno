import Link from 'next/link';

/**
 * Ordinary 404 for unknown routes.
 *
 * No implicit Site and no locale guess: `/en`, `/en-001`, `/about` and any other unknown path reach
 * this response until a later stage supplies real routing authority. The link returns to the one
 * page that actually exists.
 */
export default function NotFound() {
  return (
    <main className="uno-shell uno-narrow">
      <h1>Page not found</h1>
      <p>
        This address is not part of the Foundation Uno demonstration. Nothing is authored,
        selected or served at it yet, and no locale route is enabled.
      </p>
      <p>
        <Link className="uno-link" href="/">
          Go to the Foundation Uno homepage
        </Link>
      </p>
    </main>
  );
}
