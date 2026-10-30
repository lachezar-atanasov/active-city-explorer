import { statusAt } from '../lib/hours';
import { DAYS, DAY_NAMES, type Moment, type Place } from '../lib/types';
import { StatusBadge } from './StatusBadge';

const safeHref = (url: string | null) => {
  if (!url) return null;
  try {
    return /^https?:$/.test(new URL(url).protocol) ? url : null;
  } catch {
    return null;
  }
};

interface Props {
  place: Place | null;
  moment: Moment;
  onClose: () => void;
}

export function DetailPanel({ place, moment, onClose }: Props) {
  if (!place) {
    return (
      <aside className="rounded-2xl border border-dashed border-line p-6 text-muted">
        <h2 className="font-display text-lg font-semibold text-ink">Pick a place</h2>
        <p className="mt-1 text-sm">Choose a dot on the map or a row in the list to see its hours, activities and contact details.</p>
      </aside>
    );
  }
  const website = safeHref(place.website);
  const source = safeHref(place.source);
  const link = 'text-accent underline underline-offset-4';

  return (
    <aside aria-label="Place details" className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-xl font-semibold leading-snug [overflow-wrap:anywhere]">{place.name}</h2>
        <button type="button" aria-label="Close details" onClick={onClose} className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl text-muted hover:bg-raised hover:text-ink">×</button>
      </div>
      <p className="mt-1 text-sm text-muted [overflow-wrap:anywhere]">{place.address ?? 'Address not listed'}</p>
      <div className="mt-3"><StatusBadge status={statusAt(place, moment)} /></div>

      <h3 className="mt-5 text-sm font-semibold">Activities</h3>
      {place.activities.length ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {place.activities.map((a) => <li key={a} className="rounded-md bg-raised px-2 py-0.5 text-sm">{a}</li>)}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-muted">Not listed</p>
      )}

      <h3 className="mt-5 text-sm font-semibold">Plans accepted</h3>
      <p className="mt-1 text-sm">{place.cards.join(', ')}</p>

      <h3 className="mt-5 text-sm font-semibold">Opening hours</h3>
      {place.hours ? (
        <table className="mt-1 w-full text-sm">
          <tbody>
            {DAYS.map((d) => {
              const ranges = place.hours?.[d];
              return (
                <tr key={d} className={d === moment.day ? 'font-semibold' : ''}>
                  <th scope="row" className="py-0.5 pr-3 text-left font-[inherit]">{DAY_NAMES[d]}</th>
                  <td className={`py-0.5 text-right tabular-nums ${ranges ? '' : 'text-muted'}`}>
                    {ranges ? ranges.map((r) => r.join('–')).join(', ') : 'Not listed'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="mt-1 text-sm text-muted">Hours unknown</p>
      )}

      <div className="mt-5 flex flex-col gap-1 text-sm">
        {place.phone && <a className={link} href={`tel:${place.phone.replace(/[^\d+]/g, '')}`}>{place.phone}</a>}
        {website && <a className={link} href={website} target="_blank" rel="noopener noreferrer">Website</a>}
        {source && <a className={link} href={source} target="_blank" rel="noopener noreferrer">Source listing</a>}
      </div>
    </aside>
  );
}
