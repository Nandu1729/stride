import { useQuery } from '@tanstack/react-query';
import { NavLink, Outlet, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import type { ProjectDetail } from '../types/api';
import { Spinner } from '../ui/Spinner';
import { RoleBadge } from '../ui/Badge';
import { createContext, useContext } from 'react';

interface ProjectContextValue {
  project: ProjectDetail;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function useProjectContext(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProjectContext must be used inside a project route');
  return ctx;
}

export function ProjectShell() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['project', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<{ project: ProjectDetail }>(`/projects/${id}`);
      return data.project;
    },
  });

  if (isLoading) {
    return (
      <div className="grid h-64 place-items-center">
        <Spinner />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="card p-6 text-sm text-rose-500">
        {(error as Error)?.message ?? 'Project could not be loaded.'}
      </div>
    );
  }

  return (
    <ProjectContext.Provider value={{ project: data }}>
      <div className="space-y-6">
        <div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{data.name}</h1>
              {data.description && (
                <p className="mt-1 max-w-2xl text-sm text-ink-500">{data.description}</p>
              )}
            </div>
            <RoleBadge role={data.myRole} />
          </div>
          <nav className="mt-4 flex gap-1 border-b border-ink-100">
            <Tab to=".">Overview</Tab>
            <Tab to="board">Board</Tab>
            <Tab to="members">Members</Tab>
            {data.myRole === 'ADMIN' && <Tab to="settings">Settings</Tab>}
          </nav>
        </div>
        <Outlet />
      </div>
    </ProjectContext.Provider>
  );
}

function Tab({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={to === '.'}
      className={({ isActive }) =>
        `border-b-2 px-3 py-2 text-sm font-medium ${
          isActive
            ? 'border-accent-600 text-ink-900'
            : 'border-transparent text-ink-500 hover:text-ink-800'
        }`
      }
    >
      {children}
    </NavLink>
  );
}
