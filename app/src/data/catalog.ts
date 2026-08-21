/**
 * Catalogue transcribed from "Shop Toghether list assets.fig".
 *
 * Every title, keyword, quantity and photograph is lifted from that file —
 * 17 products, each matched to its image by hash. Aisles follow the eight
 * categories the design defines; the "N items" count on each header is
 * computed at runtime so it always reflects what is actually on the list.
 */
export type Product = {
  id: string;
  keyword: string;        // the small grey label above the title
  title: string;
  price: number;
  aisle: string;
  img: string;
  flashTag?: boolean;
  addedBy?: string;
  detail?: string;        // the small secondary line, e.g. "Flavor: Zero Ultra"
};

const p = (
  id: string, keyword: string, title: string, price: number,
  aisle: string, img: string, extra: Partial<Product> = {},
): Product => ({ id, keyword, title, price, aisle, img: `/products/${img}.png`, ...extra });

export const PRODUCTS: Product[] = [
  // A34 · Dairy
  p('milk', 'milk', 'Lactaid Whole Milk, 96 oz', 6.98, 'A34 · Dairy', 'bfa76c3b9197',
    { addedBy: 'Yasamin added, just now', detail: 'Whole · 96 fl oz' }),
  p('creamer-banana', 'pistachio creamer', 'Califia Farms Organic Banana Creme Almond Milk Coffee Creamer 25.4 Fluid Ounces',
    5.48, 'A34 · Dairy', '06664d681971', { detail: 'Flavor: Banana Creme · 25.4 fl oz' }),
  p('creamer-vanilla', 'creamer', 'Califia Farms Organic Vanilla Almond Milk Coffee Creamer 25.4 Fluid Ounces',
    5.48, 'A34 · Dairy', '7e56a218b161', { flashTag: true, detail: 'Flavor: Vanilla · 25.4 fl oz' }),

  // A12 · Coffee
  p('folgers', 'coffee', 'Folgers Black Silk Ground Coffee, Dark Roast, 22.6 oz Canister',
    9.98, 'A12 · Coffee', '11ac34c557c0', { detail: 'Roast: Dark · 22.6 oz' }),
  p('jif', 'peanut butter', 'Jif To Go Natural Creamy Peanut Butter Spread, 8 Cups, 1.1 oz Each',
    4.97, 'A12 · Coffee', 'ae92c698ced6', { detail: 'Creamy · 8 cups' }),

  // A17 · Juice
  p('tropicana', 'orange juice', 'Tropicana Pure Premium No Pulp Original Orange Juice 89 Oz',
    7.24, 'A17 · Juice', '947d944c0e9e', { detail: 'No Pulp · 89 fl oz' }),
  p('apple-juice', 'apple juice', 'Great Value 100% Apple Juice, 96 fl oz',
    4.42, 'A17 · Juice', 'd843123b926c', { detail: '100% juice · 96 fl oz' }),
  p('grape-juice', 'grape juice', "Welch's 100% Grape Juice, Concord Grape, 64 fl oz Bottle",
    5.68, 'A17 · Juice', '108f4a994ceb', { flashTag: true, detail: 'Concord Grape · 64 fl oz' }),

  // A27 · Soft Drink
  p('nos', 'nas sugar free', 'NOS Original, Energy Drink 16 fl oz', 2.28, 'A27 · Soft Drink', '2338876e7788',
    { detail: 'Flavor: Original · Total Count: 1' }),
  p('redbull', 'sugerfeee redbull', 'Red Bull Sugarfree Energy Drink, 8.4 fl. oz. Can, 80mg Caffeine, Taurine & B Vitamins',
    2.68, 'A27 · Soft Drink', 'dff45ebef6f8', { flashTag: true, detail: 'Sugarfree · 8.4 fl oz' }),

  // A32 · Frozen
  p('waffles', 'waffles', 'Great Value Buttermilk Waffles, 29.6 oz, 24 Count (Frozen)',
    3.12, 'A32 · Frozen', 'de01e62a2aa5', { detail: 'Frozen · 24 count' }),

  // A15 · Chips
  p('chips', 'chips', "Lay's Chile Limón Flavored Potato Chips, 7.75 Oz.", 4.98, 'A15 · Chips', '8f1adcd171ee',
    { detail: 'Flavor: Chile Limón · 7.75 oz' }),

  // A9 · Dry Fruit
  p('almonds', 'almonds', 'Blue Diamond Almonds, Lightly Salted Low Sodium Snack Nuts For Gluten Free Snacking, 14 oz',
    7.86, 'A9 · Dry Fruit', 'b2f32068cd20', { detail: 'Lightly Salted · 14 oz' }),

  // B6 · Dry Fresh & Bakery
  p('croissants', 'crossant - rolls', 'Marketside All Butter Whole Baked Croissants, 9.5 oz, 6 Count',
    4.28, 'B6 · Dry Fresh & Bakery', '3a696cfbcd94', { detail: 'All butter · 6 count' }),
  p('donuts', 'donuts', 'Freshness Guaranteed Regular Assorted Ring Donuts, 12 oz, 12 Count',
    4.62, 'B6 · Dry Fresh & Bakery', 'a13c5eda2209', { detail: 'Assorted · 12 count' }),
  p('avocado', 'avocado', 'Fresh Hass Avocados, Each', 0.98, 'B6 · Dry Fresh & Bakery', 'caa9ef4c0eb3',
    { detail: 'Sold each' }),
  p('bananas', 'bananas', 'Marketside Fresh Organic Bananas, Bunch', 1.97, 'B6 · Dry Fresh & Bakery', '8e39919d9e6c',
    { flashTag: true, detail: 'Organic · bunch' }),
];

/** Aisle order as laid out in the design. */
export const AISLE_ORDER = [
  'A34 · Dairy', 'A32 · Frozen', 'A27 · Soft Drink', 'A17 · Juice',
  'A15 · Chips', 'A12 · Coffee', 'A9 · Dry Fruit', 'B6 · Dry Fresh & Bakery',
];

export const byId = (id: string) => PRODUCTS.find(x => x.id === id) ?? PRODUCTS[0];

/** Free-text search over keyword + title, used by the add-an-item typeahead. */
export function searchProducts(q: string, exclude: string[] = []): Product[] {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  const hit = (s: string) => s.toLowerCase().includes(t);
  return PRODUCTS
    .filter(x => !exclude.includes(x.id) && (hit(x.keyword) || hit(x.title)))
    .sort((a, b) => Number(hit(b.keyword)) - Number(hit(a.keyword)))
    .slice(0, 6);
}

export type Permission = 'view' | 'check' | 'add';
export type Person = { id: string; name: string; initial: string; colour: string; permission: Permission; signedIn: boolean };

export const PERMISSION_LABEL: Record<Permission, string> = {
  view: 'Only view', check: 'Check items off', add: 'Add and check off',
};

export const PEOPLE: Person[] = [
  { id: 'you', name: 'You', initial: 'N', colour: 'var(--avatar-n)', permission: 'add', signedIn: true },
  { id: 'yasamin', name: 'Yasamin', initial: 'Y', colour: 'var(--avatar-y)', permission: 'add', signedIn: true },
  { id: 'farkhonda', name: 'Farkhonda', initial: 'F', colour: 'var(--avatar-f)', permission: 'check', signedIn: true },
  { id: 'visitor', name: 'Visitor', initial: 'V', colour: 'var(--muted)', permission: 'view', signedIn: false },
];

export const SHARE_LINK = 'walmart.com/s/wk8f2a';
export const ART = { sparky: '/products/777bb19ce223.png' };

/** The design prints -$12.45 against a $37.66 estimate. */
export const SAVINGS_RATE = 12.45 / 37.66;
