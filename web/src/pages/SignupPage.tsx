import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { extractErrorMessage } from '../lib/api';
import { AuthLayout } from './LoginPage';
import { useToast } from '../ui/ToastProvider';

export function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.push('Password must be at least 8 characters', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await auth.signup(name.trim(), email.trim(), password);
      navigate('/projects', { replace: true });
    } catch (err) {
      toast.push(extractErrorMessage(err, 'Sign up failed'), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="It takes about ten seconds.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="name">
            Your name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input mt-1"
            placeholder="e.g. Aanya Mehta"
          />
        </div>
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
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input mt-1"
            placeholder="At least 8 characters"
          />
        </div>
        <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-accent-700 hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
