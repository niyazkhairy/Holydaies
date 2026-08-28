import { chromium } from 'playwright';

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const B = process.env.BASE ?? 'http://localhost:4180';

const b = await chromium.launch({ executablePath: EXE });
const errs = [];
const checks = [];
const ok = (name, pass, extra = '') =>
  checks.push(`${pass ? 'PASS' : 'FAIL'}  ${name}${extra ? `  [${extra}]` : ''}`);

const page = async () => {
  const p = await b.newPage({ viewport: { width: 520, height: 1000 }, deviceScaleFactor: 2 });
  p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  p.on('requestfailed', r => errs.push('REQFAIL: ' + r.url().slice(0, 70)));
  return p;
};
const shot = (p, n) => p.locator('.device').screenshot({ path: `shots/v2-${n}.png` });

/* ---------- 1. crispness: the phone must not be fractionally scaled ---------- */
{
  const p = await page();
  await p.goto(`${B}/#/`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const t = await p.evaluate(() => {
    const d = document.querySelector('.device');
    const cs = getComputedStyle(d);
    return { transform: cs.transform, zoom: cs.zoom, width: d.getBoundingClientRect().width };
  });
  ok('device renders 1:1 (no fractional scale)',
     (t.transform === 'none' || t.transform === 'matrix(1, 0, 0, 1, 0, 0)') && Math.abs(t.width - 430) < 0.5,
     `transform=${t.transform} w=${t.width}`);
  ok('Everyday Sans loaded (all 3 weights)',
     await p.evaluate(() => ['400', '500', '700'].every(w => document.fonts.check(`${w} 15px "Everyday Sans"`))));
  await shot(p, '01-lists');
  await p.close();
}

/* ---------- 2. icons come from the design and are not clipped ---------- */
{
  const p = await page();
  await p.goto(`${B}/#/list/weekly`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const pin = await p.evaluate(() => {
    const svgs = [...document.querySelectorAll('svg')];
    const el = svgs.find(s => s.getAttribute('viewBox')?.startsWith('0 0 11.33'));
    if (!el) return null;
    const vb = el.getAttribute('viewBox').split(' ').map(Number);
    const bb = el.querySelector('path').getBBox();
    return { vb, bb: [bb.x, bb.y, bb.width, bb.height], overflow: getComputedStyle(el).overflow };
  });
  ok('location pin fits inside its viewBox (not cropped)',
     pin && pin.bb[0] >= -0.05 && pin.bb[1] >= -0.05
         && pin.bb[0] + pin.bb[2] <= pin.vb[2] + 0.05
         && pin.bb[1] + pin.bb[3] <= pin.vb[3] + 0.05,
     pin ? `path=${pin.bb.map(n => n.toFixed(2))} viewBox=${pin.vb[2]}x${pin.vb[3]}` : 'pin not found');

  /* ---------- 3. 17 items from the new asset file ---------- */
  const rows = await p.locator('.itemrow').count();
  ok('Weekly Start shows 15 items with 2 awaiting approval', rows === 15, String(rows));
  ok('small detail lines are kept', (await p.locator('.detail').count()) > 10,
     String(await p.locator('.detail').count()));
  // the design shows no flash tags on the list screen — only in the in-store list view
  ok('list screen carries no flash tags (matches the design)',
     (await p.locator('.flashtag').count()) === 0);
  await shot(p, '05-list');

  /* ---------- 4. sort actually sorts ---------- */
  const firstTitle = () => p.locator('.itemrow .title').first().innerText();
  const before = await firstTitle();
  await p.locator('button:has-text("Sort by")').click();
  await p.locator('button:has-text("Price high")').click();
  await p.locator('button:has-text("View results")').click();
  await p.waitForTimeout(280);
  const high = await firstTitle();
  const highPrice = await p.locator('.itemrow .price').first().innerText();
  ok('Sort · Price high puts the dearest item first', high !== before && highPrice === '$9.98',
     `${before.slice(0, 18)} -> ${high.slice(0, 18)} ${highPrice}`);

  await p.locator('button:has-text("Sort by")').click();
  await p.locator('button:has-text("Price low")').click();
  await p.locator('button:has-text("View results")').click();
  await p.waitForTimeout(280);
  // avocado ($0.98) sits in Yasamin's pending request, so bananas is the cheapest on-list
  ok('Sort · Price low puts the cheapest first',
     (await p.locator('.itemrow .price').first().innerText()) === '$1.97',
     await p.locator('.itemrow .price').first().innerText());

  /* ---------- 5. Department sort groups under sticky aisle headers ---------- */
  await p.locator('button:has-text("Sort by")').click();
  await p.locator('button:has-text("Department")').click();
  await p.locator('button:has-text("View results")').click();
  await p.waitForTimeout(300);
  const heads = await p.locator('.aisle-head').count();
  ok('Department sort groups into all 8 aisles', heads === 8, String(heads));
  ok('aisle headers are sticky',
     await p.evaluate(() => getComputedStyle(document.querySelector('.aisle-head')).position === 'sticky'));
  await shot(p, '05-department');
  await p.close();
}

/* ---------- 6. search over the 17 products ---------- */
{
  const p = await page();
  await p.goto(`${B}/#/list/beverage`, { waitUntil: 'networkidle' });
  await p.locator('button:has-text("Add an item to your list")').click();
  await p.locator('input').fill('coffee');
  await p.waitForTimeout(250);
  const hits = await p.locator('li button img').count();
  ok('typeahead finds catalogue items by keyword and title', hits > 0, `"coffee" -> ${hits}`);
  await shot(p, '04-search');
  const rowsBefore = await p.locator('.itemrow').count().catch(() => 0);
  await p.locator('li button').first().click();
  await p.waitForTimeout(300);
  const rowsAfter = await p.locator('.itemrow').count();
  ok('picking a result adds it to the list', rowsAfter > rowsBefore, `${rowsBefore} -> ${rowsAfter}`);
  await p.close();
}

/* ---------- 7. in-store: sticky aisles, sinking, End trip rises ---------- */
{
  const p = await page();
  await p.goto(`${B}/#/list/weekly/instore`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await shot(p, '11-instore');

  const prog = () => p.locator('text=/^\\d+ of \\d+$/').first().innerText();
  const endTripY = () => p.locator('button:has-text("End trip")').boundingBox().then(b => b.y);

  const before = await prog();
  const yBefore = await endTripY();
  const openBefore = await p.locator('.itemrow').count();

  for (let i = 0; i < 5; i++) {
    await p.locator('.itemrow button[aria-pressed="false"]').first().click();
    await p.waitForTimeout(120);
  }
  const after = await prog();
  const yAfter = await endTripY();
  const openAfter = await p.locator('.itemrow:has(button[aria-pressed="false"])').count();

  ok('checking items advances the counter', before !== after, `${before} -> ${after}`);
  ok('checked items leave the live list', openAfter === openBefore - 5, `${openBefore} -> ${openAfter}`);
  ok('End trip rises toward the user as items are picked', yAfter < yBefore,
     `y ${Math.round(yBefore)} -> ${Math.round(yAfter)}`);
  ok('picked items collect in "Items Picked"',
     (await p.locator('text=Items Picked').count()) > 0);
  await shot(p, '11-picked');

  // card view swaps the old Qty label for a flash-deal action on every row
  {
    // picked rows have moved to "Items Picked" and carry no tag, so count the live ones
    const rows = await p.locator('.itemrow:has(button[aria-pressed="false"])').count();
    const tags = await p.locator('.itemrow .flashtag').count();
    const qty = await p.locator('text=/Qty:/').count();
    ok('card view carries a flash tag on every live row and no Qty',
       rows > 0 && tags === rows && qty === 0, `${tags}/${rows} tags, ${qty} Qty`);
  }

  await p.locator('[aria-label="List view"]').click();
  await p.waitForTimeout(220);
  ok('layout toggle switches view', (await p.locator('.itemrow').first().boundingBox()).height < 90);
  await shot(p, '12-listview');

  /* ---------- 8. trip summary reflects what was picked ---------- */
  await p.locator('button:has-text("End trip")').click();
  await p.waitForTimeout(320);
  const items = await p.locator('text=Items').first().isVisible();
  ok('trip summary opens', items);

  // the per-shopper bars are computed from the checked items, so the counts
  // have to add up to the Items stat and the widths to a full 100%
  const bars = await p.evaluate(() => [...document.querySelectorAll('.scroll li')].map(li => {
    const s = li.querySelectorAll('span');
    return { units: parseInt(s[2].textContent, 10),
             width: parseFloat(li.querySelector('div > div').style.width) };
  }));
  const stat = await p.evaluate(() => {
    const el = [...document.querySelectorAll('div')]
      .find(d => d.children.length === 2 && d.children[0].textContent === 'Items');
    return el ? parseInt(el.children[1].textContent, 10) : NaN;
  });
  const sumUnits = bars.reduce((t, b) => t + b.units, 0);
  const sumWidth = bars.reduce((t, b) => t + b.width, 0);
  ok('summary bars are shared out from the checked items',
     bars.length === 3 && sumUnits === stat && Math.abs(sumWidth - 100) < 0.01,
     `${bars.map(b => b.units).join('+')}=${sumUnits} vs Items ${stat}, widths ${sumWidth.toFixed(1)}%`);

  await shot(p, '13-done');
  await p.close();
}

/* ---------- 8b. an untouched trip charts nothing ---------- */
{
  const p = await b.newPage({ viewport: { width: 470, height: 990 }, deviceScaleFactor: 2 });
  await p.goto(`${B}/#/list/weekly/done`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(250);
  const widths = await p.evaluate(() =>
    [...document.querySelectorAll('.scroll li div > div')].map(d => d.style.width));
  ok('nothing picked leaves every bar empty',
     widths.length === 3 && widths.every(w => w === '0%'), widths.join(' '));
  await p.close();
}

/* ---------- 9. no horizontal overflow ---------- */
{
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await p.goto(`${B}/#/list/weekly`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(300);
  ok('no horizontal scroll at phone width',
     !(await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)));
  await p.close();
}

await b.close();
console.log(checks.join('\n'));
console.log(errs.length ? '\nERRORS:\n' + [...new Set(errs)].join('\n') : '\nno console errors / no failed requests');
