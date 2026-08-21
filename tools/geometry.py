"""Decode Figma `commandsBlob` path streams into SVG path data.

Format (verified against known shapes — blob 0 traces the 430x932 frame, and
blob 2's control points sit at the 0.5523 circle constant):

    record := u8 command, then float32 args (little-endian)
      0 CLOSE  (0 args)
      1 MOVE   (x, y)
      2 LINE   (x, y)
      3 QUAD   (x1, y1, x, y)
      4 CUBIC  (x1, y1, x2, y2, x, y)
"""
import struct

ARGS = {0: 0, 1: 2, 2: 2, 3: 4, 4: 6}
LETTER = {0: 'Z', 1: 'M', 2: 'L', 3: 'Q', 4: 'C'}


def n(v):
    r = round(v, 2)
    return int(r) if r == int(r) else r


def decode_path(blob: bytes) -> str:
    out, i = [], 0
    while i < len(blob):
        cmd = blob[i]; i += 1
        k = ARGS.get(cmd)
        if k is None:
            raise ValueError(f'unknown path command {cmd} at byte {i-1}')
        if i + 4 * k > len(blob):
            break
        args = struct.unpack('<' + 'f' * k, blob[i:i + 4 * k]) if k else ()
        i += 4 * k
        out.append(LETTER[cmd] + (' ' + ' '.join(str(n(a)) for a in args) if k else ''))
    return ' '.join(out)


def geometry_paths(node, blobs):
    """Return {'fill': [...], 'stroke': [...]} SVG path strings for a vector node."""
    res = {}
    for key, out in (('fillGeometry', 'fill'), ('strokeGeometry', 'stroke')):
        paths = []
        for g in node.get(key) or []:
            idx = g.get('commandsBlob')
            if idx is None or idx >= len(blobs):
                continue
            try:
                d = decode_path(blobs[idx])
            except ValueError:
                continue
            if d:
                paths.append({'d': d, 'rule': 'evenodd' if g.get('windingRule') == 'ODD' else 'nonzero'})
        if paths:
            res[out] = paths
    return res
