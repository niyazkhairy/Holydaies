"""Lift named icons out of the decoded design as reusable SVG path sets.

Each icon is a rectangle of the canvas: every vector inside it is collected,
translated into a local coordinate space, and given a viewBox computed from the
*actual path bounds*. Deriving the box from the geometry (rather than from the
Figma node size) is what stops icons like the location pin being clipped.
"""
import json, re, sys

NUM = re.compile(r'-?\d+(?:\.\d+)?')


def path_bounds(d):
    """Bounds over every coordinate pair in an absolute M/L/Q/C path."""
    xs, ys = [], []
    for cmd in re.finditer(r'([MLQCZ])([^MLQCZ]*)', d):
        vals = [float(v) for v in NUM.findall(cmd.group(2))]
        for i in range(0, len(vals) - 1, 2):
            xs.append(vals[i]); ys.append(vals[i + 1])
    return (min(xs), min(ys), max(xs), max(ys)) if xs else None


def shift(d, dx, dy):
    """Translate an absolute path by (dx, dy)."""
    out = []
    for cmd in re.finditer(r'([MLQCZ])([^MLQCZ]*)', d):
        letter, body = cmd.group(1), cmd.group(2)
        vals = [float(v) for v in NUM.findall(body)]
        moved = []
        for i in range(0, len(vals) - 1, 2):
            moved += [round(vals[i] + dx, 2), round(vals[i + 1] + dy, 2)]
        out.append(letter + (' ' + ' '.join(str(int(v) if v == int(v) else v) for v in moved) if moved else ''))
    return ' '.join(out)


def visual_box(n):
    """True on-canvas bounds; a flipped node's x/y is its matrix translation."""
    if not n.get('m'):
        return n['x'], n['y'], n['x'] + n['w'], n['y'] + n['h']
    a, b, c, d, e, f = n['m']
    pts = [(a * X + c * Y + e, b * X + d * Y + f)
           for X, Y in ((0, 0), (n['w'], 0), (0, n['h']), (n['w'], n['h']))]
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


def collect(screen, spec):
    """Every vector path whose visual centre lies within `r` of (cx, cy)."""
    cx, cy, r = spec
    paths = []
    for n in screen['nodes']:
        if not n.get('geom') or not n.get('visible', True):
            continue
        bx0, by0, bx1, by1 = visual_box(n)
        if max(abs((bx0 + bx1) / 2 - cx), abs((by0 + by1) / 2 - cy)) > r:
            continue
        fill = None
        for f in (n.get('style', {}).get('fills') or []):
            if f.get('type') == 'SOLID':
                fill = f.get('hex')
        for f in (n.get('style', {}).get('strokes') or []):
            if fill is None and f.get('type') == 'SOLID':
                fill = f.get('hex')
        src = n['geom'].get('fill') or n['geom'].get('stroke') or []
        # a flipped/rotated icon part needs its matrix baked into the path
        m = n.get('m')
        for p in src:
            d = p['d']
            if m:
                a, b, c, dd, e, f_ = m
                pts = []
                for cmd in re.finditer(r'([MLQCZ])([^MLQCZ]*)', d):
                    vals = [float(v) for v in NUM.findall(cmd.group(2))]
                    moved = []
                    for i in range(0, len(vals) - 1, 2):
                        X, Y = vals[i], vals[i + 1]
                        moved += [round(a * X + c * Y, 3), round(b * X + dd * Y, 3)]
                    pts.append(cmd.group(1) + (' ' + ' '.join(map(str, moved)) if moved else ''))
                d = ' '.join(pts)
                d = shift(d, e, f_)
            else:
                d = shift(d, n['x'], n['y'])
            paths.append({'d': d, 'fill': fill or '#000', 'rule': p['rule']})
    return paths


def build_icon(screen, spec, pad=0.0):
    paths = collect(screen, spec)
    if not paths:
        return None
    bs = [path_bounds(p['d']) for p in paths]
    bs = [b for b in bs if b]
    if not bs:
        return None
    x0 = min(b[0] for b in bs) - pad
    y0 = min(b[1] for b in bs) - pad
    x1 = max(b[2] for b in bs) + pad
    y1 = max(b[3] for b in bs) + pad
    return {
        'w': round(x1 - x0, 2), 'h': round(y1 - y0, 2),
        'paths': [{'d': shift(p['d'], -x0, -y0), 'fill': p['fill'], 'rule': p['rule']} for p in paths],
    }


# name -> (screen name, (centre-x, centre-y, radius))
SPECS = {
    'search':       ('01 Lists', (46.5, 68.5, 14)),
    'barcode':      ('01 Lists', (332, 68, 16)),
    'cart':         ('01 Lists', (396.7, 59.7, 16)),
    'chevron-down': ('01 Lists', (409, 115, 14)),
    'heart':        ('01 Lists', (46, 286.5, 14)),
    'nav-shop':     ('01 Lists', (39, 876, 18)),
    'nav-items':    ('01 Lists', (129, 879, 18)),
    'nav-account':  ('01 Lists', (375, 876, 20)),
    'nav-services': ('01 Lists', (300.5, 879.8, 14)),
    'back':         ('05 Ready list online mode', (28, 66, 14)),
    'share':        ('05 Ready list online mode', (341.5, 150.5, 12)),
    'gear':         ('05 Ready list online mode', (382.5, 150.5, 12)),
    'cart-sm':      ('05 Ready list online mode', (259, 241, 14)),
    'close':        ('07 List share', (398, 577, 14)),
    'chevron-right':('07 List share', (403.5, 833.5, 12)),
    'eye':          ('07 List share', (35, 655.5, 18)),
    'checkbox':     ('07 List share', (35, 744, 16)),
    'pencil':       ('07 List share', (35, 846, 16)),
    'grid-view':    ('11 Instore mode list', (346, 124, 16)),
    'list-view':    ('11 Instore mode list', (388, 123.5, 16)),
    'pin':          ('11 Instore mode list', (23, 193, 12)),
    'trash':        ('10 Permission setting for a shared list', (32, 862, 10)),
}

if __name__ == '__main__':
    design = json.load(open(sys.argv[1]))
    by_name = {}
    for s in design:
        by_name.setdefault(s['name'], s)

    icons, missing = {}, []
    for name, (screen_name, box) in SPECS.items():
        s = by_name.get(screen_name)
        icon = build_icon(s, box) if s else None
        if icon:
            icons[name] = icon
        else:
            missing.append(name)

    json.dump(icons, open(sys.argv[2], 'w'))
    for k, v in sorted(icons.items()):
        print(f"  {k:<14} {v['w']:>6.2f} x {v['h']:>6.2f}  paths={len(v['paths'])}")
    print(f"\nextracted {len(icons)}/{len(SPECS)}" + (f"   MISSING: {missing}" if missing else ""))
