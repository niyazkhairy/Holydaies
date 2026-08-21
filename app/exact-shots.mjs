import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const B = 'http://localhost:4173';
const design = JSON.parse(readFileSync('src/design/design.json', 'utf8'));

// one entry per screen, deduped by name (the file has a duplicate "05")
const seen = new Set();
const screens = design
  .filter(s => (seen.has(s.name) ? false : (seen.add(s.name), true)))
  .map(s => ({ id: s.id, name: s.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() }));

const b = await chromium.launch({ executablePath: EXE });
const errs = [];
const results = [];

for (const s of screens) {
  const p = await b.newPage({ viewport: { width: 478, height: 986 }, deviceScaleFactor: 2 });
  p.on('console', m => m.type() === 'error' && errs.push(`${s.name}: ${m.text()}`));
  p.on('pageerror', e => errs.push(`${s.name} PAGEERROR: ${e.message}`));
  p.on('requestfailed', r => errs.push(`${s.name} REQFAIL: ${r.url().slice(0, 70)}`));
  await p.goto(`${B}/#${s.id}`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(250);

  const info = await p.evaluate(() => ({
    everydayLoaded: document.fonts.check('400 15px "Everyday Sans"')
                 && document.fonts.check('500 15px "Everyday Sans"')
                 && document.fonts.check('700 15px "Everyday Sans"'),
    nodes: document.querySelectorAll('.device [style*="position: absolute"]').length,
    svgs: document.querySelectorAll('.device svg').length,
  }));
  results.push({ ...s, ...info });
  await p.locator('.device').screenshot({ path: `shots/exact-${s.name}.png` });
  await p.close();
}
await b.close();

console.log('screen                                        nodes  svg  font');
for (const r of results) {
  console.log(`${r.name.padEnd(44)} ${String(r.nodes).padStart(5)} ${String(r.svgs).padStart(4)}  ${r.everydayLoaded ? 'OK' : 'MISSING'}`);
}
console.log(errs.length ? '\nERRORS:\n' + [...new Set(errs)].join('\n') : '\nno errors / no failed requests');
