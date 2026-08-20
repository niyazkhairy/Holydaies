# Shop Together

A working, high-fidelity web app built from the **Shop Toghether** Figma design file
(`Shop_Toghether.fig`). Not a click-through prototype — a real React application with
state, so items can actually be added, checked off, sorted, shared and carted.

## Running it

```bash
cd app
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build && npm run preview    # production build
```

The app renders at the design's native **430 × 932** viewport inside a phone shell.

## How the design was extracted

Nothing here was eyeballed from screenshots. A `.fig` file is a ZIP wrapping a
**fig-kiwi** container, and the tooling in `tools/` decodes it end to end:

| Step | File | What it does |
|---|---|---|
| 1 | `tools/kiwi.py` | Minimal [Kiwi](https://github.com/evanw/kiwi) decoder — varint / zigzag / the rotated-bits float format, plus schema and message parsing |
| 2 | `tools/extract.py` | Walks the decoded scene graph and emits `design.json`: the node tree with absolute geometry, fills, strokes, radii, effects and full text styling |

The container layout:

```
Shop_Toghether.fig  (zip)
├── canvas.fig      → "fig-kiwi" magic + version
│   ├── chunk 0     → schema      (deflate, 636 definitions)
│   └── chunk 1     → scene graph (zstd,   635 KB → 1441 nodes)
├── images/         → 29 raw assets, named by SHA-1
├── meta.json
└── thumbnail.png
```

Decoding yields exact values rather than approximations, so the tokens in
`app/src/design/tokens.css` are the design's real fills:

- **Brand** `#0052E2` blue, `#2067E6` nav, `#011E60` navy, `#E9F1FE` tint, `#FFC221` spark
- **Ink** `#000000` `#2E2F33` `#424242` `#4B4B4B` `#666666`, muted `#909196` / `#B0B0B0`
- **Semantic** `#2A8703` green on `#D8E9D1`, `#C5161B` red
- **Type** Everyday Sans (Walmart's brand face) Regular / Medium / Bold, 9–21 px,
  tracking mostly 1–3 %

Product photography in `app/public/products/` is lifted straight out of the archive —
every image is an original asset from the design, matched to its node by image hash.

## Screens

All 13 from the source file:

| | | | |
|---|---|---|---|
| 01 Lists | 02 Name a list | 03 Add an item | 04 Search inside the list |
| 05 Ready list | 06 Sort by | 07 List share | 08 List settings |
| 09 Share list settings | 10 Permission | 11 In-store mode | 12 In-store layout |
| 13 Shopping done | | | |

## What actually works

State lives in `app/src/store.tsx` (reducer + context):

- Create, rename and delete lists
- Typeahead search that adds real products to the list
- Per-item quantity, remove, and check-off
- Cart badge and running total that respond to *Add to cart* / *Add all to cart*
- **Sort by** genuinely reorders (most recent / department / price low / price high)
- Share permissions per person (only view / check items off / add and check off)
- In-store mode with aisle grouping, a live picked-progress bar, and a card/list
  layout toggle
- Trip summary with totals computed from the basket

## Verification

`app/shots.mjs` drives the real Chromium build via Playwright: it captures every
screen to `app/shots/` and runs a behaviour smoke test.

```bash
cd app && npm run build && npm run preview &
node shots.mjs
```

```
PASS  estimate matches the design ($37.66)
PASS  savings matches the design (-$12.45)
PASS  Add to cart increments the badge
PASS  Add all to cart adds every unit
PASS  Remove deletes the row
PASS  Sort by actually reorders
PASS  checking an item advances the picked counter
PASS  layout toggle switches to list view
```

## Notes on fidelity

- **Everyday Sans is Walmart proprietary** and cannot be bundled. The font stack asks
  for it first and falls back to Inter, so the app renders in the real face on any
  machine that has it installed.
- **Screen 05's item list is a bitmap in the source design** — the designer pasted a
  Walmart app screenshot rather than drawing the rows. Those rows are rebuilt here as
  real components driven by the catalogue, which is why they reflow, sort and respond.
- Prices are tuned so Weekly Start totals **$37.66** with **-$12.45** savings, matching
  the figures printed in the design.
