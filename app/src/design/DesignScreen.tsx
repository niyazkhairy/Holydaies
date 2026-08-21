import type { CSSProperties } from 'react';
import design from './design.json';

/* ------------------------------------------------------------------ types */
type Paint = {
  type: string; opacity?: number; blend?: string;
  hex?: string; a?: number;
  hash?: string; scaleMode?: string;
  /** normalised source rect as [w, x, h, y] */
  crop?: number[];
  stops?: { pos: number; hex: string; a: number }[];
};
type Effect = { type: string; radius: number; hex?: string; a?: number; dx?: number; dy?: number; spread?: number };
type Text = {
  chars: string; family: string; style: string; size: number;
  lineHeight: { v: number; u: string } | null;
  letterSpacing: { v: number; u: string } | null;
  alignH?: string; alignV?: string; case?: string; deco?: string;
  autoResize?: string;
};
type Geom = { fill?: { d: string; rule: string }[]; stroke?: { d: string; rule: string }[] };
export type Node = {
  id: string; name: string; type: string; depth: number;
  x: number; y: number; w: number; h: number; visible: boolean;
  style?: {
    fills?: Paint[]; strokes?: Paint[]; strokeWeight?: number; strokeAlign?: string;
    radius?: number[]; opacity?: number; effects?: Effect[]; blend?: string;
  };
  text?: Text; clips?: boolean; geom?: Geom;
  /** full 2x3 affine (a,b,c,d,e,f) — present only when not a plain translation */
  m?: number[];
};
export type Screen = { id: string; name: string; nodes: Node[] };

export const SCREENS = design as unknown as Screen[];
export const screenById = (id: string) => SCREENS.find(s => s.id === id);
export const FRAME_W = 430;
export const FRAME_H = 932;

/* ------------------------------------------------------------- helpers */
const rgba = (hex?: string, a = 1) => {
  if (!hex) return 'transparent';
  if (a >= 1) return hex;
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

const WEIGHT: Record<string, number> = { Thin: 100, Light: 300, Regular: 400, Medium: 500, SemiBold: 600, Bold: 700, Black: 900 };

const solid = (p?: Paint) =>
  p && p.type === 'SOLID' ? rgba(p.hex, (p.a ?? 1) * (p.opacity ?? 1)) : undefined;

function paintToBackground(p: Paint, assetUrl: (h: string) => string): string | undefined {
  if (p.type === 'SOLID') return solid(p);
  if (p.type === 'IMAGE' && p.hash) return `url("${assetUrl(p.hash)}")`;
  if (p.type?.includes('GRADIENT') && p.stops?.length) {
    const stops = p.stops.map(s => `${rgba(s.hex, s.a)} ${(s.pos * 100).toFixed(1)}%`).join(', ');
    return `linear-gradient(180deg, ${stops})`;
  }
  return undefined;
}

function shadow(effects?: Effect[]) {
  if (!effects?.length) return undefined;
  const parts = effects
    .filter(e => e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW')
    .map(e => `${e.type === 'INNER_SHADOW' ? 'inset ' : ''}${e.dx ?? 0}px ${e.dy ?? 0}px ${e.radius}px ${e.spread ?? 0}px ${rgba(e.hex, e.a ?? 1)}`);
  return parts.length ? parts.join(', ') : undefined;
}

/** Figma stores "auto" line height as 100% — that means the font's own metrics,
 *  not 1.0. Anything else is a real ratio or a pixel value. */
function lineHeight(t: Text): string | number | undefined {
  const lh = t.lineHeight;
  if (!lh) return undefined;
  if (lh.u === 'PIXELS') return `${lh.v}px`;
  return lh.v === 100 ? 'normal' : lh.v / 100;
}

function letterSpacing(t: Text): string | undefined {
  const ls = t.letterSpacing;
  if (!ls || !ls.v) return undefined;
  return ls.u === 'PIXELS' ? `${ls.v}px` : `${ls.v / 100}em`;
}

const JUSTIFY: Record<string, string> = { TOP: 'flex-start', CENTER: 'center', BOTTOM: 'flex-end' };
const ALIGN: Record<string, string> = { LEFT: 'left', CENTER: 'center', RIGHT: 'right', JUSTIFIED: 'justify' };

/* --------------------------------------------------------------- node */
function NodeView({ n, assetUrl }: { n: Node; assetUrl: (h: string) => string }) {
  if (!n.visible) return null;
  const st = n.style ?? {};

  // A node with a flip or rotation carries its full matrix; positioning via
  // transform keeps those exact instead of silently dropping to a translation.
  const placement: CSSProperties = n.m
    ? { left: 0, top: 0, transform: `matrix(${n.m.join(',')})`, transformOrigin: '0 0' }
    : { left: n.x, top: n.y };

  const base: CSSProperties = {
    position: 'absolute',
    ...placement,
    width: n.w, height: n.h,
    opacity: st.opacity ?? 1,
    mixBlendMode: st.blend ? (st.blend.toLowerCase().replace(/_/g, '-') as CSSProperties['mixBlendMode']) : undefined,
    pointerEvents: 'none',
  };

  /* ---- vectors: the design's real path data ---- */
  if (n.geom) {
    const fill = st.fills?.find(f => f.type === 'SOLID');
    const stroke = st.strokes?.find(f => f.type === 'SOLID');
    return (
      <svg data-id={n.id} style={base} viewBox={`0 0 ${n.w} ${n.h}`} width={n.w} height={n.h}
           preserveAspectRatio="none" aria-hidden="true" focusable="false">
        {n.geom.fill?.map((p, i) => (
          <path key={'f' + i} d={p.d} fill={solid(fill) ?? 'none'} fillRule={p.rule as 'nonzero' | 'evenodd'} />
        ))}
        {/* strokeGeometry is already outlined by Figma, so it fills rather than strokes */}
        {!n.geom.fill && n.geom.stroke?.map((p, i) => (
          <path key={'s' + i} d={p.d} fill={solid(stroke) ?? solid(fill) ?? 'none'} fillRule={p.rule as 'nonzero' | 'evenodd'} />
        ))}
      </svg>
    );
  }

  /* ---- text ---- */
  if (n.text) {
    const t = n.text;
    const style: CSSProperties = {
      ...base,
      display: 'flex',
      justifyContent: JUSTIFY[t.alignV ?? 'TOP'] ?? 'flex-start',
      flexDirection: 'column',
      fontFamily: `'${t.family}', 'Everyday Sans', Inter, system-ui, sans-serif`,
      fontSize: t.size,
      fontWeight: WEIGHT[t.style] ?? 400,
      lineHeight: lineHeight(t),
      letterSpacing: letterSpacing(t),
      color: solid(st.fills?.[0]) ?? '#000',
      textAlign: (ALIGN[t.alignH ?? 'LEFT'] ?? 'left') as CSSProperties['textAlign'],
      textTransform: t.case === 'UPPER' ? 'uppercase' : t.case === 'LOWER' ? 'lowercase' : undefined,
      textDecoration: t.deco === 'UNDERLINE' ? 'underline' : t.deco === 'STRIKETHROUGH' ? 'line-through' : undefined,
      // Figma auto-sizes 385 of the 410 text nodes to their content, so those
      // must never wrap; only explicitly fixed-width text reflows.
      whiteSpace: t.autoResize === 'WIDTH_AND_HEIGHT' ? 'pre' : 'pre-wrap',
      overflow: 'visible',
    };
    return <div data-id={n.id} style={style}>{t.chars}</div>;
  }

  /* ---- rectangles, ellipses, frames ---- */
  const fill = st.fills?.[0];
  const bg = fill ? paintToBackground(fill, assetUrl) : undefined;
  const isImage = fill?.type === 'IMAGE';
  const stroke = st.strokes?.find(s => s.type === 'SOLID');
  const r = st.radius;

  // A cropped image fill shows only a sub-rectangle of the source: blow the
  // bitmap up so that rectangle exactly fills the box, then offset it into place.
  let bgSize: string | undefined;
  let bgPos: string | undefined;
  if (isImage && fill?.crop) {
    const [cw, cx, ch, cy] = fill.crop;
    const w = n.w / cw, h = n.h / ch;
    bgSize = `${w}px ${h}px`;
    bgPos = `${-cx * w}px ${-cy * h}px`;
  } else if (isImage) {
    bgSize = fill?.scaleMode === 'FIT' ? 'contain' : 'cover';
    bgPos = 'center';
  }

  const style: CSSProperties = {
    ...base,
    background: bg,
    backgroundSize: bgSize,
    backgroundPosition: bgPos,
    backgroundRepeat: isImage ? 'no-repeat' : undefined,
    borderRadius: n.type === 'ELLIPSE' ? '50%' : r ? `${r[0]}px ${r[1]}px ${r[2]}px ${r[3]}px` : undefined,
    boxShadow: shadow(st.effects),
    overflow: n.clips ? 'hidden' : undefined,
  };
  if (stroke && st.strokeWeight) {
    // INSIDE strokes are drawn with an inset ring so the box keeps its exact size
    const c = solid(stroke)!;
    style.boxShadow = [style.boxShadow, `inset 0 0 0 ${st.strokeWeight}px ${c}`].filter(Boolean).join(', ');
  }
  return <div data-id={n.id} style={style} />;
}

/* ------------------------------------------------------------- screen */
export type Hotspot = { node: string; to: string; label: string };

export function DesignScreen({
  screen, hotspots = [], onNavigate, assetUrl,
}: {
  screen: Screen;
  hotspots?: Hotspot[];
  onNavigate?: (to: string) => void;
  assetUrl: (hash: string) => string;
}) {
  const byId = new Map(screen.nodes.map(n => [n.id, n]));
  return (
    <div style={{ position: 'relative', width: FRAME_W, height: FRAME_H, overflow: 'hidden', background: '#fff' }}>
      {screen.nodes.slice(1).map(n => <NodeView key={n.id} n={n} assetUrl={assetUrl} />)}

      {hotspots.map(h => {
        const n = byId.get(h.node);
        if (!n) return null;
        // guarantee a usable tap target without moving the visual centre
        const w = Math.max(n.w, 30), hh = Math.max(n.h, 30);
        return (
          <button key={h.node} aria-label={h.label} onClick={() => onNavigate?.(h.to)}
            style={{
              position: 'absolute',
              left: n.x - (w - n.w) / 2, top: n.y - (hh - n.h) / 2,
              width: w, height: hh, background: 'transparent', border: 0,
              cursor: 'pointer', padding: 0, borderRadius: 6,
            }} />
        );
      })}
    </div>
  );
}
