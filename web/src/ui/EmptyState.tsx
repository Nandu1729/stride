import type { ReactNode } from 'react';

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
      <div className="h-12 w-12 rounded-full bg-accent-100 grid place-items-center">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent-600"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-ink-800">{title}</h3>
      <p className="max-w-md text-sm text-ink-500">{body}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
