import { chromium } from 'playwright';
const B = 'http://localhost:4182';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const errs = [], out = [];
const ok = (n,p,x='') => out.push(`${p?'PASS':'FAIL'}  ${n}${x?`  [${x}]`:''}`);
const page = async (w,h) => {
  const p = await b.newPage({ viewport:{width:w,height:h}, deviceScaleFactor:2 });
  p.on('console', m => m.type()==='error' && errs.push(m.text()));
  p.on('pageerror', e => errs.push('PAGEERROR: '+e.message));
  p.on('requestfailed', r => errs.push('REQFAIL: '+r.url().slice(0,60)));
  return p;
};

// 1 · fits the screen at several window sizes, never scrolls
for (const [w,h] of [[1280,900],[1440,780],[900,1000],[520,1000],[390,844]]) {
  const p = await page(w,h);
  await p.goto(`${B}/#/`, { waitUntil:'networkidle' });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(250);
  const r = await p.evaluate(() => ({
    scrollY: document.documentElement.scrollHeight > document.documentElement.clientHeight,
    scrollX: document.documentElement.scrollWidth  > document.documentElement.clientWidth,
    dev: document.querySelector('.device').getBoundingClientRect(),
    vh: window.innerHeight,
  }));
  ok(`fits at ${w}x${h} (no scroll, whole phone visible)`,
     !r.scrollY && !r.scrollX && r.dev.bottom <= r.vh + 1 && r.dev.top >= -1,
     `bottom=${Math.round(r.dev.bottom)} vh=${r.vh}`);
  if (w === 1280) await p.locator('.fit').screenshot({ path:'shots/v4-fit.png' });
  await p.close();
}

{ const p = await page(1280,900);
  await p.goto(`${B}/#/`, { waitUntil:'networkidle' });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(250);

  // 2 · sparky is the transparent original
  const sp = await p.evaluate(() => {
    const i = [...document.querySelectorAll('.tabbar img')][0];
    return { src: i?.currentSrc?.slice(0,40), w: i?.naturalWidth, h: i?.naturalHeight };
  });
  ok('Ask Sparky uses the transparent original (300x300)', sp.w === 300 && sp.h === 300,
     `${sp.w}x${sp.h}`);

  // 3 · search input states
  const st = await p.evaluate(() => {
    const inp = document.querySelector('.searchinput');
    const ph = getComputedStyle(inp, '::placeholder').color;
    inp.focus();
    const focusRing = getComputedStyle(document.querySelector('.searchfield')).boxShadow;
    return { type: inp.type, ph, focusRing, ac: inp.autocomplete, label: inp.getAttribute('aria-label') };
  });
  ok('search is a real search input with a label', st.type === 'search' && !!st.label, st.type);
  ok('placeholder is muted, not full ink', st.ph !== 'rgb(0, 0, 0)', st.ph);
  ok('focus is visible on the field', st.focusRing !== 'none', st.focusRing.slice(0,34));
  await p.locator('.searchinput').fill('milk');
  await p.waitForTimeout(150);
  ok('a clear button appears once there is text',
     await p.locator('[aria-label="Clear search"]').isVisible());
  await p.locator('[aria-label="Clear search"]').click();
  await p.waitForTimeout(120);
  ok('clear empties the field', (await p.locator('.searchinput').inputValue()) === '');

  // 5 · card subtitle one step up the ramp
  const sub = await p.evaluate(() => {
    const el = [...document.querySelectorAll('.card span')].find(s => /waiting on you/.test(s.textContent));
    return el ? getComputedStyle(el).fontSize : null;
  });
  ok('card subtitle stepped up 9 -> 11px', sub === '11px', String(sub));
  await p.locator('.device').screenshot({ path:'shots/v4-lists.png' });
  await p.close(); }

{ // 4 · list view: roomier rows + flash tag on every row
  const p = await page(1280,900);
  await p.goto(`${B}/#/list/weekly/instore`, { waitUntil:'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const cardH = (await p.locator('.itemrow').first().boundingBox()).height;
  await p.locator('[aria-label="List view"]').click();
  await p.waitForTimeout(300);
  const rows = await p.locator('.itemrow.compact').count();
  const flash = await p.locator('.flashtag').count();
  const pad = await p.evaluate(() => getComputedStyle(document.querySelector('.itemrow.compact')).padding);
  ok('list rows have more top/bottom room', pad.startsWith('20px'), pad);
  ok('flash tag on every list-view row', rows > 0 && flash === rows, `${flash}/${rows}`);
  ok('card view rows unchanged', cardH > 60, `${Math.round(cardH)}px`);
  await p.locator('.device').screenshot({ path:'shots/v4-listview.png' });
  await p.close(); }

await b.close();
console.log(out.join('\n'));
console.log(errs.length ? '\nERRORS:\n'+[...new Set(errs)].join('\n') : '\nno console errors');
