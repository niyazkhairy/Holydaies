import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';
import {
  PRODUCTS, PEOPLE, AISLE_ORDER, SAVINGS_RATE, byId, type Permission, type Product,
} from './data/catalog';

export type LineItem = { productId: string; qty: number; checked: boolean; addedBy?: string };
export type List = {
  id: string; name: string; items: LineItem[];
  createdAt: string; orders: number; spent: number;
  favourite?: boolean; subtitle?: string;
  /** Items a collaborator added that still need your approval. */
  pendingFrom?: string;
  pendingItems?: string[];
};
export type SortKey = 'recent' | 'department' | 'low' | 'high';

export type State = {
  lists: List[];
  cartCount: number;
  cartTotal: number;
  sort: SortKey;
  people: typeof PEOPLE;
  instoreLayout: 'card' | 'list';
};

const line = (productId: string, qty = 1, addedBy?: string): LineItem =>
  ({ productId, qty, checked: false, addedBy });

/** Weekly Start carries the full 17-item catalogue across all eight aisles. */
const PENDING = ['donuts', 'avocado'];

/** Weekly Start holds two of Yasamin's additions back until you approve them. */
const weeklyItems: LineItem[] = PRODUCTS
  .filter(pr => !PENDING.includes(pr.id))
  .map(pr => line(pr.id, pr.id === 'nos' ? 2 : 1, pr.addedBy));

const initial: State = {
  lists: [
    {
      id: 'weekly', name: 'Weekly Start', createdAt: 'March 2024', orders: 14, spent: 412,
      subtitle: 'Yasamin is waiting on you!', items: weeklyItems,
      pendingFrom: 'Yasamin', pendingItems: PENDING,
    },
    {
      id: 'beverage', name: 'Beverage', createdAt: 'January 2024', orders: 6, spent: 128,
      subtitle: 'Delivery as soon as 6am',
      items: [line('nos', 2), line('redbull'), line('tropicana'), line('grape-juice'), line('apple-juice')],
    },
    {
      id: 'niyaz', name: "Niyaz's List", createdAt: 'June 2023', orders: 21, spent: 640,
      favourite: true, subtitle: 'Favorites - 3 items',
      items: [line('croissants'), line('donuts'), line('bananas')],
    },
  ],
  cartCount: 0,
  cartTotal: 0,
  sort: 'recent',
  people: PEOPLE,
  instoreLayout: 'card',
};

type Action =
  | { t: 'createList'; id: string; name: string }
  | { t: 'addItem'; listId: string; productId: string }
  | { t: 'removeItem'; listId: string; productId: string }
  | { t: 'setQty'; listId: string; productId: string; qty: number }
  | { t: 'toggleCheck'; listId: string; productId: string }
  | { t: 'addToCart'; productId: string; qty?: number }
  | { t: 'addAllToCart'; listId: string }
  | { t: 'setSort'; sort: SortKey }
  | { t: 'setPermission'; personId: string; permission: Permission }
  | { t: 'removePerson'; personId: string }
  | { t: 'renameList'; listId: string; name: string }
  | { t: 'deleteList'; listId: string }
  | { t: 'setLayout'; layout: 'card' | 'list' }
  | { t: 'resetTrip'; listId: string }
  | { t: 'approveRequest'; listId: string }
  | { t: 'declineRequest'; listId: string };

const price = (id: string) => byId(id).price;

const mapList = (s: State, id: string, fn: (l: List) => List): State =>
  ({ ...s, lists: s.lists.map(l => (l.id === id ? fn(l) : l)) });

function reducer(s: State, a: Action): State {
  switch (a.t) {
    case 'createList':
      return { ...s, lists: [{ id: a.id, name: a.name, items: [], createdAt: 'Today', orders: 0, spent: 0 }, ...s.lists] };
    case 'addItem':
      return mapList(s, a.listId, l =>
        l.items.some(i => i.productId === a.productId)
          ? { ...l, items: l.items.map(i => i.productId === a.productId ? { ...i, qty: i.qty + 1 } : i) }
          : { ...l, items: [line(a.productId), ...l.items] });
    case 'removeItem':
      return mapList(s, a.listId, l => ({ ...l, items: l.items.filter(i => i.productId !== a.productId) }));
    case 'setQty':
      return mapList(s, a.listId, l => ({ ...l, items: l.items.map(i =>
        i.productId === a.productId ? { ...i, qty: Math.max(1, a.qty) } : i) }));
    case 'toggleCheck':
      return mapList(s, a.listId, l => ({ ...l, items: l.items.map(i =>
        i.productId === a.productId ? { ...i, checked: !i.checked } : i) }));
    case 'addToCart':
      return { ...s, cartCount: s.cartCount + (a.qty ?? 1),
               cartTotal: +(s.cartTotal + price(a.productId) * (a.qty ?? 1)).toFixed(2) };
    case 'addAllToCart': {
      const l = s.lists.find(x => x.id === a.listId);
      if (!l) return s;
      const units = l.items.reduce((t, i) => t + i.qty, 0);
      const value = l.items.reduce((t, i) => t + i.qty * price(i.productId), 0);
      return { ...s, cartCount: s.cartCount + units, cartTotal: +(s.cartTotal + value).toFixed(2) };
    }
    case 'setSort': return { ...s, sort: a.sort };
    case 'setPermission':
      return { ...s, people: s.people.map(p => p.id === a.personId ? { ...p, permission: a.permission } : p) };
    case 'removePerson': return { ...s, people: s.people.filter(p => p.id !== a.personId) };
    case 'renameList': return mapList(s, a.listId, l => ({ ...l, name: a.name }));
    case 'deleteList': return { ...s, lists: s.lists.filter(l => l.id !== a.listId) };
    case 'setLayout': return { ...s, instoreLayout: a.layout };
    case 'resetTrip':
      return mapList(s, a.listId, l => ({ ...l, items: l.items.map(i => ({ ...i, checked: false })) }));
    case 'approveRequest':
      return mapList(s, a.listId, l => ({
        ...l,
        items: [...(l.pendingItems ?? []).map(id => line(id, 1, `${l.pendingFrom} added, just now`)), ...l.items],
        pendingFrom: undefined, pendingItems: undefined, subtitle: 'Delivery as soon as 6am',
      }));
    case 'declineRequest':
      return mapList(s, a.listId, l => ({
        ...l, pendingFrom: undefined, pendingItems: undefined, subtitle: 'Delivery as soon as 6am',
      }));
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
  if (!c) throw new Error('useStore used outside Store');
  return c;
}

/* ----------------------------------------------------------- selectors */
export const product = (id: string): Product => byId(id);

export function listTotals(l: List) {
  const est = l.items.reduce((t, i) => t + i.qty * price(i.productId), 0);
  return { est: +est.toFixed(2), savings: +(est * SAVINGS_RATE).toFixed(2), count: l.items.length };
}

const aisleRank = (id: string) => {
  const i = AISLE_ORDER.indexOf(byId(id).aisle);
  return i === -1 ? 99 : i;
};

/** Sorting is real. `recent` keeps insertion order (newest first). */
export function sortItems(items: LineItem[], sort: SortKey): LineItem[] {
  const a = [...items];
  switch (sort) {
    case 'low':        return a.sort((x, y) => price(x.productId) - price(y.productId));
    case 'high':       return a.sort((x, y) => price(y.productId) - price(x.productId));
    case 'department': return a.sort((x, y) => aisleRank(x.productId) - aisleRank(y.productId)
                                            || byId(x.productId).title.localeCompare(byId(y.productId).title));
    default:           return a;
  }
}

/**
 * Checked items sink to the bottom, which shortens the live part of the list
 * and walks the End trip button up toward the thumb as the trip progresses.
 */
export const sinkChecked = (items: LineItem[]): LineItem[] =>
  [...items].sort((a, b) => Number(a.checked) - Number(b.checked));

/** Group into aisles for the in-store screens, preserving the design's order. */
export function byAisle(items: LineItem[]): [string, LineItem[]][] {
  const g = new Map<string, LineItem[]>();
  for (const i of items) {
    const k = byId(i.productId).aisle;
    g.set(k, [...(g.get(k) ?? []), i]);
  }
  return [...g.entries()].sort((a, b) => AISLE_ORDER.indexOf(a[0]) - AISLE_ORDER.indexOf(b[0]));
}
