import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, extractErrorMessage } from '../lib/api';
import { useProjectContext } from '../layout/ProjectShell';
import { useToast } from '../ui/ToastProvider';

export function ProjectSettingsPage() {
  const { project } = useProjectContext();
  const queryClient = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? '');

  const update = useMutation({
    mutationFn: async () => {
      await api.patch(`/projects/${project.id}`, {
        name: name.trim(),
        description: description.trim() ? description.trim() : null,
      });
    },
    onSuccess: () => {
      toast.push('Project saved', 'success');
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err) => toast.push(extractErrorMessage(err, 'Could not save'), 'error'),
  });

  const remove = useMutation({
    mutationFn: async () => {
      await api.delete(`/projects/${project.id}`);
    },
    onSuccess: () => {
      toast.push('Project deleted', 'success');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate('/projects', { replace: true });
    },
    onError: (err) => toast.push(extractErrorMessage(err, 'Could not delete'), 'error'),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card p-5">
        <h2 className="text-sm font-semibold text-ink-800">Project details</h2>
        <p className="mt-1 text-xs text-ink-500">
          Visible to everyone on the team. Members cannot edit these.
        </p>
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            update.mutate();
          }}
        >
          <div>
            <label className="label" htmlFor="s-name">
              Name
            </label>
            <input
              id="s-name"
              className="input mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
            />
          </div>
          <div>
            <label className="label" htmlFor="s-desc">
              Description
            </label>
            <textarea
              id="s-desc"
              className="input mt-1 min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled={update.isPending || !name.trim()}>
              {update.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>

      <section className="card p-5">
        <h2 className="text-sm font-semibold text-rose-500">Danger zone</h2>
        <p className="mt-1 text-xs text-ink-500">
          Deleting a project removes all of its tasks, comments, and memberships. This cannot be
          undone.
        </p>
        <div className="mt-4">
          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              const confirmed = confirm(
                `Delete project "${project.name}"? This will remove all tasks and comments.`,
              );
              if (confirmed) remove.mutate();
            }}
            disabled={remove.isPending}
          >
            {remove.isPending ? 'Deleting…' : 'Delete this project'}
          </button>
        </div>
      </section>
    </div>
  );
}
