import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';
import { PRODUCTS, PEOPLE, SAVINGS_RATE, type Permission, type Product } from './data/catalog';

export type LineItem = { productId: string; qty: number; checked: boolean; addedBy?: string };
export type List = {
  id: string; name: string; items: LineItem[];
  createdAt: string; orders: number; spent: number;
  favourite?: boolean; waitingOnYou?: boolean; subtitle?: string;
};
export type SortKey = 'recent' | 'department' | 'low' | 'high';

export type State = {
  lists: List[];
  activeListId: string | null;
  cartCount: number;
  cartTotal: number;
  sort: SortKey;
  people: typeof PEOPLE;
  instoreLayout: 'card' | 'list';
  tripStarted: boolean;
};

const line = (productId: string, qty = 1, addedBy?: string): LineItem =>
  ({ productId, qty, checked: false, addedBy });

const initial: State = {
  lists: [
    { id: 'weekly', name: 'Weekly Start', createdAt: 'March 2024', orders: 14, spent: 412,
      waitingOnYou: true, subtitle: 'Yasamin is waiting on you!',
      items: [line('stok'), line('jif'), line('tropicana', 2), line('lactaid', 1, 'Yasamin added, just now'),
              line('califia'), line('arrowhead')] },
    { id: 'beverage', name: 'Beverage', createdAt: 'January 2024', orders: 6, spent: 128,
      subtitle: 'Delivery as soon as 6am',
      items: [line('stok-bold'), line('arrowhead'), line('bettergoods'), line('water')] },
    { id: 'niyaz', name: "Niyaz's List", createdAt: 'June 2023', orders: 21, spent: 640,
      favourite: true, subtitle: 'Favorites - 3 items',
      items: [line('lactaid'), line('jif'), line('stok-mellow')] },
  ],
  activeListId: 'weekly',
  cartCount: 0,
  cartTotal: 0,
  sort: 'recent',
  people: PEOPLE,
  instoreLayout: 'card',
  tripStarted: false,
};

type Action =
  | { t: 'createList'; name: string }
  | { t: 'openList'; id: string }
  | { t: 'addItem'; listId: string; productId: string }
  | { t: 'removeItem'; listId: string; productId: string }
  | { t: 'setQty'; listId: string; productId: string; qty: number }
  | { t: 'toggleCheck'; listId: string; productId: string }
  | { t: 'addToCart'; productId: string }
  | { t: 'addAllToCart'; listId: string }
  | { t: 'setSort'; sort: SortKey }
  | { t: 'setPermission'; personId: string; permission: Permission }
  | { t: 'removePerson'; personId: string }
  | { t: 'regenerateLink' }
  | { t: 'renameList'; listId: string; name: string }
  | { t: 'deleteList'; listId: string }
  | { t: 'setLayout'; layout: 'card' | 'list' }
  | { t: 'endTrip' };

const price = (id: string) => PRODUCTS.find(p => p.id === id)?.price ?? 0;

function mapList(s: State, id: string, fn: (l: List) => List): State {
  return { ...s, lists: s.lists.map(l => (l.id === id ? fn(l) : l)) };
}

function reducer(s: State, a: Action): State {
  switch (a.t) {
    case 'createList': {
      const id = 'l' + Date.now();
      return { ...s, activeListId: id,
        lists: [{ id, name: a.name || 'Untitled list', items: [], createdAt: 'Today', orders: 0, spent: 0 }, ...s.lists] };
    }
    case 'openList': return { ...s, activeListId: a.id, tripStarted: false };
    case 'addItem':
      return mapList(s, a.listId, l =>
        l.items.some(i => i.productId === a.productId)
          ? { ...l, items: l.items.map(i => i.productId === a.productId ? { ...i, qty: i.qty + 1 } : i) }
          : { ...l, items: [line(a.productId), ...l.items] });
    case 'removeItem':
      return mapList(s, a.listId, l => ({ ...l, items: l.items.filter(i => i.productId !== a.productId) }));
    case 'setQty':
      return mapList(s, a.listId, l => ({ ...l,
        items: l.items.map(i => i.productId === a.productId ? { ...i, qty: Math.max(1, a.qty) } : i) }));
    case 'toggleCheck':
      return mapList(s, a.listId, l => ({ ...l,
        items: l.items.map(i => i.productId === a.productId ? { ...i, checked: !i.checked } : i) }));
    case 'addToCart':
      return { ...s, cartCount: s.cartCount + 1, cartTotal: +(s.cartTotal + price(a.productId)).toFixed(2) };
    case 'addAllToCart': {
      const l = s.lists.find(x => x.id === a.listId); if (!l) return s;
      const n = l.items.reduce((t, i) => t + i.qty, 0);
      const v = l.items.reduce((t, i) => t + i.qty * price(i.productId), 0);
      return { ...s, cartCount: s.cartCount + n, cartTotal: +(s.cartTotal + v).toFixed(2) };
    }
    case 'setSort': return { ...s, sort: a.sort };
    case 'setPermission':
      return { ...s, people: s.people.map(p => p.id === a.personId ? { ...p, permission: a.permission } : p) };
    case 'removePerson': return { ...s, people: s.people.filter(p => p.id !== a.personId) };
    case 'regenerateLink': return { ...s };
    case 'renameList': return mapList(s, a.listId, l => ({ ...l, name: a.name }));
    case 'deleteList': {
      const lists = s.lists.filter(l => l.id !== a.listId);
      return { ...s, lists, activeListId: lists[0]?.id ?? null };
    }
    case 'setLayout': return { ...s, instoreLayout: a.layout };
    case 'endTrip': return { ...s, tripStarted: false };
    default: return s;
  }
}

const Ctx = createContext<{ s: State; d: React.Dispatch<Action> } | null>(null);

export function Store({ children }: { children: ReactNode }) {
  const [s, d] = useReducer(reducer, initial);
  const v = useMemo(() => ({ s, d }), [s]);
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useStore outside Store');
  return c;
}

/* ---------- derived helpers ---------- */
export const product = (id: string): Product =>
  PRODUCTS.find(p => p.id === id) ?? PRODUCTS[0];

export function listTotals(l: List) {
  const est = l.items.reduce((t, i) => t + i.qty * price(i.productId), 0);
  const savings = est * SAVINGS_RATE;        // the design shows -$12.45 against $37.66
  return { est: +est.toFixed(2), savings: +savings.toFixed(2), count: l.items.length };
}

export function sortItems(items: LineItem[], sort: SortKey): LineItem[] {
  const a = [...items];
  if (sort === 'low')        a.sort((x, y) => price(x.productId) - price(y.productId));
  else if (sort === 'high')  a.sort((x, y) => price(y.productId) - price(x.productId));
  else if (sort === 'department')
    a.sort((x, y) => product(x.productId).aisle.localeCompare(product(y.productId).aisle));
  return a;
}

/** Group by aisle for the in-store screens. */
export function byAisle(items: LineItem[]) {
  const g = new Map<string, LineItem[]>();
  for (const i of items) {
    const k = product(i.productId).aisle;
    g.set(k, [...(g.get(k) ?? []), i]);
  }
  return [...g.entries()];
}
