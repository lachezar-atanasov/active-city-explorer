import { useMemo, useState } from 'react';
import { formatTime, openByHour } from '../lib/hours';
import { DAY_NAMES, type Day, type Place } from '../lib/types';

const card = 'rounded-2xl border border-line bg-surface p-5';
const TOP_ACTIVITIES = 10;

interface HourProps {
  places: Place[];
  day: Day;
  selectedHour: number;
  onPick: (hour: number) => void;
}

export function HourChart({ places, day, selectedHour, onPick }: HourProps) {
  const data = useMemo(() => openByHour(places, day), [places, day]);
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.open));
  const shown = data[hover ?? selectedHour];

  return (
    <figure className={`${card} m-0`}>
      <figcaption>
        <h2 className="font-display text-lg font-semibold">Open by hour, {DAY_NAMES[day]}</h2>
        <p className="text-sm text-muted">Places with known hours only. Click an hour to explore it.</p>
      </figcaption>
      <p className="mt-3 text-sm" aria-live="polite">
        <span className="font-display text-2xl font-semibold tabular-nums">{shown.open}</span>{' '}
        <span className="text-muted">open at {formatTime(shown.hour * 60)}</span>
      </p>
      <div className="mt-2 flex h-40 items-end gap-0.5 border-b border-line" onPointerLeave={() => setHover(null)}>
        {data.map((d) => (
          <button
            key={d.hour}
            type="button"
            aria-label={`${d.open} open at ${formatTime(d.hour * 60)}`}
            aria-pressed={d.hour === selectedHour}
            onPointerEnter={() => setHover(d.hour)}
            onFocus={() => setHover(d.hour)}
            onBlur={() => setHover(null)}
            onClick={() => onPick(d.hour)}
            className="flex h-full min-w-0 flex-1 items-end"
          >
            <span
              className="bar-fill block w-full rounded-t"
              style={{
                height: `${(d.open / max) * 100}%`,
                minHeight: d.open ? 2 : 0,
                background: d.hour === selectedHour || d.hour === hover ? 'var(--ink)' : 'var(--accent)',
              }}
            />
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs tabular-nums text-muted" aria-hidden="true">
        {[0, 6, 12, 18].map((h) => <span key={h}>{formatTime(h * 60)}</span>)}
        <span>23:00</span>
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-muted">View as table</summary>
        <table className="mt-2 w-full tabular-nums">
          <thead><tr><th scope="col" className="text-left font-medium">Hour</th><th scope="col" className="text-right font-medium">Open</th></tr></thead>
          <tbody>
            {data.map((d) => <tr key={d.hour}><td>{formatTime(d.hour * 60)}</td><td className="text-right">{d.open}</td></tr>)}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

interface ActivityProps {
  places: Place[];
  selected: string;
  onPick: (activity: string) => void;
}

export function ActivityChart({ places, selected, onPick }: ActivityProps) {
  const [all, setAll] = useState(false);
  const rows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of places) for (const a of p.activities) counts.set(a, (counts.get(a) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [places]);
  const max = Math.max(1, rows[0]?.[1] ?? 0);
  const visible = all ? rows : rows.slice(0, TOP_ACTIVITIES);

  return (
    <figure className={`${card} m-0`}>
      <figcaption>
        <h2 className="font-display text-lg font-semibold">Places by activity</h2>
        <p className="text-sm text-muted">A place can offer several. Click an activity to filter.</p>
      </figcaption>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No activities to show.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-0.5">
          {visible.map(([name, count]) => (
            <li key={name}>
              <button
                type="button"
                aria-pressed={name === selected}
                aria-label={`${name}: ${count} places`}
                onClick={() => onPick(name)}
                className={`grid w-full grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)_2.5rem] items-center gap-2 rounded-md px-1 py-1 text-left text-sm hover:bg-raised ${name === selected ? 'bg-raised font-semibold' : ''}`}
              >
                <span className="truncate">{name}</span>
                <span className="block h-3 rounded-r bg-raised">
                  <span className="bar-fill block h-full rounded-r bg-accent" style={{ width: `${(count / max) * 100}%` }} />
                </span>
                <span className="text-right tabular-nums text-muted">{count}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {rows.length > TOP_ACTIVITIES && (
        <button type="button" onClick={() => setAll(!all)} className="mt-2 text-sm text-muted underline underline-offset-4 hover:text-ink">
          {all ? 'Show fewer' : `Show all ${rows.length}`}
        </button>
      )}
    </figure>
  );
}
