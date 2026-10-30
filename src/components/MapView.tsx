import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { hexBins, hexPoints, project } from '../lib/geo';
import { statusAt } from '../lib/hours';
import { STATUS_LABELS, type Moment, type Place, type Status } from '../lib/types';
import { StatusMark } from './StatusBadge';

const ZOOMS = [6, 12, 24, 48];
const START_ZOOM = 2;
const RINGS = [2, 5, 10, 20];
const STATES: Status[] = ['open', 'closed', 'unknown', 'temporarily-closed'];

interface Props {
  places: Place[];
  moment: Moment;
  selectedId: number | null;
  narrow: boolean;
  onSelect: (id: number) => void;
}

const FILL: Record<Status, string> = {
  open: 'var(--state-open)',
  closed: 'var(--state-closed)',
  unknown: 'none',
  'temporarily-closed': 'var(--state-temp)',
};

export function MapView({ places, moment, selectedId, narrow, onSelect }: Props) {
  const [zoom, setZoom] = useState(START_ZOOM);
  const [center, setCenter] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<'dots' | 'density'>('dots');
  const [hovered, setHovered] = useState<Place | null>(null);
  const drag = useRef<{ px: number; py: number; x: number; y: number; moved: boolean } | null>(null);
  const svg = useRef<SVGSVGElement>(null);

  const aspect = narrow ? 0.92 : 16 / 10;
  const width = ZOOMS[zoom];
  const height = width / aspect;
  const unit = width / 24;

  const dots = useMemo(() => {
    const order: Status[] = ['closed', 'unknown', 'temporarily-closed', 'open'];
    return places
      .map((p) => ({ place: p, status: statusAt(p, moment), ...project(p) }))
      .sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
  }, [places, moment]);

  const hexSize = unit * 0.62;
  const bins = useMemo(() => hexBins(dots, hexSize), [dots, hexSize]);
  const maxBin = Math.max(1, ...bins.map((b) => b.count));

  const selected = dots.find((d) => d.place.id === selectedId);
  const selectedX = selected?.x;
  const selectedY = selected?.y;

  // Bring a place chosen from the list or a shared link into view.
  useEffect(() => {
    if (selectedX === undefined || selectedY === undefined) return;
    setCenter((c) =>
      Math.abs(selectedX - c.x) > width * 0.45 || Math.abs(selectedY - c.y) > height * 0.45 ? { x: selectedX, y: selectedY } : c,
    );
  }, [selectedX, selectedY, width, height]);

  const onPointerDown = (e: PointerEvent) => {
    drag.current = { px: e.clientX, py: e.clientY, x: center.x, y: center.y, moved: false };
  };
  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d || !svg.current) return;
    const dx = e.clientX - d.px;
    const dy = e.clientY - d.py;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    if (!d.moved) svg.current.setPointerCapture(e.pointerId);
    d.moved = true;
    const scale = width / svg.current.clientWidth;
    setCenter({ x: d.x - dx * scale, y: d.y - dy * scale });
  };
  const onPointerUp = () => {
    window.setTimeout(() => { drag.current = null; });
  };
  const wasDragged = () => drag.current?.moved ?? false;

  const zoomInto = (x: number, y: number) => {
    if (wasDragged()) return;
    setCenter({ x, y });
    if (zoom > 0) setZoom(zoom - 1);
    if (zoom <= 1) setMode('dots');
  };

  const zoomBtn = 'flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-lg text-ink shadow-sm hover:bg-raised disabled:opacity-40';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-surface">
      <svg
        ref={svg}
        role="img"
        aria-label={`Map of ${places.length} fictional places. Use the list view for keyboard access.`}
        viewBox={`${center.x - width / 2} ${center.y - height / 2} ${width} ${height}`}
        style={{ aspectRatio: aspect }}
        className="block w-full touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <defs>
          <pattern id="grid" width="2" height="2" patternUnits="userSpaceOnUse">
            <path d="M2 0H0V2" fill="none" stroke="var(--line)" strokeWidth={unit * 0.012} />
          </pattern>
          <radialGradient id="glow">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.12" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x={-80} y={-80} width={160} height={160} fill="url(#grid)" />
        <circle r={16} fill="url(#glow)" />
        {RINGS.map((r) => (
          <g key={r}>
            <circle cx={0} cy={0} r={r} fill="none" stroke="var(--muted)" strokeOpacity={0.35} strokeDasharray={`${unit * 0.12} ${unit * 0.12}`} strokeWidth={unit * 0.025} />
            <text x={0} y={-r - unit * 0.08} textAnchor="middle" fill="var(--muted)" fontSize={unit * 0.28}>{r} km</text>
          </g>
        ))}

        {mode === 'density' ? bins.map((b) => (
          <g key={b.key} className="cursor-pointer" onClick={() => zoomInto(b.x, b.y)}>
            <title>{`${b.count} places`}</title>
            <polygon
              points={hexPoints(b.x, b.y, hexSize * 0.94)}
              fill={`rgba(var(--heat), ${0.14 + 0.86 * (b.count / maxBin)})`}
            />
            {b.count >= maxBin / 3 && (
              <text x={b.x} y={b.y + unit * 0.1} textAnchor="middle" fontSize={unit * 0.3} fontWeight={700}
                fill={b.count / maxBin > 0.45 ? 'var(--on-accent)' : 'var(--ink)'} pointerEvents="none">{b.count}</text>
            )}
          </g>
        )) : dots.map(({ place, status, x, y }) => {
          const r = unit * (status === 'open' ? 0.17 : 0.13);
          const handlers = {
            onClick: () => { if (!wasDragged()) onSelect(place.id); },
            onPointerEnter: () => setHovered(place),
            onPointerLeave: () => setHovered(null),
          };
          return (
            <g key={place.id} {...handlers} className="cursor-pointer">
              <circle cx={x} cy={y} r={unit * 0.3} fill="transparent" />
              {status === 'temporarily-closed' ? (
                <rect x={x - r} y={y - r} width={r * 2} height={r * 2} transform={`rotate(45 ${x} ${y})`}
                  fill={FILL[status]} stroke="var(--surface)" strokeWidth={unit * 0.03} />
              ) : (
                <circle className="dot" cx={x} cy={y} r={r} fill={FILL[status]}
                  stroke={status === 'unknown' ? 'var(--muted)' : 'var(--surface)'}
                  strokeWidth={unit * (status === 'unknown' ? 0.05 : 0.03)} />
              )}
            </g>
          );
        })}

        <text x={0} y={unit * 0.1} textAnchor="middle" fill="var(--ink)" stroke="var(--surface)" strokeWidth={unit * 0.1}
          paintOrder="stroke" fontSize={unit * 0.32} fontWeight={700} pointerEvents="none">Centre</text>
        {selected && mode === 'dots' && (
          <g pointerEvents="none">
            <circle className="pulse" cx={selected.x} cy={selected.y} r={unit * 0.34} fill="none" stroke="var(--accent)" strokeWidth={unit * 0.06} />
            <circle cx={selected.x} cy={selected.y} r={unit * 0.34} fill="none" stroke="var(--ink)" strokeWidth={unit * 0.08} />
          </g>
        )}
      </svg>

      <div role="group" aria-label="Map style" className="absolute left-3 top-3 inline-flex rounded-lg border border-line bg-surface p-0.5 text-sm shadow-sm">
        {(['dots', 'density'] as const).map((m) => (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}
            className={`rounded-md px-2.5 py-1 capitalize ${mode === m ? 'bg-raised font-semibold text-ink' : 'text-muted hover:text-ink'}`}>
            {m}
          </button>
        ))}
      </div>

      <div className="absolute right-3 top-3 flex flex-col gap-1">
        <button type="button" aria-label="Zoom in" className={zoomBtn} disabled={zoom === 0} onClick={() => setZoom(zoom - 1)}>+</button>
        <button type="button" aria-label="Zoom out" className={zoomBtn} disabled={zoom === ZOOMS.length - 1} onClick={() => setZoom(zoom + 1)}>−</button>
        <button type="button" aria-label="Recentre map" className={zoomBtn}
          onClick={() => { setZoom(START_ZOOM); setCenter({ x: 0, y: 0 }); }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="8" cy="8" r="4.5" />
            <path d="M8 0.5v3M8 12.5v3M0.5 8h3M12.5 8h3" />
          </svg>
        </button>
      </div>

      {hovered && mode === 'dots' && (
        <div className="pointer-events-none absolute bottom-14 left-3 max-w-[70%] rounded-lg border border-line bg-surface px-3 py-1.5 text-sm shadow-md">
          <div className="font-medium [overflow-wrap:anywhere]">{hovered.name}</div>
          <div className="text-muted">{STATUS_LABELS[statusAt(hovered, moment)]}</div>
        </div>
      )}

      {mode === 'dots' ? (
        <ul aria-label="Map legend" className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line px-3 py-2 text-sm text-muted">
          {STATES.map((s) => (
            <li key={s} className="flex items-center gap-1.5"><StatusMark status={s} />{STATUS_LABELS[s]}</li>
          ))}
        </ul>
      ) : (
        <p className="m-0 border-t border-line px-3 py-2 text-sm text-muted">Darker cells hold more places. Click a cell to zoom in.</p>
      )}
    </div>
  );
}
