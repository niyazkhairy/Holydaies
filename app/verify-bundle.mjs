import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
// wrap exactly the way the artifact host does: our file is page content
const body = readFileSync('shop-together.html', 'utf8');
writeFileSync('/tmp/artifact-preview.html',
  `<!doctype html><html><head><meta charset="utf-8"></head><body>${body}</body></html>`);

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const errs = [];
const p = await b.newPage({ viewport: { width: 520, height: 1000 }, deviceScaleFactor: 2 });
p.on('console', m => m.type() === 'error' && errs.push(m.text()));
p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
p.on('requestfailed', r => errs.push('REQFAIL: ' + r.url().slice(0, 70)));

await p.goto('file:///tmp/artifact-preview.html', { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(500);

console.log('mounts              :', await p.locator('text=Create a list').first().isVisible());
console.log('everyday sans       :', await p.evaluate(() =>
  ['400','500','700'].every(w => document.fonts.check(`${w} 15px "Everyday Sans"`))));
console.log('inlined product art :', await p.evaluate(() =>
  [...document.images].filter(i => i.currentSrc.startsWith('data:')).length));
console.log('design vector icons :', await p.locator('svg').count());

// drive the real flow inside the bundle
await p.locator('text=Weekly Start').first().click();
await p.waitForTimeout(400);
console.log('list opens, rows    :', await p.locator('.itemrow').count());
await p.locator('button:has-text("Sort by")').click();
await p.locator('button:has-text("Department")').click();
await p.locator('button:has-text("View results")').click();
await p.waitForTimeout(300);
console.log('sticky aisle heads  :', await p.locator('.aisle-head').count());
await p.screenshot({ path: 'shots/bundle-desktop.png' });

console.log('body h-scroll       :', await p.evaluate(() =>
  document.documentElement.scrollWidth > document.documentElement.clientWidth));
await p.close();

const m = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
m.on('pageerror', e => errs.push('MOBILE: ' + e.message));
await m.goto('file:///tmp/artifact-preview.html', { waitUntil: 'networkidle' });
await m.waitForTimeout(400);
console.log('mobile h-scroll     :', await m.evaluate(() =>
  document.documentElement.scrollWidth > document.documentElement.clientWidth));
await m.close();
await b.close();
console.log(errs.length ? '\nERRORS:\n' + [...new Set(errs)].join('\n') : '\nno errors / no failed requests');
