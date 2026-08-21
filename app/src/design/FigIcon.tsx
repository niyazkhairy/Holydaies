import icons from './icons.json';

type IconDef = { w: number; h: number; paths: { d: string; fill: string; rule: string }[] };
const SET = icons as unknown as Record<string, IconDef>;

export type IconName = keyof typeof icons;

/**
 * Renders an icon lifted straight out of the Figma file.
 *
 * The viewBox comes from the real path bounds rather than the Figma node box,
 * so nothing is ever clipped — that is what fixes the cropped location pin.
 * `size` sets the longest edge and the other axis keeps the true aspect ratio.
 */
export function FigIcon({
  name, size = 20, color, style, title,
}: {
  name: IconName | string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  title?: string;
}) {
  const icon = SET[name as string];
  if (!icon) return null;
  const k = size / Math.max(icon.w, icon.h);
  const w = icon.w * k, h = icon.h * k;
  return (
    <svg
      width={w} height={h}
      viewBox={`0 0 ${icon.w} ${icon.h}`}
      style={{ display: 'block', overflow: 'visible', flex: '0 0 auto', ...style }}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title && <title>{title}</title>}
      {icon.paths.map((p, i) => (
        <path key={i} d={p.d} fill={color ?? p.fill} fillRule={p.rule as 'nonzero' | 'evenodd'} />
      ))}
    </svg>
  );
}

export const hasIcon = (name: string) => Boolean(SET[name]);
