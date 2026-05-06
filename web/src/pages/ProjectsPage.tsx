import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, extractErrorMessage } from '../lib/api';
import type { ProjectListItem } from '../types/api';
import { Spinner } from '../ui/Spinner';
import { EmptyState } from '../ui/EmptyState';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/ToastProvider';
import { fmtRelative } from '../lib/dates';
import { RoleBadge } from '../ui/Badge';

export function ProjectsPage() {
  const [creating, setCreating] = useState(false);

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await api.get<{ projects: ProjectListItem[] }>('/projects');
      return data.projects;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Your projects</h1>
          <p className="mt-1 text-sm text-ink-500">
            Projects you own or were invited to. Open one to see its board.
          </p>
        </div>
        <button type="button" onClick={() => setCreating(true)} className="btn-primary">
          New project
        </button>
      </div>

      {projectsQuery.isLoading && (
        <div className="grid h-40 place-items-center">
          <Spinner />
        </div>
      )}

      {projectsQuery.data && projectsQuery.data.length === 0 && (
        <EmptyState
          title="No projects yet"
          body="Create your first project to start adding tasks and inviting teammates."
          action={
            <button className="btn-primary" onClick={() => setCreating(true)}>
              Create a project
            </button>
          }
        />
      )}

      {projectsQuery.data && projectsQuery.data.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projectsQuery.data.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </ul>
      )}

      <CreateProjectModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

function ProjectCard({ project }: { project: ProjectListItem }) {
  return (
    <li className="card flex flex-col gap-3 p-4 transition hover:border-ink-300">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            to={`/projects/${project.id}`}
            className="text-base font-semibold text-ink-900 hover:text-accent-700"
          >
            {project.name}
          </Link>
          {project.description && (
            <p className="mt-1 line-clamp-2 text-sm text-ink-500">{project.description}</p>
          )}
        </div>
        <RoleBadge role={project.role} />
      </div>
      <div className="flex items-center justify-between text-xs text-ink-500">
        <span>
          {project._count?.tasks ?? 0} task{(project._count?.tasks ?? 0) === 1 ? '' : 's'} ·{' '}
          {project._count?.members ?? 0} member{(project._count?.members ?? 0) === 1 ? '' : 's'}
        </span>
        <span>Joined {fmtRelative(project.joinedAt)}</span>
      </div>
    </li>
  );
}

function CreateProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();
  const toast = useToast();

  const create = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ project: ProjectListItem }>('/projects', {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      return data.project;
    },
    onSuccess: () => {
      toast.push('Project created', 'success');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setName('');
      setDescription('');
      onClose();
    },
    onError: (err) => {
      toast.push(extractErrorMessage(err, 'Could not create project'), 'error');
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New project"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="btn-primary"
            type="button"
            disabled={create.isPending || !name.trim()}
            onClick={() => create.mutate()}
          >
            {create.isPending ? 'Creating…' : 'Create project'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="label" htmlFor="p-name">
            Project name
          </label>
          <input
            id="p-name"
            className="input mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            placeholder="e.g. Stride launch"
            autoFocus
          />
        </div>
        <div>
          <label className="label" htmlFor="p-desc">
            Description (optional)
          </label>
          <textarea
            id="p-desc"
            className="input mt-1 min-h-[80px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            placeholder="A short description of what this project is for."
          />
        </div>
      </div>
    </Modal>
  );
}
