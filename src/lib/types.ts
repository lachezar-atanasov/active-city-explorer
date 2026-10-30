export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Day = (typeof DAYS)[number];
export type Hours = Partial<Record<Day, [string, string][]>>;
export type Card = 'Standard' | 'Lite' | 'Kids';
export type Status = 'open' | 'closed' | 'unknown' | 'temporarily-closed';

export interface Place {
  id: number;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  activities: string[];
  kids: boolean;
  cards: Card[];
  temporaryClosed: boolean;
  phone: string | null;
  website: string | null;
  source: string;
  hours: Hours | null;
  confidence: string;
}

export interface Moment {
  day: Day;
  minute: number;
}

export const DAY_NAMES: Record<Day, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
};

export const STATUS_LABELS: Record<Status, string> = {
  open: 'Open',
  closed: 'Closed',
  unknown: 'Hours unknown',
  'temporarily-closed': 'Temporarily closed',
};
