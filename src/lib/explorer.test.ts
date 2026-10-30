import { describe, expect, it } from 'vitest';
import { matches } from './filters';
import { hexBins, kmFromCentre } from './geo';
import { decode, encode, type ViewState } from './urlState';
import type { Place } from './types';

const place = {
  id: 1, name: 'Fit Point', address: 'Hristo Botev 1', lat: 42.7, lng: 23.3, activities: ['Dance'],
  kids: true, cards: ['Standard'], temporaryClosed: false, phone: null, website: null, source: '', hours: null, confidence: 'medium',
} as Place;

describe('matches', () => {
  const none = { query: '', card: '', kids: false } as const;

  it('searches name, address and activity without case', () => {
    expect(matches(place, { ...none, query: 'fit p' })).toBe(true);
    expect(matches(place, { ...none, query: 'BOTEV' })).toBe(true);
    expect(matches(place, { ...none, query: 'dance' })).toBe(true);
    expect(matches(place, { ...none, query: 'yoga' })).toBe(false);
  });

  it('applies card and kids filters', () => {
    expect(matches(place, { ...none, card: 'Lite' })).toBe(false);
    expect(matches({ ...place, kids: false }, { ...none, kids: true })).toBe(false);
  });
});

describe('url state', () => {
  const state: ViewState = {
    query: 'yoga & more', activity: 'Dance', card: 'Lite', kids: true, onlyOpen: true,
    picked: { day: 'sat', minute: 600 }, view: 'list', selectedId: 42,
  };

  it('survives a round trip', () => {
    expect(decode(encode(state))).toEqual(state);
  });

  it('keeps the default view out of the URL', () => {
    expect(encode(decode(''))).toBe('');
  });

  it('ignores invalid values', () => {
    const bad = decode('?card=Gold&day=funday&hour=99&place=abc&view=grid');
    expect(bad).toEqual(decode(''));
  });
});

describe('geometry', () => {
  it('measures distance from the centre', () => {
    expect(kmFromCentre({ lat: 42.6977, lng: 23.3219 })).toBeCloseTo(0);
    expect(kmFromCentre({ lat: 42.7877, lng: 23.3219 })).toBeCloseTo(10, 0);
  });

  it('never loses a point when binning', () => {
    const points = Array.from({ length: 200 }, (_, i) => ({ x: Math.sin(i) * 9, y: Math.cos(i * 2) * 9 }));
    const bins = hexBins(points, 1);
    expect(bins.reduce((n, b) => n + b.count, 0)).toBe(200);
    expect(bins.length).toBeLessThan(200);
  });
});
