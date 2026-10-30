import { useMemo, useState } from 'react';
import { kmFromCentre } from '../lib/geo';
import { statusAt } from '../lib/hours';
import type { Moment, Place } from '../lib/types';
import { StatusBadge } from './StatusBadge';

interface Props {
  places: Place[];
  moment: Moment;
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const SORTS = {
  open: 'Open first',
  distance: 'Closest to centre',
  name: 'Name',
};
type Sort = keyof typeof SORTS;

export function ListView({ places, moment, selectedId, onSelect }: Props) {
  const [sort, setSort] = useState<Sort>('open');
  const sorted = useMemo(() => {
    const byName = (a: Place, b: Place) => a.name.localeCompare(b.name);
    const rows = [...places];
    if (sort === 'name') return rows.sort(byName);
    if (sort === 'distance') return rows.sort((a, b) => kmFromCentre(a) - kmFromCentre(b));
    const rank = (p: Place) => (statusAt(p, moment) === 'open' ? 0 : 1);
    return rows.sort((a, b) => rank(a) - rank(b) || byName(a, b));
  }, [places, moment, sort]);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-end gap-2 border-b border-line px-4 py-2 text-sm text-muted">
        <label htmlFor="sort">Sort by</label>
        <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-md border border-line bg-surface px-2 py-1 text-ink">
          {Object.entries(SORTS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <ul className="max-h-[560px] overflow-y-auto">
        {sorted.map((p) => (
          <li key={p.id} className="border-b border-line last:border-b-0">
            <button
              type="button"
              aria-pressed={p.id === selectedId}
              onClick={() => onSelect(p.id)}
              className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-raised ${p.id === selectedId ? 'bg-raised' : ''}`}
            >
              <span className="min-w-0">
                <span className="block font-medium [overflow-wrap:anywhere]">{p.name}</span>
                <span className="block text-sm text-muted [overflow-wrap:anywhere]">
                  {p.address ?? 'Address not listed'} · {kmFromCentre(p).toFixed(1)} km
                </span>
              </span>
              <StatusBadge status={statusAt(p, moment)} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
