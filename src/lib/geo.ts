// Kilometres east and south of the map centre, so distances stay true to scale.
const CENTER = { lat: 42.6977, lng: 23.3219 };
const KM_PER_LAT = 111.2;
const KM_PER_LNG = KM_PER_LAT * Math.cos((CENTER.lat * Math.PI) / 180);

export const project = (p: { lat: number; lng: number }) => ({
  x: (p.lng - CENTER.lng) * KM_PER_LNG,
  y: (CENTER.lat - p.lat) * KM_PER_LAT,
});

export const kmFromCentre = (p: { lat: number; lng: number }) => {
  const { x, y } = project(p);
  return Math.hypot(x, y);
};

export interface HexBin {
  key: string;
  x: number;
  y: number;
  count: number;
}

// Groups points into flat grid cells of pointy-top hexagons with the given radius.
export function hexBins(points: { x: number; y: number }[], size: number): HexBin[] {
  const bins = new Map<string, HexBin>();
  for (const { x, y } of points) {
    const fq = ((Math.sqrt(3) / 3) * x - y / 3) / size;
    const fr = ((2 / 3) * y) / size;
    const fs = -fq - fr;
    let q = Math.round(fq);
    let r = Math.round(fr);
    const s = Math.round(fs);
    const dq = Math.abs(q - fq);
    const dr = Math.abs(r - fr);
    const ds = Math.abs(s - fs);
    if (dq > dr && dq > ds) q = -r - s;
    else if (dr > ds) r = -q - s;
    const key = `${q},${r}`;
    const bin = bins.get(key);
    if (bin) bin.count++;
    else bins.set(key, { key, x: size * Math.sqrt(3) * (q + r / 2), y: size * 1.5 * r, count: 1 });
  }
  return [...bins.values()];
}

export const hexPoints = (x: number, y: number, size: number) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    return `${x + size * Math.cos(a)},${y + size * Math.sin(a)}`;
  }).join(' ');
