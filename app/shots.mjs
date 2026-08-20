import { chromium } from 'playwright';

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const B = 'http://localhost:4173';
const b = await chromium.launch({ executablePath: EXE });
const errs = [];

const page = async () => {
  const p = await b.newPage({ viewport: { width: 478, height: 986 }, deviceScaleFactor: 2 });
  p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  return p;
};
const shot = (p, n) => p.locator('.device').screenshot({ path: `shots/${n}.png` });

const simple = [
  ['01-lists',    '/#/',                    null],
  ['02-create',   '/#/',                    'button:has-text("Create a list")'],
  ['05-list',     '/#/list/weekly',         null],
  ['06-sort',     '/#/list/weekly',         'button:has-text("Sort by")'],
  ['07-share',    '/#/list/weekly',         '[aria-label="Share"]'],
  ['08-settings', '/#/list/weekly',         '[aria-label="List settings"]'],
  ['11-instore',  '/#/list/weekly/instore', null],
  ['13-done',     '/#/list/weekly/done',    null],
];
for (const [n, url, click] of simple) {
  const p = await page();
  await p.goto(B + url, { waitUntil: 'networkidle' });
  if (click) { await p.locator(click).first().click(); await p.waitForTimeout(430); }
  await p.waitForTimeout(220);
  await shot(p, n);
  await p.close();
}

// 09 Share list -> 10 Permission
{
  const p = await page();
  await p.goto(B + '/#/list/weekly', { waitUntil: 'networkidle' });
  await p.locator('[aria-label="Share"]').click();
  await p.locator('button:has-text("Shop together")').click();
  await p.waitForTimeout(400); await shot(p, '09-sharelist');
  await p.locator('button:has-text("Yasamin")').click();
  await p.waitForTimeout(400); await shot(p, '10-permission');
  await p.close();
}

// 03 empty state + 04 search, reached through the real create-a-list flow
{
  const p = await page();
  await p.goto(B + '/#/', { waitUntil: 'networkidle' });
  await p.locator('button:has-text("Create a list")').click();
  await p.locator('input').fill('Weekly Start');
  await p.locator('button:has-text("Create")').last().click();
  await p.waitForTimeout(450); await shot(p, '03-empty');
  await p.locator('button:has-text("Add an item to your list")').click();
  await p.locator('input').fill('stok c');
  await p.waitForTimeout(300); await shot(p, '04-search');
  await p.close();
}

/* ------------------- behaviour smoke test ------------------- */
const check = [];
const assert = (name, ok, extra = '') =>
  check.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  [' + extra + ']' : ''}`);

{
  const p = await page();
  await p.goto(B + '/#/list/weekly', { waitUntil: 'networkidle' });

  const est = await p.locator('[data-testid=est-total]').innerText();
  assert('estimate matches the design ($37.66)', est === '$37.66', est);
  const save = await p.locator('.savings').first().innerText();
  assert('savings matches the design (-$12.45)', save === '-$12.45', save);

  const badge = async () => (await p.locator('.appbar span[style*="--wm-spark"]').first().innerText()).trim();
  const before = await badge();
  await p.locator('button:has-text("Add to cart")').first().click();
  await p.waitForTimeout(180);
  const after = await badge();
  assert('Add to cart increments the badge', after !== before, `${before} -> ${after}`);

  await p.locator('button:has-text("Add all to cart")').click();
  await p.waitForTimeout(180);
  const all = await badge();
  assert('Add all to cart adds every unit', Number(all) >= 7, all);

  const rows = () => p.locator('li:has(button:has-text("Add to cart"))').count();
  const n0 = await rows();
  await p.locator('button:has-text("Remove")').first().click();
  await p.waitForTimeout(180);
  const n1 = await rows();
  assert('Remove deletes the row', n1 === n0 - 1, `${n0} -> ${n1}`);

  const firstTitle = async () =>
    (await p.locator('li:has(button:has-text("Add to cart"))').first().innerText()).slice(0, 26).replace(/\n/g, ' ');
  const a = await firstTitle();
  await p.locator('button:has-text("Sort by")').click();
  await p.locator('button:has-text("Price high")').click();
  await p.locator('button:has-text("View results")').click();
  await p.waitForTimeout(300);
  const c = await firstTitle();
  assert('Sort by actually reorders', a !== c, `${a} -> ${c}`);
  await p.close();
}
{
  const p = await page();
  await p.goto(B + '/#/list/weekly/instore', { waitUntil: 'networkidle' });
  const prog = async () => (await p.locator('text=/^\\d+ of \\d+$/').first().innerText()).trim();
  const p0 = await prog();
  await p.locator('[aria-label="Check item off"]').first().click();
  await p.waitForTimeout(250);
  const p1 = await prog();
  assert('checking an item advances the picked counter', p0 !== p1, `${p0} -> ${p1}`);

  await p.locator('[aria-label="List view"]').click();
  await p.waitForTimeout(250);
  assert('layout toggle switches to list view',
         await p.locator('u:has-text("Flash tag")').first().isVisible());
  await p.close();
}

await b.close();
console.log(check.join('\n'));
console.log(errs.length ? '\nCONSOLE ERRORS:\n' + [...new Set(errs)].join('\n') : '\nno console errors');
