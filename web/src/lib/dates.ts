import { format, formatDistanceToNowStrict, isBefore, isToday, isTomorrow, parseISO } from 'date-fns';

export function fmtDate(iso: string | Date | null | undefined): string {
  if (!iso) return '';
  const d = typeof iso === 'string' ? parseISO(iso) : iso;
  return format(d, 'd MMM yyyy');
}

export function fmtRelative(iso: string | Date | null | undefined): string {
  if (!iso) return '';
  const d = typeof iso === 'string' ? parseISO(iso) : iso;
  return formatDistanceToNowStrict(d, { addSuffix: true });
}

export function dueLabel(iso: string | null | undefined): { label: string; tone: 'normal' | 'soon' | 'overdue' } {
  if (!iso) return { label: '', tone: 'normal' };
  const d = parseISO(iso);
  if (isBefore(d, new Date())) return { label: `Was due ${fmtDate(iso)}`, tone: 'overdue' };
  if (isToday(d)) return { label: 'Due today', tone: 'soon' };
  if (isTomorrow(d)) return { label: 'Due tomorrow', tone: 'soon' };
  return { label: `Due ${fmtDate(iso)}`, tone: 'normal' };
}

export function isOverdue(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return isBefore(parseISO(iso), new Date());
}
