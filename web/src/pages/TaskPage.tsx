import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, extractErrorMessage } from '../lib/api';
import { useProjectContext } from '../layout/ProjectShell';
import type { Comment, Priority, Task, TaskStatus } from '../types/api';
import { Avatar } from '../ui/Avatar';
import { OverdueChip, PriorityBadge, StatusBadge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { useToast } from '../ui/ToastProvider';
import { fmtDate, fmtRelative, isOverdue } from '../lib/dates';
import { useAuth } from '../auth/AuthProvider';

export function TaskPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const { project } = useProjectContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const taskQuery = useQuery({
    queryKey: ['task', taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data } = await api.get<{ task: Task & { comments: Comment[] } }>(`/tasks/${taskId}`);
      return data.task;
    },
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'dueDate' | 'assigneeId'>>) => {
      const { data } = await api.patch<{ task: Task }>(`/tasks/${taskId}`, patch);
      return data.task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks', project.id] });
      queryClient.invalidateQueries({ queryKey: ['project-dashboard', project.id] });
    },
    onError: (err) => toast.push(extractErrorMessage(err, 'Could not save task'), 'error'),
  });

  const remove = useMutation({
    mutationFn: async () => {
      await api.delete(`/tasks/${taskId}`);
    },
    onSuccess: () => {
      toast.push('Task deleted', 'success');
      queryClient.invalidateQueries({ queryKey: ['project-tasks', project.id] });
      queryClient.invalidateQueries({ queryKey: ['project-dashboard', project.id] });
      navigate(`/projects/${project.id}/board`);
    },
    onError: (err) => toast.push(extractErrorMessage(err, 'Could not delete task'), 'error'),
  });

  const [body, setBody] = useState('');
  const addComment = useMutation({
    mutationFn: async () => {
      await api.post(`/tasks/${taskId}/comments`, { body });
    },
    onSuccess: () => {
      setBody('');
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    },
    onError: (err) => toast.push(extractErrorMessage(err, 'Could not post comment'), 'error'),
  });

  if (taskQuery.isLoading) {
    return (
      <div className="grid h-40 place-items-center">
        <Spinner />
      </div>
    );
  }

  const task = taskQuery.data;
  if (!task) {
    return (
      <div className="card p-6 text-sm text-rose-500">
        This task could not be loaded. <Link to={`/projects/${project.id}/board`}>Back to board</Link>.
      </div>
    );
  }

  const canEdit =
    project.myRole === 'ADMIN' || task.createdById === user?.id || task.assigneeId === user?.id;
  const canDelete = project.myRole === 'ADMIN' || task.createdById === user?.id;

  return (
    <article className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Link
              to={`/projects/${project.id}/board`}
              className="text-xs uppercase tracking-wider text-ink-500 hover:text-ink-800"
            >
              ← Back to board
            </Link>
            <EditableTitle
              title={task.title}
              disabled={!canEdit}
              onSave={(v) => update.mutate({ title: v })}
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {task.dueDate && task.status !== 'DONE' && isOverdue(task.dueDate) && <OverdueChip />}
            </div>
          </div>
        </div>

        <EditableBody
          body={task.description ?? ''}
          disabled={!canEdit}
          onSave={(v) => update.mutate({ description: v.trim() ? v : null })}
        />

        <div className="mt-6 border-t border-ink-100 pt-5">
          <h3 className="text-sm font-semibold text-ink-800">Activity</h3>
          <ul className="mt-3 space-y-3">
            {task.comments.map((c) => (
              <li key={c.id} className="flex items-start gap-3">
                <Avatar name={c.user.name} />
                <div className="flex-1">
                  <div className="text-sm">
                    <span className="font-medium text-ink-800">{c.user.name}</span>
                    <span className="ml-2 text-xs text-ink-500">{fmtRelative(c.createdAt)}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700">{c.body}</p>
                </div>
              </li>
            ))}
            {task.comments.length === 0 && (
              <li className="text-sm text-ink-500">No comments yet — be the first.</li>
            )}
          </ul>
          <form
            className="mt-4 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!body.trim()) return;
              addComment.mutate();
            }}
          >
            <textarea
              className="input min-h-[80px]"
              placeholder="Write a comment…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={2000}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn-primary"
                disabled={addComment.isPending || !body.trim()}
              >
                {addComment.isPending ? 'Posting…' : 'Post comment'}
              </button>
            </div>
          </form>
        </div>
      </section>

      <aside className="card flex flex-col gap-4 p-5">
        <h3 className="text-sm font-semibold text-ink-800">Details</h3>
        <Field label="Status">
          <select
            className="input"
            value={task.status}
            disabled={!canEdit}
            onChange={(e) => update.mutate({ status: e.target.value as TaskStatus })}
          >
            <option value="TODO">To do</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="DONE">Done</option>
          </select>
        </Field>
        <Field label="Priority">
          <select
            className="input"
            value={task.priority}
            disabled={!canEdit}
            onChange={(e) => update.mutate({ priority: e.target.value as Priority })}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </Field>
        <Field label="Assignee">
          <select
            className="input"
            value={task.assigneeId ?? ''}
            disabled={!canEdit}
            onChange={(e) =>
              update.mutate({ assigneeId: e.target.value ? e.target.value : null })
            }
          >
            <option value="">Unassigned</option>
            {project.members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.user.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Due date">
          <input
            type="date"
            className="input"
            value={task.dueDate ? task.dueDate.slice(0, 10) : ''}
            disabled={!canEdit}
            onChange={(e) =>
              update.mutate({
                dueDate: e.target.value ? new Date(e.target.value).toISOString() : null,
              })
            }
          />
        </Field>
        <div className="text-xs text-ink-500">
          Created by {task.createdBy.name} · {fmtDate(task.createdAt)}
        </div>
        {canDelete && (
          <button
            type="button"
            className="btn-danger mt-2"
            onClick={() => {
              if (confirm('Delete this task? This cannot be undone.')) remove.mutate();
            }}
          >
            Delete task
          </button>
        )}
      </aside>
    </article>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

function EditableTitle({
  title,
  disabled,
  onSave,
}: {
  title: string;
  disabled?: boolean;
  onSave: (v: string) => void;
}) {
  const [value, setValue] = useState(title);
  useEffect(() => setValue(title), [title]);
  return (
    <input
      className="mt-2 w-full bg-transparent text-xl font-semibold tracking-tight text-ink-900 focus:outline-none"
      value={value}
      disabled={disabled}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value.trim() && value !== title) onSave(value.trim());
      }}
    />
  );
}

function EditableBody({
  body,
  disabled,
  onSave,
}: {
  body: string;
  disabled?: boolean;
  onSave: (v: string) => void;
}) {
  const [value, setValue] = useState(body);
  useEffect(() => setValue(body), [body]);
  return (
    <textarea
      className="mt-3 min-h-[120px] w-full resize-y rounded-md border border-transparent bg-transparent p-2 text-sm text-ink-700 placeholder-ink-400 hover:border-ink-200 focus:border-accent-300 focus:bg-white"
      placeholder="Add a description…"
      value={value}
      disabled={disabled}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value !== body) onSave(value);
      }}
    />
  );
}
