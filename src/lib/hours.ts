import { DAYS, type Day, type Hours, type Moment, type Place, type Status } from './types';

const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

// A range whose end is not after its start runs past midnight.
const isOvernight = ([start, end]: [string, string]) => toMinutes(end) <= toMinutes(start);

const previousDay = (day: Day) => DAYS[(DAYS.indexOf(day) + 6) % 7];

function isOpen(hours: Hours, { day, minute }: Moment): boolean | null {
  const spill = hours[previousDay(day)]?.some((r) => isOvernight(r) && minute < toMinutes(r[1]));
  if (spill) return true;
  const today = hours[day];
  // A day missing from the source is unknown, not closed.
  if (!today) return null;
  return today.some((r) => minute >= toMinutes(r[0]) && (isOvernight(r) || minute < toMinutes(r[1])));
}

export function statusAt(place: Pick<Place, 'hours' | 'temporaryClosed'>, moment: Moment): Status {
  if (place.temporaryClosed) return 'temporarily-closed';
  if (!place.hours) return 'unknown';
  const open = isOpen(place.hours, moment);
  if (open === null) return 'unknown';
  return open ? 'open' : 'closed';
}

export function sofiaNow(date = new Date()): Moment {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Sofia', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return {
    day: get('weekday').toLowerCase() as Day,
    minute: (Number(get('hour')) % 24) * 60 + Number(get('minute')),
  };
}

export const openByHour = (places: Place[], day: Day) =>
  Array.from({ length: 24 }, (_, hour) => ({
    hour,
    open: places.filter((p) => statusAt(p, { day, minute: hour * 60 }) === 'open').length,
  }));

export const formatTime = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
