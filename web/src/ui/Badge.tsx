import { clsx } from 'clsx';
import type { Priority, TaskStatus } from '../types/api';

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={clsx(
        'chip',
        status === 'TODO' && 'bg-ink-100 text-ink-700',
        status === 'IN_PROGRESS' && 'bg-accent-100 text-accent-700',
        status === 'DONE' && 'bg-moss-400/20 text-moss-600',
      )}
    >
      {status === 'IN_PROGRESS' ? 'In progress' : status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={clsx(
        'chip',
        priority === 'LOW' && 'bg-ink-100 text-ink-600',
        priority === 'MEDIUM' && 'bg-amber-400/15 text-amber-500',
        priority === 'HIGH' && 'bg-rose-400/15 text-rose-500',
      )}
    >
      {priority.charAt(0) + priority.slice(1).toLowerCase()}
    </span>
  );
}

export function RoleBadge({ role }: { role: 'ADMIN' | 'MEMBER' }) {
  return (
    <span
      className={clsx(
        'chip',
        role === 'ADMIN' ? 'bg-accent-100 text-accent-700' : 'bg-ink-100 text-ink-600',
      )}
    >
      {role === 'ADMIN' ? 'Admin' : 'Member'}
    </span>
  );
}

export function OverdueChip() {
  return <span className="chip bg-rose-400/15 text-rose-500">Overdue</span>;
}
