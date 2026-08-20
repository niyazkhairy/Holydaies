/** Product catalogue transcribed from "Shop Toghether.fig".
 *  Titles, aisles and quantities come from the in-store screens (real vector text);
 *  every image is an asset lifted straight out of the .fig archive.
 *  Prices are tuned so Weekly Start totals $37.66 — the figure shown in the design. */
export type Product = {
  id: string;
  keyword: string;      // small grey label above the title
  title: string;
  price: number;
  aisle: string;
  img: string;
  addedBy?: string;
  flashTag?: boolean;
};

const P = (id: string, keyword: string, title: string, price: number, aisle: string, img: string,
           extra: Partial<Product> = {}): Product => ({ id, keyword, title, price, aisle, img, ...extra });

export const PRODUCTS: Product[] = [
  P('stok',        'coffee',        'SToK Espresso Dark Roast Black Unsweetened Cold Brew Coffee, 48 fl oz', 5.98, 'A12 · Coffee', '/products/1ffde61667f6.png'),
  P('stok-bold',   'coffee',        'SToK Bold & Smooth Black Cold Brew Coffee, 48 fl oz',                   5.98, 'A12 · Coffee', '/products/5fff35dc1903.png'),
  P('stok-unsweet','coffee',        'SToK Un-Sweet Black Cold Brew Coffee, 48 fl oz',                        5.98, 'A12 · Coffee', '/products/80e1792b3283.png'),
  P('stok-mellow', 'coffee',        'SToK Bright & Mellow Black Cold Brew Coffee, 48 fl oz',                 5.98, 'A12 · Coffee', '/products/c501134a11dc.png'),
  P('jif',         'peanut butter', 'Jif To Go Natural Creamy Peanut Butter Spread, 8 Cups, 1.1 oz Each',    3.98, 'A12 · Coffee', '/products/ae92c698ced6.png'),
  P('tropicana',   'orange juice',  'Tropicana Pure Premium No Pulp Original Orange Juice 89 Oz',            5.48, 'A35 · Dairy',  '/products/947d944c0e9e.png'),
  P('lactaid',     'milk',          'Lactaid Whole Milk, 96 oz',                                             6.98, 'A35 · Dairy',  '/products/bfa76c3b9197.png', { addedBy: 'Yasamin added, just now' }),
  P('califia',     'banana creamer','Califia Farms Organic Banana Creme Almond Milk Coffee Creamer 25.4 Fluid Ounces', 4.88, 'A35 · Dairy', '/products/06664d681971.png'),
  P('arrowhead',   'sparkling water','Arrowhead Sparkling Mountain Spring Water, Desert Bloom Lime Prickly Pear, 8 Pack', 4.88, 'A17 · Juice', '/products/c43c2b9c3fad.png', { flashTag: true }),
  P('bettergoods', 'sparkling water','bettergoods Lime Sparkling Water, 8 Pack, 12 fl oz Cans',              3.98, 'A17 · Juice',  '/products/b64c55bbeaf6.png', { flashTag: true }),
  P('water',       'water',         'Great Value Purified Drinking Water, 16.9 fl oz, 40 Count',             4.42, 'A17 · Juice',  '/products/93f612a4becf.png'),
];

/** Typeahead rows on "04 Search inside the list" — the four queries in the design,
 *  each pointing at the SToK variant whose photo the design shows beside it. */
export const SUGGESTIONS = [
  { q: 'stok cold brew',   productId: 'stok-bold' },
  { q: 'stok coffee',      productId: 'stok-unsweet' },
  { q: 'stok cappuccino',  productId: 'stok-mellow' },
  { q: 'stok coffee cold', productId: 'stok' },
];

/** Non-product artwork pulled from the .fig. */
export const ART = {
  sparky: '/products/777bb19ce223.png',   // the Ask Sparky bottom-nav face
  scanGo: '/products/4d54671e659c.png',   // Scan & Go badge
};

export type Permission = 'view' | 'check' | 'add';
export type Person = { id: string; name: string; initial: string; colour: string; permission: Permission; signedIn: boolean };

export const PERMISSION_LABEL: Record<Permission, string> = {
  view:  'Only view',
  check: 'Check items off',
  add:   'Add and check off',
};

export const PEOPLE: Person[] = [
  { id: 'you',     name: 'You',     initial: 'N', colour: 'var(--avatar-n)', permission: 'add',  signedIn: true },
  { id: 'yasamin', name: 'Yasamin', initial: 'Y', colour: 'var(--avatar-y)', permission: 'add',  signedIn: true },
  { id: 'visitor', name: 'Visitor', initial: 'V', colour: 'var(--muted)',    permission: 'view', signedIn: false },
];

export const SHARE_LINK = 'walmart.com/s/wk8f2a';

/** The design shows -$12.45 against a $37.66 estimate. */
export const SAVINGS_RATE = 12.45 / 37.66;
