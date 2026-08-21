/**
 * Inline the Vite build into ONE self-contained HTML file.
 * Artifacts run under a strict CSP that blocks every external host, so the
 * JS, CSS and all product photography have to travel inside the document.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const OUT = process.argv[2] ?? 'shop-together.html';

let html = readFileSync(join(DIST, 'index.html'), 'utf8');

// 1. product images -> data URIs, keyed by the public path the bundle references
const imgDir = join(DIST, 'products');
const dataUri = {};
for (const f of readdirSync(imgDir)) {
  const b64 = readFileSync(join(imgDir, f)).toString('base64');
  dataUri[`/products/${f}`] = `data:image/png;base64,${b64}`;
}

// 2. JS is left untouched; images travel in an injected asset map keyed by the
//    12-hex stem the app asks for, so nothing is fetched at runtime.
const jsFile = html.match(/src="\/assets\/([^"]+\.js)"/)[1];
const js = readFileSync(join(DIST, 'assets', jsFile), 'utf8');
const assetMap = Object.fromEntries(
  Object.entries(dataUri).map(([p, uri]) => [p.replace('/products/', '').replace('.png', ''), uri]));
const swapped = Object.keys(assetMap).length;

// 3. CSS, with the Everyday Sans faces inlined as data URIs
const cssFile = html.match(/href="\/assets\/([^"]+\.css)"/)?.[1];
let css = cssFile ? readFileSync(join(DIST, 'assets', cssFile), 'utf8') : '';
let fonts = 0;
for (const f of readdirSync(join(DIST, 'fonts'))) {
  const b64 = readFileSync(join(DIST, 'fonts', f)).toString('base64');
  const before = css;
  css = css.split(`/fonts/${f}`).join(`data:font/woff2;base64,${b64}`);
  if (css !== before) fonts++;
}

// 4. Artifacts wrap the file in their own <!doctype>/<head>/<body>, so emit
//    page content only — no <html>, <head> or <body> tags of our own.
const out = `<title>Shop Together</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
${css}
</style>
<div id="root"></div>
<script>window.__ASSETS = ${JSON.stringify(assetMap)};</script>
<script type="module">
${js}
</script>
`;

writeFileSync(OUT, out);
const mb = (Buffer.byteLength(out) / 1048576).toFixed(2);
console.log(`${OUT}  ${mb} MB   images: ${swapped}/${Object.keys(dataUri).length}   fonts: ${fonts}/3`);
if (Buffer.byteLength(out) > 16 * 1048576) console.error('OVER the 16 MB artifact limit');
if (/src="\/|href="\//.test(out)) console.error('WARNING: an absolute asset reference survived');
