import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useProjectContext } from '../layout/ProjectShell';
import type { Dashboard } from '../types/api';
import { Avatar } from '../ui/Avatar';
import { OverdueChip, PriorityBadge, StatusBadge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { fmtRelative } from '../lib/dates';

export function ProjectOverviewPage() {
  const { project } = useProjectContext();

  const dashboardQuery = useQuery({
    queryKey: ['project-dashboard', project.id],
    queryFn: async () => {
      const { data } = await api.get<{ dashboard: Dashboard }>(
        `/projects/${project.id}/dashboard`,
      );
      return data.dashboard;
    },
  });

  if (dashboardQuery.isLoading) {
    return (
      <div className="grid h-40 place-items-center">
        <Spinner />
      </div>
    );
  }

  const d = dashboardQuery.data;
  if (!d) return null;

  return (
    <div className="grid gap-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total tasks" value={d.counts.total} />
        <Stat label="In progress" value={d.counts.inProgress} accent />
        <Stat label="Overdue" value={d.counts.overdue} tone={d.counts.overdue > 0 ? 'rose' : undefined} />
        <Stat label="Due this week" value={d.counts.dueThisWeek} />
      </section>

      <section className="card p-5">
        <header className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-800">Completion</h2>
          <span className="text-sm font-medium text-ink-700">{d.completion}%</span>
        </header>
        <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
          <div
            className="h-full rounded-full bg-moss-500 transition-[width]"
            style={{ width: `${d.completion}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-500">
          <span>To do: {d.counts.todo}</span>
          <span>In progress: {d.counts.inProgress}</span>
          <span>Done: {d.counts.done}</span>
          <span className="ml-auto">High priority: {d.byPriority.high}</span>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <header className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-800">Overdue</h2>
            <Link
              to="board"
              className="text-xs font-medium text-accent-700 hover:underline"
            >
              View board
            </Link>
          </header>
          {d.overdue.length === 0 ? (
            <p className="text-sm text-ink-500">Nothing is overdue. Nice.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {d.overdue.map((t) => (
                <li key={t.id} className="flex items-start gap-3 py-2">
                  <Link
                    to={`tasks/${t.id}`}
                    className="flex-1 text-sm font-medium text-ink-800 hover:text-accent-700"
                  >
                    {t.title}
                  </Link>
                  <OverdueChip />
                  {t.assignee && <Avatar name={t.assignee.name} size="xs" />}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-ink-800">Recently updated</h2>
          {d.recent.length === 0 ? (
            <p className="text-sm text-ink-500">No tasks yet.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {d.recent.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`tasks/${t.id}`}
                      className="block truncate text-sm font-medium text-ink-800 hover:text-accent-700"
                    >
                      {t.title}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-500">
                      <StatusBadge status={t.status} />
                      <PriorityBadge priority={t.priority} />
                      <span>updated {fmtRelative(t.updatedAt)}</span>
                    </div>
                  </div>
                  {t.assignee && <Avatar name={t.assignee.name} size="sm" />}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink-800">Workload</h2>
        {d.topAssignees.length === 0 ? (
          <p className="text-sm text-ink-500">No assignments yet.</p>
        ) : (
          <ul className="space-y-2">
            {d.topAssignees.map((row, idx) => (
              <li key={row.user?.id ?? idx} className="flex items-center gap-3">
                <Avatar name={row.user?.name ?? 'Unassigned'} size="sm" />
                <div className="flex-1">
                  <div className="text-sm text-ink-800">{row.user?.name ?? 'Unassigned'}</div>
                </div>
                <div className="w-40">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full bg-accent-500"
                      style={{ width: `${Math.min(100, (row.count / Math.max(1, d.counts.total)) * 100)}%` }}
                    />
                  </div>
                </div>
                <span className="w-8 text-right text-xs text-ink-500">{row.count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  tone,
}: {
  label: string;
  value: number;
  accent?: boolean;
  tone?: 'rose';
}) {
  return (
    <div className="card flex flex-col gap-1 p-4">
      <span className="label">{label}</span>
      <span
        className={`text-2xl font-semibold tracking-tight ${
          tone === 'rose' ? 'text-rose-500' : accent ? 'text-accent-700' : 'text-ink-900'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
