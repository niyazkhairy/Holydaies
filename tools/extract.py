"""Extract a clean design spec (tree + absolute geometry + styles) from a decoded .fig scene."""
import sys, json, pickle
from geometry import geometry_paths

def gid(g):
    return f"{g['sessionID']}:{g['localID']}" if g else None

def hexcolor(c):
    return '#%02X%02X%02X' % tuple(round(max(0.0, min(1.0, c[k])) * 255) for k in 'rgb')

def build(scene):
    nodes = {}
    for n in scene['nodeChanges']:
        i = gid(n.get('guid'))
        if i:
            nodes[i] = n
    kids = {}
    for i, n in nodes.items():
        pi = n.get('parentIndex')
        if not pi:
            continue
        p = gid(pi.get('guid'))
        kids.setdefault(p, []).append((pi.get('position', ''), i))
    for p in kids:
        kids[p].sort()
    return nodes, {p: [i for _, i in v] for p, v in kids.items()}

def paint(p):
    if not p.get('visible', True):
        return None
    t = p.get('type')
    o = {'type': t, 'opacity': round(p.get('opacity', 1.0), 4), 'blend': p.get('blendMode')}
    if t == 'SOLID' and p.get('color'):
        o['hex'] = hexcolor(p['color'])
        o['a'] = round(p['color'].get('a', 1.0), 4)
    elif t == 'IMAGE':
        img = p.get('image') or {}
        h = img.get('hash') or ''
        o['hash'] = bytes(h).hex() if isinstance(h, list) else h
        o['scaleMode'] = p.get('imageScaleMode')
        # Figma's "crop" fill carries a normalised source rect in this matrix:
        # x from m02 (width m00), y from m12 (height m11)
        tr = p.get('transform')
        if tr:
            o['crop'] = [round(tr.get('m00', 1), 6), round(tr.get('m02', 0), 6),
                         round(tr.get('m11', 1), 6), round(tr.get('m12', 0), 6)]
    elif t and 'GRADIENT' in t:
        o['stops'] = [{'pos': round(s.get('position', 0), 4),
                       'hex': hexcolor(s['color']), 'a': round(s['color'].get('a', 1), 4)}
                      for s in p.get('stops', []) if s.get('color')]
        o['transform'] = p.get('transform')
    return o

def radii(n):
    keys = ['rectangleTopLeftCornerRadius', 'rectangleTopRightCornerRadius',
            'rectangleBottomRightCornerRadius', 'rectangleBottomLeftCornerRadius']
    v = [n.get(k) for k in keys]
    if any(x is not None for x in v):
        return [round(x or 0, 2) for x in v]
    c = n.get('cornerRadius')
    return [round(c, 2)] * 4 if c else None

def style(n):
    o = {}
    fills = [q for q in (paint(p) for p in n.get('fillPaints', []) or []) if q]
    if fills:
        o['fills'] = fills
    strokes = [q for q in (paint(p) for p in n.get('strokePaints', []) or []) if q]
    if strokes:
        o['strokes'] = strokes
        o['strokeWeight'] = round(n.get('strokeWeight', 1) or 1, 2)
        o['strokeAlign'] = n.get('strokeAlign')
    r = radii(n)
    if r:
        o['radius'] = r
    if n.get('opacity') is not None and n['opacity'] != 1.0:
        o['opacity'] = round(n['opacity'], 4)
    fx = []
    for e in n.get('effects', []) or []:
        if not e.get('visible', True):
            continue
        d = {'type': e.get('type'), 'radius': round(e.get('radius', 0) or 0, 2)}
        if e.get('color'):
            d['hex'] = hexcolor(e['color'])
            d['a'] = round(e['color'].get('a', 1), 4)
        if e.get('offset'):
            d['dx'] = round(e['offset'].get('x', 0), 2)
            d['dy'] = round(e['offset'].get('y', 0), 2)
        if e.get('spread'):
            d['spread'] = round(e['spread'], 2)
        fx.append(d)
    if fx:
        o['effects'] = fx
    if n.get('blendMode') and n['blendMode'] != 'NORMAL':
        o['blend'] = n['blendMode']
    return o

def text(n):
    td = n.get('textData') or {}
    if not td.get('characters'):
        return None
    fn = n.get('fontName') or {}
    lh, ls = n.get('lineHeight') or {}, n.get('letterSpacing') or {}
    return {
        'chars': td['characters'],
        'family': fn.get('family'), 'style': fn.get('style'), 'ps': fn.get('postscript'),
        'size': round(n.get('fontSize', 0) or 0, 2),
        'lineHeight': {'v': round(lh.get('value', 0), 2), 'u': lh.get('units')} if lh else None,
        'letterSpacing': {'v': round(ls.get('value', 0), 2), 'u': ls.get('units')} if ls else None,
        'alignH': n.get('textAlignHorizontal'), 'alignV': n.get('textAlignVertical'),
        'autoResize': n.get('textAutoResize'),
        'case': n.get('textCase'), 'deco': n.get('textDecoration'),
    }

IDENTITY = (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)


def mat_of(n):
    t = n.get('transform') or {}
    return (t.get('m00', 1.0), t.get('m10', 0.0), t.get('m01', 0.0),
            t.get('m11', 1.0), t.get('m02', 0.0), t.get('m12', 0.0))


def mat_mul(p, c):
    """Compose parent x child for CSS-order matrices (a, b, c, d, e, f)."""
    pa, pb, pc, pd, pe, pf = p
    ca, cb, cc, cd, ce, cf = c
    return (pa * ca + pc * cb,       pb * ca + pd * cb,
            pa * cc + pc * cd,       pb * cc + pd * cd,
            pa * ce + pc * cf + pe,  pb * ce + pd * cf + pf)


def walk(nid, nodes, kids, parent_m, depth, out, blobs):
    n = nodes[nid]
    m = mat_mul(parent_m, mat_of(n))
    sz = n.get('size') or {}
    rec = {'id': nid, 'name': n.get('name'), 'type': n.get('type'), 'depth': depth,
           'x': round(m[4], 2), 'y': round(m[5], 2),
           'w': round(sz.get('x', 0), 2), 'h': round(sz.get('y', 0), 2),
           'visible': n.get('visible', True)}
    if tuple(round(v, 5) for v in m[:4]) != IDENTITY[:4]:
        rec['m'] = [round(v, 5) for v in m]
    st = style(n)
    if st:
        rec['style'] = st
    tx = text(n)
    if tx:
        rec['text'] = tx
    if n.get('clipsContent') is not None:
        rec['clips'] = n['clipsContent']
    if n.get('type') in ('VECTOR', 'BOOLEAN_OPERATION', 'STAR', 'REGULAR_POLYGON', 'LINE'):
        g = geometry_paths(n, blobs)
        if g:
            rec['geom'] = g
    out.append(rec)
    for c in kids.get(nid, []):
        walk(c, nodes, kids, m, depth + 1, out, blobs)

if __name__ == '__main__':
    S = sys.argv[1]
    scene = pickle.load(open(S + '/scene.pkl', 'rb'))
    blobs = [bytes(b['bytes']) for b in (scene.get('blobs') or [])]
    nodes, kids = build(scene)
    canvas = [i for i, n in nodes.items() if n.get('type') == 'CANVAS']
    frames = []
    for c in canvas:
        for f in kids.get(c, []):
            if nodes[f].get('type') == 'FRAME':
                frames.append(f)
    screens = []
    for f in frames:
        out = []
        walk(f, nodes, kids, IDENTITY, 0, out, blobs)
        # capture the frame origin as scalars first — `out[0]` IS the frame, so
        # reading through it inside the loop would zero itself on iteration one
        ox, oy = out[0]['x'], out[0]['y']
        for r in out:
            r['x'] = round(r['x'] - ox, 2)
            r['y'] = round(r['y'] - oy, 2)
            if 'm' in r:
                r['m'][4] = round(r['m'][4] - ox, 2)
                r['m'][5] = round(r['m'][5] - oy, 2)
        screens.append({'id': f, 'name': nodes[f].get('name'), 'nodes': out})
    screens.sort(key=lambda s: s['name'])
    json.dump(screens, open(S + '/design.json', 'w'), indent=None)
    print('screens:', len(screens))
    for s in screens:
        print(f"  {s['name'][:44]:<44} {len(s['nodes']):>4} nodes")
