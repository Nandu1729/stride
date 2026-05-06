import { useState } from 'react';
import { api, extractErrorMessage } from '../lib/api';
import type { Priority, ProjectDetail, TaskStatus } from '../types/api';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/ToastProvider';
import { useMutation } from '@tanstack/react-query';

interface Props {
  open: boolean;
  onClose: () => void;
  project: ProjectDetail;
  onCreated: () => void;
  defaultStatus?: TaskStatus;
}

export function CreateTaskModal({ open, onClose, project, onCreated, defaultStatus }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus ?? 'TODO');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const toast = useToast();

  function reset() {
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    setStatus(defaultStatus ?? 'TODO');
    setAssigneeId('');
    setDueDate('');
  }

  const create = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        priority,
        status,
      };
      if (description.trim()) payload.description = description.trim();
      if (assigneeId) payload.assigneeId = assigneeId;
      if (dueDate) payload.dueDate = new Date(dueDate).toISOString();
      await api.post(`/projects/${project.id}/tasks`, payload);
    },
    onSuccess: () => {
      toast.push('Task created', 'success');
      reset();
      onClose();
      onCreated();
    },
    onError: (err) => toast.push(extractErrorMessage(err, 'Could not create task'), 'error'),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New task"
      size="lg"
      footer={
        <>
          <button className="btn-ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            type="button"
            disabled={create.isPending || !title.trim()}
            onClick={() => create.mutate()}
          >
            {create.isPending ? 'Creating…' : 'Create task'}
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="t-title">
            Title
          </label>
          <input
            id="t-title"
            className="input mt-1"
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to happen?"
            autoFocus
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="t-desc">
            Description
          </label>
          <textarea
            id="t-desc"
            className="input mt-1 min-h-[100px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={5000}
            placeholder="Acceptance criteria, links, notes…"
          />
        </div>
        <div>
          <label className="label" htmlFor="t-status">
            Status
          </label>
          <select
            id="t-status"
            className="input mt-1"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
          >
            <option value="TODO">To do</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="DONE">Done</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="t-priority">
            Priority
          </label>
          <select
            id="t-priority"
            className="input mt-1"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="t-assignee">
            Assignee
          </label>
          <select
            id="t-assignee"
            className="input mt-1"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
          >
            <option value="">Unassigned</option>
            {project.members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.user.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="t-due">
            Due date
          </label>
          <input
            id="t-due"
            type="date"
            className="input mt-1"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
