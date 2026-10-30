import { useEffect, useMemo, useState } from 'react';
import { DAYS, DAY_NAMES, type Card, type Day, type Moment, type Place } from './lib/types';
import { matches } from './lib/filters';
import { formatTime, sofiaNow, statusAt } from './lib/hours';
import { decode, encode } from './lib/urlState';
import { MapView } from './components/MapView';
import { ListView } from './components/ListView';
import { DetailPanel } from './components/DetailPanel';
import { ActivityChart, HourChart } from './components/Charts';

const CARDS: Card[] = ['Standard', 'Lite', 'Kids'];
const control = 'h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink';
const initial = decode(window.location.search);

function useIsNarrow() {
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 1023px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    const update = () => setNarrow(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return narrow;
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur-sm">
      <div className="font-display text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">{value}</div>
      <div className="text-sm text-white/70">{label}</div>
    </div>
  );
}

const nextTheme = () => {
  const dark = document.documentElement.dataset.theme
    ? document.documentElement.dataset.theme === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = dark ? 'light' : 'dark';
};

export default function App({ places }: { places: Place[] }) {
  const [query, setQuery] = useState(initial.query);
  const [activity, setActivity] = useState(initial.activity);
  const [card, setCard] = useState<Card | ''>(initial.card);
  const [kids, setKids] = useState(initial.kids);
  const [onlyOpen, setOnlyOpen] = useState(initial.onlyOpen);
  const [picked, setPicked] = useState<Moment | null>(initial.picked);
  const [now, setNow] = useState(sofiaNow);
  const [view, setView] = useState(initial.view);
  const [selectedId, setSelectedId] = useState(initial.selectedId);
  const [copied, setCopied] = useState(false);
  const narrow = useIsNarrow();

  useEffect(() => {
    const timer = setInterval(() => setNow(sofiaNow()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const search = encode({ query, activity, card, kids, onlyOpen, picked, view, selectedId });
    window.history.replaceState(null, '', search || window.location.pathname);
  }, [query, activity, card, kids, onlyOpen, picked, view, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedId(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);

  const moment = picked ?? now;
  const allActivities = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of places) for (const a of p.activities) counts.set(a, (counts.get(a) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1]).map(([name]) => name);
  }, [places]);

  // Everything except "open only" and the activity filter, so charts stay comparable.
  const withoutActivity = useMemo(() => places.filter((p) => matches(p, { query, card, kids })), [places, query, card, kids]);
  const base = useMemo(
    () => (activity ? withoutActivity.filter((p) => p.activities.includes(activity)) : withoutActivity),
    [withoutActivity, activity],
  );
  const shown = useMemo(
    () => (onlyOpen ? base.filter((p) => statusAt(p, moment) === 'open') : base),
    [base, onlyOpen, moment],
  );

  const counts = useMemo(() => {
    const c = { open: 0, closed: 0, unknown: 0, 'temporarily-closed': 0 };
    for (const p of base) c[statusAt(p, moment)]++;
    return c;
  }, [base, moment]);

  const selected = places.find((p) => p.id === selectedId) ?? null;
  const hour = Math.floor(moment.minute / 60);

  const reset = () => {
    setQuery('');
    setActivity('');
    setCard('');
    setKids(false);
    setOnlyOpen(false);
    setPicked(null);
  };

  const pickHour = (h: number) => setPicked({ day: moment.day, minute: h * 60 });

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-3.5 py-1.5 text-sm ${active ? 'border-accent bg-accent font-semibold text-on-accent' : 'border-line bg-surface text-ink hover:bg-raised'}`;

  return (
    <div className="pb-12">
      <header className="hero">
        <div className="mx-auto max-w-[1320px] px-4 pb-6 pt-5 sm:px-6 sm:pb-8">
          <div className="flex items-center justify-between gap-4 text-sm text-white/70">
            <span className="font-semibold text-white">Active City Explorer</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={share} className="rounded-lg px-2.5 py-1.5 hover:bg-white/10" aria-live="polite">
                {copied ? 'Link copied' : 'Share view'}
              </button>
              <button type="button" onClick={nextTheme} className="rounded-lg px-2.5 py-1.5 hover:bg-white/10">Theme</button>
            </div>
          </div>
          <h1 className="mt-6 max-w-3xl font-display text-[2.1rem] font-bold leading-[1.08] tracking-tight sm:text-5xl">
            Where can you train <span className="block text-[#6fe6d2]">right now?</span>
          </h1>
          <p className="mt-3 max-w-2xl text-white/75">
            {places.length} fictional venues on one live map. Slide through the week to see what is open when you want to go.
          </p>
          <section aria-label="Summary" className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat value={base.length} label="Places matching" />
            <Stat value={counts.open} label={`Open, ${DAY_NAMES[moment.day].slice(0, 3)} ${formatTime(moment.minute)}`} />
            <Stat value={counts.unknown} label="Hours unknown" />
            <Stat value={counts['temporarily-closed']} label="Temporarily closed" />
          </section>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] px-4 sm:px-6">
        <section aria-label="Filters" className="mt-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              aria-label="Search places"
              placeholder="Search name, address or activity"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`${control} w-full sm:w-72`}
            />
            <select aria-label="Plan type" value={card} onChange={(e) => setCard(e.target.value as Card | '')} className={control}>
              <option value="">All plans</option>
              {CARDS.map((c) => <option key={c} value={c}>{c} plan</option>)}
            </select>
            <label className={`${control} flex items-center gap-2`}>
              <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} className="accent-[var(--accent)]" />
              Open only
            </label>
            <label className={`${control} flex items-center gap-2`}>
              <input type="checkbox" checked={kids} onChange={(e) => setKids(e.target.checked)} className="accent-[var(--accent)]" />
              For kids
            </label>
            <button type="button" onClick={reset} className="h-10 px-2 text-sm text-muted underline underline-offset-4 hover:text-ink">
              Reset
            </button>
          </div>

          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6" role="group" aria-label="Activity">
            <button type="button" aria-pressed={!activity} onClick={() => setActivity('')} className={chip(!activity)}>All</button>
            {allActivities.map((a) => (
              <button key={a} type="button" aria-pressed={a === activity} onClick={() => setActivity(a === activity ? '' : a)} className={chip(a === activity)}>{a}</button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-line bg-surface px-4 py-2.5">
            <select
              aria-label="Day"
              value={picked ? picked.day : 'now'}
              onChange={(e) => setPicked(e.target.value === 'now' ? null : { day: e.target.value as Day, minute: moment.minute })}
              className="h-9 rounded-lg border border-line bg-surface px-2 text-sm text-ink"
            >
              <option value="now">Right now</option>
              {DAYS.map((d) => <option key={d} value={d}>{DAY_NAMES[d]}</option>)}
            </select>
            <input
              type="range"
              min={0}
              max={23}
              value={hour}
              aria-label="Hour of day"
              aria-valuetext={formatTime(hour * 60)}
              onChange={(e) => pickHour(Number(e.target.value))}
              className="time-slider min-w-24 flex-1"
            />
            <output className="w-14 text-right font-semibold tabular-nums">{formatTime(picked ? hour * 60 : moment.minute)}</output>
          </div>
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section aria-label="Places" className="min-w-0">
            <div className="mb-2 flex items-center justify-between">
              <div role="group" aria-label="View" className="inline-flex rounded-lg border border-line bg-surface p-0.5">
                {(['map', 'list'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={view === v}
                    onClick={() => setView(v)}
                    className={`rounded-md px-3 py-1 text-sm capitalize ${view === v ? 'bg-accent font-semibold text-on-accent' : 'text-muted hover:text-ink'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <span className="text-sm text-muted" aria-live="polite">{shown.length} shown</span>
            </div>
            {shown.length === 0 ? (
              <div className="rounded-2xl border border-line bg-surface p-10 text-center text-muted">
                <p className="m-0">No places match these filters.</p>
                <button type="button" onClick={reset} className="mt-2 text-accent underline underline-offset-4">Clear filters</button>
              </div>
            ) : view === 'map' ? (
              <MapView places={shown} moment={moment} selectedId={selectedId} narrow={narrow} onSelect={setSelectedId} />
            ) : (
              <ListView places={shown} moment={moment} selectedId={selectedId} onSelect={setSelectedId} />
            )}
          </section>

          {narrow ? selected && (
            <>
              <button type="button" aria-label="Close details" onClick={() => setSelectedId(null)} className="fixed inset-0 z-20 bg-black/40" />
              <div className="sheet fixed inset-x-0 bottom-0 z-30 max-h-[78vh] overflow-y-auto rounded-t-2xl bg-surface shadow-2xl">
                <DetailPanel place={selected} moment={moment} onClose={() => setSelectedId(null)} />
              </div>
            </>
          ) : (
            <div className="sticky top-4 self-start lg:mt-10">
              <DetailPanel place={selected} moment={moment} onClose={() => setSelectedId(null)} />
            </div>
          )}
        </div>

        <section aria-label="Charts" className="mt-4 grid gap-4 lg:grid-cols-2">
          <HourChart places={base} day={moment.day} selectedHour={hour} onPick={pickHour} />
          <ActivityChart places={withoutActivity} selected={activity} onPick={(a) => setActivity(a === activity ? '' : a)} />
        </section>

        <footer className="mt-8 text-sm text-muted">
          <strong className="font-semibold text-ink">Independent concept project. All venues are fictional.</strong>{' '}
          Built with React, TypeScript, Vite and Tailwind. Names, addresses, locations and hours were generated for this demo.
        </footer>
      </main>
    </div>
  );
}
