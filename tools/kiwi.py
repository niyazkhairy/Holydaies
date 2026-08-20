"""Minimal Kiwi (fig-kiwi) decoder — enough to read a Figma .fig scene graph."""
import struct

BUILTIN = {-1: 'bool', -2: 'byte', -3: 'int', -4: 'uint', -5: 'float', -6: 'string',
           -7: 'int64', -8: 'uint64'}
ENUM, STRUCT, MESSAGE = 0, 1, 2


class Reader:
    def __init__(self, data):
        self.d = data
        self.i = 0

    def byte(self):
        b = self.d[self.i]
        self.i += 1
        return b

    def varuint(self):
        v = shift = 0
        while True:
            b = self.byte()
            v |= (b & 0x7F) << shift
            shift += 7
            if not (b & 0x80):
                return v & 0xFFFFFFFF

    def varint(self):
        v = self.varuint()
        return ~(v >> 1) if v & 1 else v >> 1

    def varuint64(self):
        v = shift = 0
        while True:
            b = self.byte()
            v |= (b & 0x7F) << shift
            shift += 7
            if not (b & 0x80) or shift >= 63:
                return v

    def varint64(self):
        v = self.varuint64()
        return ~(v >> 1) if v & 1 else v >> 1

    def float(self):
        first = self.d[self.i]
        if first == 0:
            self.i += 1
            return 0.0
        bits = int.from_bytes(self.d[self.i:self.i + 4], 'little')
        self.i += 4
        bits = ((bits << 23) | (bits >> 9)) & 0xFFFFFFFF
        return struct.unpack('<f', struct.pack('<I', bits))[0]

    def string(self):
        start = self.i
        while self.d[self.i] != 0:
            self.i += 1
        s = self.d[start:self.i].decode('utf-8', 'replace')
        self.i += 1
        return s


def parse_schema(data):
    r = Reader(data)
    defs = []
    for _ in range(r.varuint()):
        name = r.string()
        kind = r.byte()
        fields = []
        for _ in range(r.varuint()):
            fname = r.string()
            ftype = r.varint()
            is_array = bool(r.byte())
            value = r.varuint()
            fields.append({'name': fname, 'type': ftype, 'array': is_array, 'value': value})
        defs.append({'name': name, 'kind': kind, 'fields': fields})
    return defs


class Decoder:
    def __init__(self, defs):
        self.defs = defs
        self.by_name = {d['name']: i for i, d in enumerate(defs)}

    def value(self, r, t):
        if t < 0:
            k = BUILTIN[t]
            if k == 'bool':   return bool(r.byte())
            if k == 'byte':   return r.byte()
            if k == 'int':    return r.varint()
            if k == 'uint':   return r.varuint()
            if k == 'float':  return r.float()
            if k == 'string': return r.string()
            if k == 'int64':  return r.varint64()
            if k == 'uint64': return r.varuint64()
        d = self.defs[t]
        if d['kind'] == ENUM:
            v = r.varuint()
            for f in d['fields']:
                if f['value'] == v:
                    return f['name']
            return v
        return self.message(r, t)

    def field(self, r, f):
        if f['array']:
            return [self.value(r, f['type']) for _ in range(r.varuint())]
        return self.value(r, f['type'])

    def message(self, r, tidx):
        d = self.defs[tidx]
        out = {}
        if d['kind'] == STRUCT:
            for f in d['fields']:
                out[f['name']] = self.field(r, f)
            return out
        by_id = {f['value']: f for f in d['fields']}
        while True:
            fid = r.varuint()
            if fid == 0:
                return out
            f = by_id.get(fid)
            if f is None:
                raise ValueError(f"unknown field id {fid} in {d['name']}")
            out[f['name']] = self.field(r, f)
