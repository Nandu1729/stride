import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { Avatar } from '../ui/Avatar';
import { useState } from 'react';

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function onLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/projects" className="flex items-center gap-2 text-ink-900">
            <Logo />
            <span className="text-sm font-semibold tracking-wide">Stride</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <NavLink
              to="/projects"
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 ${isActive ? 'bg-ink-100 text-ink-900' : 'text-ink-600 hover:bg-ink-50'}`
              }
            >
              Projects
            </NavLink>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full p-1 hover:bg-ink-100"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                {user && <Avatar name={user.name} size="sm" />}
                <span className="hidden text-ink-700 sm:inline">{user?.name}</span>
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-48 rounded-lg border border-ink-100 bg-white p-1 shadow-card"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <div className="px-3 py-2 text-xs text-ink-500">{user?.email}</div>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-50"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

function Logo() {
  return (
    <span className="grid h-7 w-7 place-items-center rounded-md bg-accent-700 text-white">
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        <path d="M5 8h3l9 9h-3z" fill="currentColor" />
        <path d="M5 14h3l5 5H10z" fill="currentColor" opacity="0.6" />
      </svg>
    </span>
  );
}
