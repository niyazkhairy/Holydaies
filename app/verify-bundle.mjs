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
console.log('lists rendered   :', await p.locator('button:has-text("Create a list")').isVisible());
console.log('product img shown:', await p.locator('img[src^="data:image/png"]').first().isVisible());
console.log('body h-scroll    :', await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth));
await p.screenshot({ path: 'shots/artifact-desktop.png' });
// interact, to prove state works inside the single file
await p.locator('button:has-text("Weekly Start")').first().click().catch(() => {});
await p.locator('.device').click({ position: { x: 215, y: 700 } }).catch(() => {});
await p.waitForTimeout(400);
// narrow viewport
const m = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
m.on('pageerror', e => errs.push('MOBILE PAGEERROR: ' + e.message));
await m.goto('file:///tmp/artifact-preview.html', { waitUntil: 'networkidle' });
await m.waitForTimeout(500);
console.log('mobile h-scroll  :', await m.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth));
await m.screenshot({ path: 'shots/artifact-mobile.png' });
await b.close();
console.log(errs.length ? 'ERRORS:\n' + [...new Set(errs)].join('\n') : 'no errors / no failed requests');
