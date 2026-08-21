import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
// mimic the artifact wrapper: our file is page content, not a full document
const body = readFileSync('shop-together.html', 'utf8');
writeFileSync('/tmp/artifact-preview.html', `<!doctype html><html><head><meta charset="utf-8"></head><body>${body}</body></html>`);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const errs = [];
const p = await b.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
p.on('console', m => m.type() === 'error' && errs.push(m.text()));
p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
p.on('requestfailed', r => errs.push('REQFAIL: ' + r.url().slice(0, 60)));
await p.goto('file:///tmp/artifact-preview.html', { waitUntil: 'networkidle' });
await p.waitForTimeout(600);
console.log('nodes rendered   :', await p.locator('[data-id]').count());
console.log('text present     :', await p.locator('text=Create a list').first().isVisible());
console.log('everyday sans    :', await p.evaluate(() => document.fonts.check('700 15px "Everyday Sans"')));
console.log('inlined imagery  :', await p.evaluate(() =>
  [...document.querySelectorAll('[data-id]')].filter(e => getComputedStyle(e).backgroundImage.startsWith('url("data:')).length));
console.log('body h-scroll    :', await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth));
await p.screenshot({ path: 'shots/artifact-desktop.png' });
// interact, to prove state works inside the single file
// navigate via a real hotspot to prove interaction survives bundling
const before = await p.locator('[data-id]').count();
await p.locator('[aria-label="Open Weekly Start"]').click();
await p.waitForTimeout(400);
console.log('navigated        :', (await p.locator('[data-id]').count()) !== before || location.hash !== '');
// narrow viewport
const m = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
m.on('pageerror', e => errs.push('MOBILE PAGEERROR: ' + e.message));
await m.goto('file:///tmp/artifact-preview.html', { waitUntil: 'networkidle' });
await m.waitForTimeout(500);
console.log('mobile h-scroll  :', await m.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth));
await m.screenshot({ path: 'shots/artifact-mobile.png' });
await b.close();
console.log(errs.length ? 'ERRORS:\n' + [...new Set(errs)].join('\n') : 'no errors / no failed requests');
