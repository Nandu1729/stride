import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { extractErrorMessage } from '../lib/api';
import { useToast } from '../ui/ToastProvider';

interface LocationState {
  from?: { pathname: string };
}

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const redirectTo = (location.state as LocationState | null)?.from?.pathname ?? '/projects';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await auth.login(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.push(extractErrorMessage(err, 'Login failed'), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to continue.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="email">
            Work email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input mt-1"
            placeholder="you@team.app"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input mt-1"
            placeholder="At least 8 characters"
          />
        </div>
        <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">
        New here?{' '}
        <Link to="/signup" className="font-medium text-accent-700 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-8 lg:grid-cols-2">
        <aside className="hidden flex-col gap-6 rounded-2xl bg-ink-900 p-10 text-white lg:flex">
          <Link to="/" className="text-xs font-semibold uppercase tracking-[0.25em] text-accent-300">
            Stride
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">
            A calm board for the work that matters this week.
          </h2>
          <ul className="space-y-3 text-sm text-ink-200">
            <li>Role-based projects: admins manage, members move work.</li>
            <li>Three-column board with overdue, due-today, and priority signals.</li>
            <li>A dashboard that does not lie.</li>
          </ul>
        </aside>
        <main>
          <div className="card mx-auto max-w-md p-6">
            <h1 className="text-xl font-semibold text-ink-900">{title}</h1>
            <p className="mt-1 text-sm text-ink-500">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
