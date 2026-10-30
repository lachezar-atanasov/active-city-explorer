import { DAYS, type Card, type Moment } from './types';

export interface ViewState {
  query: string;
  activity: string;
  card: Card | '';
  kids: boolean;
  onlyOpen: boolean;
  picked: Moment | null;
  view: 'map' | 'list';
  selectedId: number | null;
}

const CARDS: Card[] = ['Standard', 'Lite', 'Kids'];

// Anything unexpected in a shared link falls back to the default, so a bad URL cannot break the page.
export function decode(search: string): ViewState {
  const q = new URLSearchParams(search);
  const card = q.get('card') as Card;
  const day = q.get('day') as Moment['day'];
  const hour = Number(q.get('hour'));
  const place = Number(q.get('place'));
  return {
    query: q.get('q') ?? '',
    activity: q.get('activity') ?? '',
    card: CARDS.includes(card) ? card : '',
    kids: q.get('kids') === '1',
    onlyOpen: q.get('open') === '1',
    picked: DAYS.includes(day) && Number.isInteger(hour) && hour >= 0 && hour < 24 ? { day, minute: hour * 60 } : null,
    view: q.get('view') === 'list' ? 'list' : 'map',
    selectedId: Number.isInteger(place) && place > 0 ? place : null,
  };
}

export function encode(s: ViewState): string {
  const q = new URLSearchParams();
  if (s.query) q.set('q', s.query);
  if (s.activity) q.set('activity', s.activity);
  if (s.card) q.set('card', s.card);
  if (s.kids) q.set('kids', '1');
  if (s.onlyOpen) q.set('open', '1');
  if (s.picked) {
    q.set('day', s.picked.day);
    q.set('hour', String(Math.floor(s.picked.minute / 60)));
  }
  if (s.view === 'list') q.set('view', 'list');
  if (s.selectedId) q.set('place', String(s.selectedId));
  const text = q.toString();
  return text ? `?${text}` : '';
}
