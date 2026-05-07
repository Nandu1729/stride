import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export function LandingPage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-accent-700 text-white">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path d="M5 8h3l9 9h-3z" fill="currentColor" />
              <path d="M5 14h3l5 5H10z" fill="currentColor" opacity="0.6" />
            </svg>
          </span>
          <span className="text-sm font-semibold tracking-wide text-ink-800">Stride</span>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          {!loading && user ? (
            <Link to="/projects" className="btn-primary">
              Open app
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">
                Log in
              </Link>
              <Link to="/signup" className="btn-primary">
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-6 pt-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-600">
          Team task manager
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
          Plan a project, share it with your team, get the right work done first.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-ink-500">
          Stride is a small, calm task manager for small teams. Create a project, invite admins
          and members, work through a board, and watch what is overdue. No clutter.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          {!loading && user ? (
            <Link to="/projects" className="btn-primary">
              Continue to your projects
            </Link>
          ) : (
            <>
              <Link to="/signup" className="btn-primary">
                Create an account
              </Link>
              <Link to="/login" className="btn-outline">
                Log in
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="mx-auto mt-20 grid max-w-5xl gap-4 px-6 pb-20 sm:grid-cols-3">
        <Feature
          title="Projects with roles"
          body="Every project has an admin and members. Admins manage the team and project settings; members work the board."
        />
        <Feature
          title="A board you can scan"
          body="Three columns: To do, In progress, Done. Drag tasks across, filter by assignee or priority, see what is overdue."
        />
        <Feature
          title="A dashboard you can trust"
          body="Counts by status, the upcoming week, top assignees, and a completion bar. No fake metrics."
        />
      </section>

      <footer className="border-t border-ink-100 py-6 text-center text-xs text-ink-500">
        Built for the Ethara AI Round 1 assignment by Nanda Kishore Arra.
      </footer>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-ink-800">{title}</h3>
      <p className="mt-1 text-sm text-ink-500">{body}</p>
    </div>
  );
}
