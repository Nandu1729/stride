import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, extractErrorMessage } from '../lib/api';
import { useProjectContext } from '../layout/ProjectShell';
import type { Priority, Task, TaskStatus } from '../types/api';
import { Avatar } from '../ui/Avatar';
import { OverdueChip, PriorityBadge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { useToast } from '../ui/ToastProvider';
import { dueLabel, isOverdue } from '../lib/dates';
import { CreateTaskModal } from './CreateTaskModal';

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'TODO', title: 'To do' },
  { id: 'IN_PROGRESS', title: 'In progress' },
  { id: 'DONE', title: 'Done' },
];

interface BoardFilter {
  assigneeId?: string;
  priority?: Priority;
  overdueOnly?: boolean;
  q?: string;
}

export function ProjectBoardPage() {
  const { project } = useProjectContext();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<BoardFilter>({});

  const tasksQuery = useQuery({
    queryKey: ['project-tasks', project.id],
    queryFn: async () => {
      const { data } = await api.get<{ tasks: Task[] }>(`/projects/${project.id}/tasks`);
      return data.tasks;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      const { data } = await api.patch<{ task: Task }>(`/tasks/${taskId}/status`, { status });
      return data.task;
    },
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['project-tasks', project.id] });
      const prev = queryClient.getQueryData<Task[]>(['project-tasks', project.id]);
      if (prev) {
        queryClient.setQueryData<Task[]>(
          ['project-tasks', project.id],
          prev.map((t) => (t.id === taskId ? { ...t, status } : t)),
        );
      }
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['project-tasks', project.id], ctx.prev);
      toast.push(extractErrorMessage(err, 'Could not move task'), 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', project.id] });
      queryClient.invalidateQueries({ queryKey: ['project-dashboard', project.id] });
    },
  });

  const filteredByCol = useMemo(() => {
    const tasks = tasksQuery.data ?? [];
    const f = filter;
    const byCol: Record<TaskStatus, Task[]> = { TODO: [], IN_PROGRESS: [], DONE: [] };
    for (const t of tasks) {
      if (f.assigneeId && t.assigneeId !== f.assigneeId) continue;
      if (f.priority && t.priority !== f.priority) continue;
      if (f.overdueOnly && (!t.dueDate || !isOverdue(t.dueDate) || t.status === 'DONE')) continue;
      if (f.q && !`${t.title} ${t.description ?? ''}`.toLowerCase().includes(f.q.toLowerCase())) {
        continue;
      }
      byCol[t.status].push(t);
    }
    return byCol;
  }, [filter, tasksQuery.data]);

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-end gap-3 px-4 py-3">
        <div className="flex-1 min-w-[180px]">
          <label className="label" htmlFor="q">
            Search
          </label>
          <input
            id="q"
            className="input mt-1"
            placeholder="Title or description"
            value={filter.q ?? ''}
            onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value }))}
          />
        </div>
        <div className="w-44">
          <label className="label" htmlFor="f-assignee">
            Assignee
          </label>
          <select
            id="f-assignee"
            className="input mt-1"
            value={filter.assigneeId ?? ''}
            onChange={(e) => setFilter((f) => ({ ...f, assigneeId: e.target.value || undefined }))}
          >
            <option value="">Anyone</option>
            {project.members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.user.name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-36">
          <label className="label" htmlFor="f-priority">
            Priority
          </label>
          <select
            id="f-priority"
            className="input mt-1"
            value={filter.priority ?? ''}
            onChange={(e) =>
              setFilter((f) => ({ ...f, priority: (e.target.value || undefined) as Priority | undefined }))
            }
          >
            <option value="">Any</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={!!filter.overdueOnly}
            onChange={(e) => setFilter((f) => ({ ...f, overdueOnly: e.target.checked }))}
          />
          Overdue only
        </label>
        <div className="ml-auto">
          <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
            New task
          </button>
        </div>
      </div>

      {tasksQuery.isLoading ? (
        <div className="grid h-40 place-items-center">
          <Spinner />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              column={col}
              tasks={filteredByCol[col.id]}
              onDrop={(taskId) => updateStatus.mutate({ taskId, status: col.id })}
            />
          ))}
        </div>
      )}

      <CreateTaskModal
        open={creating}
        onClose={() => setCreating(false)}
        project={project}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['project-tasks', project.id] });
          queryClient.invalidateQueries({ queryKey: ['project-dashboard', project.id] });
        }}
      />
    </div>
  );
}

function Column({
  column,
  tasks,
  onDrop,
}: {
  column: { id: TaskStatus; title: string };
  tasks: Task[];
  onDrop: (taskId: string) => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <section
      className={`card flex min-h-[260px] flex-col gap-2 p-3 transition ${
        over ? 'border-accent-400 ring-2 ring-accent-100' : ''
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const id = e.dataTransfer.getData('text/task-id');
        if (id) onDrop(id);
      }}
    >
      <header className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-ink-800">{column.title}</h3>
        <span className="chip bg-ink-100 text-ink-600">{tasks.length}</span>
      </header>
      <ul className="flex flex-col gap-2">
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} />
        ))}
      </ul>
    </section>
  );
}

function TaskCard({ task }: { task: Task }) {
  const due = dueLabel(task.dueDate);
  return (
    <li
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/task-id', task.id)}
      className="rounded-lg border border-ink-200 bg-white p-3 text-sm shadow-sm hover:border-ink-300"
    >
      <Link to={`tasks/${task.id}`} className="block font-medium text-ink-800 hover:text-accent-700">
        {task.title}
      </Link>
      {task.description && <p className="mt-1 line-clamp-2 text-xs text-ink-500">{task.description}</p>}
      <div className="mt-2 flex items-center gap-2 text-xs text-ink-500">
        <PriorityBadge priority={task.priority} />
        {task.assignee ? <Avatar name={task.assignee.name} size="xs" /> : <span>Unassigned</span>}
        {task.dueDate && task.status !== 'DONE' && due.tone === 'overdue' && <OverdueChip />}
        {task.dueDate && task.status !== 'DONE' && due.tone !== 'overdue' && (
          <span className="text-ink-500">{due.label}</span>
        )}
        {(task._count?.comments ?? 0) > 0 && (
          <span className="ml-auto text-ink-500">{task._count?.comments} comments</span>
        )}
      </div>
    </li>
  );
}
