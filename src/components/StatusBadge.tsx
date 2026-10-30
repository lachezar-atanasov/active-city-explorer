import { STATUS_LABELS, type Status } from '../lib/types';

const COLOR: Record<Status, string> = {
  open: 'var(--state-open)',
  closed: 'var(--state-closed)',
  unknown: 'var(--muted)',
  'temporarily-closed': 'var(--state-temp)',
};

// Shape repeats the state, so it never depends on colour alone.
export function StatusMark({ status, size = 10 }: { status: Status; size?: number }) {
  const c = COLOR[status];
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden="true" className="shrink-0">
      {status === 'temporarily-closed' ? (
        <rect x="2" y="2" width="6" height="6" transform="rotate(45 5 5)" fill={c} />
      ) : status === 'unknown' ? (
        <circle cx="5" cy="5" r="3.5" fill="none" stroke={c} strokeWidth="1.5" />
      ) : (
        <circle cx="5" cy="5" r={status === 'open' ? 4.5 : 3.5} fill={c} />
      )}
    </svg>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-ink">
      <StatusMark status={status} />
      {STATUS_LABELS[status]}
    </span>
  );
}
