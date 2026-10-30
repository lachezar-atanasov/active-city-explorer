import { describe, expect, it } from 'vitest';
import { openByHour, sofiaNow, statusAt } from './hours';
import type { Place } from './types';

const at = (hours: Place['hours'], day: 'mon' | 'tue' | 'wed', time: string, temporaryClosed = false) => {
  const [h, m] = time.split(':').map(Number);
  return statusAt({ hours, temporaryClosed }, { day, minute: h * 60 + m });
};

describe('statusAt', () => {
  const week = { mon: [['09:00', '21:00']], tue: [['09:00', '21:00']] } as Place['hours'];

  it('is open inside a range and closed outside it', () => {
    expect(at(week, 'mon', '09:00')).toBe('open');
    expect(at(week, 'mon', '20:59')).toBe('open');
    expect(at(week, 'mon', '21:00')).toBe('closed');
    expect(at(week, 'mon', '08:59')).toBe('closed');
  });

  it('reports unknown when there are no hours', () => {
    expect(at(null, 'mon', '12:00')).toBe('unknown');
  });

  it('reports unknown for a day missing from the hours', () => {
    expect(at(week, 'wed', '12:00')).toBe('unknown');
  });

  it('carries an overnight range into the next day', () => {
    const late = { mon: [['18:00', '02:00']], tue: [['18:00', '02:00']] } as Place['hours'];
    expect(at(late, 'mon', '23:00')).toBe('open');
    expect(at(late, 'tue', '01:59')).toBe('open');
    expect(at(late, 'tue', '02:00')).toBe('closed');
    expect(at(late, 'wed', '01:00')).toBe('open');
    expect(at(late, 'wed', '03:00')).toBe('unknown');
  });

  it('treats a range ending at midnight as open until midnight', () => {
    const toMidnight = { mon: [['08:00', '00:00']], tue: [['08:00', '00:00']] } as Place['hours'];
    expect(at(toMidnight, 'mon', '23:59')).toBe('open');
    expect(at(toMidnight, 'tue', '00:00')).toBe('closed');
  });

  it('puts temporarily closed ahead of any hours', () => {
    expect(at(week, 'mon', '12:00', true)).toBe('temporarily-closed');
  });
});

describe('sofiaNow', () => {
  it('uses Sofia time, not the browser time zone', () => {
    expect(sofiaNow(new Date('2026-07-06T21:30:00Z'))).toEqual({ day: 'tue', minute: 30 });
  });
});

describe('openByHour', () => {
  it('counts only places known to be open', () => {
    const place = (hours: Place['hours']) => ({ hours, temporaryClosed: false }) as Place;
    const counts = openByHour([place({ mon: [['10:00', '12:00']] }), place(null)], 'mon');
    expect(counts[9].open).toBe(0);
    expect(counts[10].open).toBe(1);
    expect(counts[12].open).toBe(0);
  });
});
