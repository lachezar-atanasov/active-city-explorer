import type { Card, Place } from './types';

export interface Filters {
  query: string;
  card: Card | '';
  kids: boolean;
}

export function matches(p: Place, { query, card, kids }: Filters) {
  const q = query.trim().toLowerCase();
  if (q && ![p.name, p.address ?? '', ...p.activities].some((s) => s.toLowerCase().includes(q))) return false;
  if (card && !p.cards.includes(card)) return false;
  if (kids && !p.kids) return false;
  return true;
}
