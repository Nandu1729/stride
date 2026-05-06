import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-600">404</p>
        <h1 className="mt-2 text-2xl font-bold text-ink-900">This page did not load</h1>
        <p className="mt-2 text-sm text-ink-500">The link might be wrong, or the page was moved.</p>
        <div className="mt-5">
          <Link to="/" className="btn-primary">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
