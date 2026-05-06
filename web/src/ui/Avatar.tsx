import { clsx } from 'clsx';

const COLORS = [
  'bg-accent-500 text-white',
  'bg-moss-500 text-white',
  'bg-amber-500 text-white',
  'bg-rose-500 text-white',
  'bg-ink-700 text-white',
];

function pickColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length] ?? COLORS[0];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return ((parts[0][0] ?? '') + (parts[parts.length - 1]![0] ?? '')).toUpperCase();
}

export function Avatar({
  name,
  size = 'md',
  className,
}: {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center rounded-full font-semibold',
        size === 'xs' && 'h-5 w-5 text-[10px]',
        size === 'sm' && 'h-6 w-6 text-xs',
        size === 'md' && 'h-8 w-8 text-sm',
        size === 'lg' && 'h-10 w-10 text-base',
        pickColor(name),
        className,
      )}
      title={name}
    >
      {initials(name)}
    </span>
  );
}
