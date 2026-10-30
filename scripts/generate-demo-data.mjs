// Generates the fictional dataset. Every venue is invented by a seeded random generator,
// so nothing here comes from a real listing and the output is repeatable.
import fs from 'node:fs';
import path from 'node:path';

let seed = 20261030;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (list) => list[Math.floor(rnd() * list.length)];
const gauss = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());

const COUNT = 420;
const CENTRE = { lat: 42.6977, lng: 23.3219 };
const KM_PER_LAT = 111.2;
const KM_PER_LNG = KM_PER_LAT * Math.cos((CENTRE.lat * Math.PI) / 180);

// Invented neighbourhoods: [km east, km south, spread, weight]
const CLUSTERS = [[0, 0, 1.4, 4], [-5, -3, 1.2, 2], [4, 5, 1.6, 3], [-3, 5, 1.5, 2], [6, -2, 1.3, 2], [0, 10, 1.8, 1]];
const ACTIVITIES = {
  Yoga: ['Yoga', 'Pilates'], Studio: ['Dance', 'Aerobics'], Gym: ['Gym', 'Strength'], Dojo: ['Martial arts', 'Boxing'],
  Club: ['Racket sports', 'Squash'], Pool: ['Swimming', 'Aqua fitness'], Spa: ['Spa', 'Sauna'], Wall: ['Climbing'],
};
const FIRST = ['Northside', 'Harbour', 'Lantern', 'Copper', 'Maple', 'Summit', 'Willow', 'Ember', 'Parkline', 'Foundry', 'Orchard', 'Meridian', 'Juniper', 'Cobalt', 'Riverbend', 'Old Mill'];
const LAST = ['Collective', 'House', 'Works', 'Room', 'Lab', 'Corner', 'Space', 'Loft'];
const STREETS = ['Linden', 'Foundry', 'Market', 'Canal', 'Orchard', 'Station', 'Birch', 'Quarry'];
const CARDS = ['Standard', 'Lite', 'Kids'];
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function location() {
  const total = CLUSTERS.reduce((n, c) => n + c[3], 0);
  let roll = rnd() * total;
  const c = CLUSTERS.find((x) => (roll -= x[3]) < 0) ?? CLUSTERS[0];
  const x = c[0] + gauss() * c[2];
  const y = c[1] + gauss() * c[2];
  return { lat: Number((CENTRE.lat - y / KM_PER_LAT).toFixed(5)), lng: Number((CENTRE.lng + x / KM_PER_LNG).toFixed(5)) };
}

function hours() {
  if (rnd() < 0.22) return null;
  const open = pick(['06:30', '07:00', '08:00', '09:00', '10:00', '16:00']);
  const close = pick(['20:00', '21:00', '22:00', '23:00']);
  const weekend = rnd() < 0.8;
  return Object.fromEntries(DAYS.filter((d, i) => i < 5 || weekend).map((d, i) => [d, [[i < 5 ? open : '09:00', i < 5 ? close : '19:00']]]));
}

const seen = new Set();
const places = [];
for (let id = 1; places.length < COUNT; id++) {
  const kind = pick(Object.keys(ACTIVITIES));
  const name = `${pick(FIRST)} ${kind} ${pick(LAST)}`;
  if (seen.has(name)) continue;
  seen.add(name);
  const activities = [...ACTIVITIES[kind]].filter((_, i) => i === 0 || rnd() < 0.55).sort();
  const cards = CARDS.filter((c, i) => (i === 0 ? true : rnd() < (i === 1 ? 0.35 : 0.3)));
  places.push({
    id,
    name,
    address: `${1 + Math.floor(rnd() * 120)} ${pick(STREETS)} Street`,
    ...location(),
    activities,
    kids: cards.includes('Kids'),
    cards,
    temporaryClosed: rnd() < 0.04,
    phone: null,
    website: null,
    source: '',
    hours: hours(),
    confidence: 'fictional',
  });
}

const out = path.resolve('src/data/places.json');
fs.writeFileSync(out, JSON.stringify({ snapshot: 'generated', places }));
console.log(`${places.length} fictional places written`);
