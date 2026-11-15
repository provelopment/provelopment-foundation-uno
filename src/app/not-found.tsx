import Link from 'next/link';

/**
 * Ordinary 404 for unknown routes.
 *
 * No implicit Site and no locale guess: `/en`, `/en-001`, `/about` and any other unknown
 * path reach this response until a later stage supplies real routing authority.
 */
export default function NotFound() {
  return (
    <main className="uno-baseline">
      <h1>Not found</h1>
      <p>This address does not correspond to a published Uno Site or Page.</p>
      <p>
        <Link href="/">Return to the technical baseline</Link>
      </p>
    </main>
  );
}
