import { clsx } from 'clsx';

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={clsx(
        'h-5 w-5 animate-spin rounded-full border-2 border-ink-200 border-t-accent-500',
        className,
      )}
    />
  );
}
