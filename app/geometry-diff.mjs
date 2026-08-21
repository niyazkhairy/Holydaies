import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const design = JSON.parse(readFileSync('src/design/design.json', 'utf8'));
const seen = new Set();
const screens = design.filter(s => (seen.has(s.name) ? false : (seen.add(s.name), true)));
const TOL = 0.6;

/** A flipped or rotated node's visual box is the transformed unit box, not the
 *  matrix translation — compute the real bounds before comparing. */
function expectedBox(n) {
  if (!n.m) return { x: n.x, y: n.y, w: n.w, h: n.h };
  const [a, b, c, d, e, f] = n.m;
  const pts = [[0, 0], [n.w, 0], [0, n.h], [n.w, n.h]]
    .map(([x, y]) => [a * x + c * y + e, b * x + d * y + f]);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  return { x: Math.min(...xs), y: Math.min(...ys),
           w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let totalNodes = 0, totalBad = 0, textSizeDrift = [];
const rows = [];

for (const s of screens) {
  const p = await b.newPage({ viewport: { width: 478, height: 986 } });
  await p.goto(`http://localhost:4173/#${s.id}`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(150);

  const measured = await p.evaluate(() => {
    const frame = document.querySelector('.device > div > div');
    const fb = frame.getBoundingClientRect();
    // the device is scaled to fit; divide it back out to compare in design units
    const k = fb.width / 430;
    const out = {};
    frame.querySelectorAll('[data-id]').forEach(el => {
      const r = el.getBoundingClientRect();
      out[el.getAttribute('data-id')] = {
        x: (r.x - fb.x) / k, y: (r.y - fb.y) / k, w: r.width / k, h: r.height / k,
        text: el.tagName === 'DIV' && !!el.textContent,
      };
    });
    return out;
  });
  await p.close();

  let bad = 0, n = 0, missing = 0;
  for (const node of s.nodes.slice(1)) {
    if (!node.visible) continue;
    const m = measured[node.id];
    if (!m) { missing++; continue; }
    n++;
    const exp = expectedBox(node);
    const dx = Math.abs(m.x - exp.x), dy = Math.abs(m.y - exp.y);
    // text boxes are re-measured by the browser, so only position is comparable
    const dw = node.text ? 0 : Math.abs(m.w - exp.w);
    const dh = node.text ? 0 : Math.abs(m.h - exp.h);
    if (node.text && Math.abs(m.w - exp.w) > 2) textSizeDrift.push(`${s.name}|${node.name}|Δw ${(m.w - exp.w).toFixed(1)}`);
    if (dx > TOL || dy > TOL || dw > TOL || dh > TOL) {
      bad++;
      if (bad <= 3) rows.push(`   ${s.name.slice(0,26).padEnd(26)} ${node.name.slice(0,18).padEnd(18)} Δx${dx.toFixed(1)} Δy${dy.toFixed(1)} Δw${dw.toFixed(1)} Δh${dh.toFixed(1)}`);
    }
  }
  totalNodes += n; totalBad += bad;
  console.log(`${s.name.slice(0,42).padEnd(42)} ${String(n).padStart(4)} nodes  ${bad ? String(bad).padStart(3)+' off' : '  all exact'}${missing ? `  (${missing} unpainted)` : ''}`);
}
await b.close();
if (rows.length) { console.log('\nworst offsets:'); rows.forEach(r => console.log(r)); }
console.log(`\nTOTAL: ${totalNodes - totalBad}/${totalNodes} nodes within ${TOL}px of the design`);
console.log(`text boxes whose browser width differs from Figma's by >2px: ${textSizeDrift.length}`);
