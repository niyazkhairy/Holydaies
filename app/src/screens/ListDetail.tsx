import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StatusBar, TabBar, Sheet, Avatar, CartButton } from '../components/Chrome';
import { FigIcon } from '../design/FigIcon';
import {
  useStore, listTotals, product, sortItems, sinkChecked, type SortKey, type LineItem,
} from '../store';
import { searchProducts, SHARE_LINK, PERMISSION_LABEL, type Permission } from '../data/catalog';
import { asset } from '../data/assets';

type SheetId = null | 'sort' | 'share' | 'settings' | 'sharelist' | 'permission';

const SORTS: { k: SortKey; label: string }[] = [
  { k: 'recent', label: 'Most recent' },
  { k: 'department', label: 'Department' },
  { k: 'low', label: 'Price low' },
  { k: 'high', label: 'Price high' },
];

export default function ListDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { s, d } = useStore();
  const list = s.lists.find(l => l.id === id) ?? s.lists[0];

  const [sheet, setSheet] = useState<SheetId>(null);
  const [person, setPerson] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [rename, setRename] = useState(list?.name ?? '');

  const { est, savings } = listTotals(list);

  // sort first, then sink anything already checked to the bottom
  const items = useMemo(
    () => sinkChecked(sortItems(list.items, s.sort)),
    [list.items, s.sort],
  );

  const matches = useMemo(
    () => searchProducts(query, list.items.map(i => i.productId)),
    [query, list.items],
  );

  /* ---------------- 04 · search inside the list ---------------- */
  if (searching) {
    return (
      <div className="screen">
        <div className="appbar">
          <StatusBar />
          <div className="appbar-row">
            <button className="iconbtn" aria-label="Back" onClick={() => { setSearching(false); setQuery(''); }}>
              <FigIcon name="back" size={17} color="#fff" />
            </button>
            <h1>List</h1>
            <CartButton />
          </div>
        </div>

        <div style={{ padding: '18px 16px 6px', display: 'flex', gap: 14, alignItems: 'center' }}>
          {/* design screen 04: 325x58, r4, 2px #2E2F33 while typing */}
          <input className="field" autoFocus value={query} placeholder="Add an item to your list"
                 onChange={e => setQuery(e.target.value)} style={{ flex: 1, height: 58 }} />
          <button style={{ fontSize: 15 }} onClick={() => { setSearching(false); setQuery(''); }}>Cancel</button>
        </div>
        <div style={{ padding: '0 16px', fontSize: 11 }}>Enter an item, like “milk” or “coffee”.</div>

        <ul className="scroll" style={{ padding: '12px 0' }}>
          {matches.map(m => (
            <li key={m.id}>
              <button onClick={() => { d({ t: 'addItem', listId: list.id, productId: m.id }); setQuery(''); setSearching(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                         padding: '10px 17px', textAlign: 'left' }}>
                <img src={asset(m.img)} alt="" style={{ width: 34, height: 34, objectFit: 'contain' }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 700 }}>{m.keyword}</span>
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--ink-4)', marginTop: 2,
                                 overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.title}
                  </span>
                </span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>${m.price.toFixed(2)}</span>
              </button>
            </li>
          ))}
          {query.trim() && matches.length === 0 && (
            <li style={{ padding: '18px 17px', fontSize: 13, color: 'var(--ink-4)' }}>
              Nothing matches “{query.trim()}”. Try “milk”, “juice” or “coffee”.
            </li>
          )}
        </ul>
        <TabBar />
      </div>
    );
  }

  /* ---------------- 05 · the list itself ---------------- */
  return (
    <div className="screen">
      <div className="appbar">
        <StatusBar />
        <div className="appbar-row">
          <button className="iconbtn" aria-label="Back" onClick={() => nav('/')}>
            <FigIcon name="back" size={17} color="#fff" />
          </button>
          <h1>List</h1>
          <CartButton />
        </div>
      </div>

      <div className="scroll">
        <div style={{ padding: '22px 17px 16px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: 'var(--wm-navy)' }}>{list.name}</h2>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <RoundBtn label="Share" onClick={() => setSheet('share')}><FigIcon name="share" size={15} /></RoundBtn>
              <RoundBtn label="List settings" onClick={() => { setRename(list.name); setSheet('settings'); }}>
                <FigIcon name="gear" size={15} />
              </RoundBtn>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 16 }}>
            <span data-testid="est-total" style={{ fontSize: 16, fontWeight: 700, color: 'var(--wm-navy)' }}>
              ${est.toFixed(2)}
            </span>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--wm-navy)' }}>Est. total</span>
            <span className="savings savings-pill" style={{ fontSize: 12 }}>-${savings.toFixed(2)}</span>
            <span style={{ marginLeft: 'auto', fontSize: 9 }}>Delivery as soon as 6am</span>
          </div>

          <div style={{ display: 'flex', gap: 18, marginTop: 18 }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => nav(`/list/${list.id}/instore`)}>
              <FigIcon name="list-view" size={15} /> Shop in-store
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => d({ t: 'addAllToCart', listId: list.id })}>
              <FigIcon name="cart-sm" size={15} color="#fff" /> Add all to cart
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', padding: '18px 17px 10px' }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink-2)' }}>All items</span>
          <span style={{ fontSize: 17, color: 'var(--ink-2)', marginLeft: 4 }}>({list.items.length})</span>
          <button className="btn" onClick={() => setSheet('sort')}
                  style={{ marginLeft: 'auto', background: 'var(--surface-2)', color: 'var(--ink-2)' }}>
            <FigIcon name="list-view" size={14} /> Sort by
          </button>
        </div>

        <div style={{ padding: '0 17px 6px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 8 }}>
            Add an item to your list
          </div>
          <button className="field" onClick={() => setSearching(true)}
                  style={{ textAlign: 'left', color: 'var(--muted)', height: 42 }}>
            Add an item to your list
          </button>
          <div style={{ fontSize: 11, margin: '8px 0 2px' }}>Enter an item, like “milk” or “coffee”.</div>
        </div>

        {list.items.length === 0 ? <EmptyState /> : (
          <ItemList listId={list.id} items={items} grouped={s.sort === 'department'} />
        )}
      </div>

      <TabBar />

      {sheet === 'sort' && (
        <Sheet title="Sort by" onClose={() => setSheet(null)}>
          {SORTS.map(o => (
            <button key={o.k} onClick={() => d({ t: 'setSort', sort: o.k })}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '13px 4px' }}>
              <span style={{ width: 18, height: 18, borderRadius: 999, display: 'grid', placeItems: 'center',
                             boxShadow: `inset 0 0 0 2px ${s.sort === o.k ? 'var(--wm-blue)' : 'var(--ink-5)'}` }}>
                {s.sort === o.k && <span style={{ width: 9, height: 9, borderRadius: 999, background: 'var(--wm-blue)' }} />}
              </span>
              <span style={{ fontSize: 15 }}>{o.label}</span>
            </button>
          ))}
          <button className="btn btn-primary btn-block" style={{ marginTop: 20 }} onClick={() => setSheet(null)}>
            View results
          </button>
        </Sheet>
      )}

      {sheet === 'share' && (
        <Sheet title="Share" onClose={() => setSheet(null)}>
          <ShareRow icon="eye" title="Share view only"
                    sub="They'll see your list and any changes you make. Only you can edit."
                    onClick={() => setSheet('sharelist')} />
          <ShareRow icon="checkbox" title="Let them shop it"
                    sub="They can check items off. Only you can add or remove."
                    onClick={() => setSheet('sharelist')} />
          <ShareRow icon="pencil" title="Shop together"
                    sub="Add and check off together, in real time."
                    onClick={() => setSheet('sharelist')} />
        </Sheet>
      )}

      {sheet === 'settings' && (
        <Sheet title="List settings" onClose={() => setSheet(null)}>
          <label htmlFor="rename" style={{ fontSize: 13, fontWeight: 700 }}>Enter list name</label>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '10px 0 18px' }}>
            <input id="rename" className="field" value={rename} onChange={e => setRename(e.target.value)} style={{ flex: 1 }} />
            <button className="btn btn-primary" disabled={!rename.trim() || rename === list.name}
                    onClick={() => { d({ t: 'renameList', listId: list.id, name: rename.trim() }); setSheet(null); }}>
              Save
            </button>
          </div>
          <ShareRow icon="share" title="Manage Share List" sub="Plan your shopping together"
                    onClick={() => setSheet('sharelist')} />
          <ShareRow icon="checkbox" title="Manage items"
                    sub="Select multiple items to delete or move to another list" onClick={() => setSheet(null)} />
          <button className="sheetrow" onClick={() => { d({ t: 'deleteList', listId: list.id }); nav('/'); }}>
            <FigIcon name="trash" size={17} color="var(--red)" />
            <span style={{ flex: 1 }}>
              <span className="t" style={{ color: 'var(--red)' }}>Delete list</span>
              <span className="s" style={{ color: 'var(--red)' }}>
                This list will be permanently deleted and cannot be recovered
              </span>
            </span>
          </button>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink-5)', marginTop: 12 }}>
            Created {list.createdAt} · {list.orders} orders · ${list.spent} spent.
          </div>
        </Sheet>
      )}

      {sheet === 'sharelist' && (
        <Sheet title="Share List" onClose={() => setSheet(null)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderRadius: 'var(--r-sm)',
                        boxShadow: 'inset 0 0 0 1px var(--ink)', padding: '11px 13px' }}>
            <span style={{ fontSize: 14, flex: 1 }}>{SHARE_LINK}</span>
            <button onClick={() => navigator.clipboard?.writeText(SHARE_LINK)} style={{ fontSize: 13, fontWeight: 700 }}>
              Copy
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-4)', margin: '8px 0 14px' }}>
            Anyone with this link can access to the list
          </div>
          {s.people.map(p => (
            <button key={p.id} className="sheetrow" style={{ alignItems: 'center', gap: 12 }}
                    onClick={() => { if (p.id !== 'you') { setPerson(p.id); setSheet('permission'); } }}>
              <Avatar initial={p.initial} colour={p.colour} />
              <span style={{ flex: 1 }}>
                <span className="t">{p.name}</span>
                <span className="s">
                  {p.id === 'you' ? 'Owner' : p.signedIn ? PERMISSION_LABEL[p.permission] : 'Not signed in'}
                </span>
              </span>
              {p.id !== 'you' && <FigIcon name="chevron-right" size={14} />}
            </button>
          ))}
        </Sheet>
      )}

      {sheet === 'permission' && person && (
        <PermissionSheet personId={person} onBack={() => setSheet('sharelist')} onClose={() => setSheet(null)} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------- pieces */
function RoundBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} aria-label={label}
      style={{ width: 33, height: 33, borderRadius: 999, display: 'grid', placeItems: 'center',
               boxShadow: 'inset 0 0 0 1px var(--ink)' }}>
      {children}
    </button>
  );
}

function ShareRow({ icon, title, sub, onClick }: { icon: string; title: string; sub: string; onClick: () => void }) {
  return (
    <button className="sheetrow" onClick={onClick}>
      <span style={{ marginTop: 2 }}><FigIcon name={icon} size={18} /></span>
      <span style={{ flex: 1 }}>
        <span className="t">{title}</span>
        <span className="s">{sub}</span>
      </span>
      <span style={{ alignSelf: 'center' }}><FigIcon name="chevron-right" size={14} /></span>
    </button>
  );
}

function PermissionSheet({ personId, onBack, onClose }: { personId: string; onBack: () => void; onClose: () => void }) {
  const { s, d } = useStore();
  const p = s.people.find(x => x.id === personId);
  if (!p) return null;
  const opts: { k: Permission; icon: string }[] = [
    { k: 'view', icon: 'eye' }, { k: 'check', icon: 'checkbox' }, { k: 'add', icon: 'pencil' },
  ];
  return (
    <Sheet title={p.name} onBack={onBack} onClose={onClose}>
      <div style={{ fontSize: 13, color: 'var(--ink-4)', marginBottom: 12 }}>On this list, {p.name} can</div>
      <div style={{ display: 'grid', gap: 10 }}>
        {opts.map(o => {
          const on = p.permission === o.k;
          return (
            <button key={o.k} onClick={() => d({ t: 'setPermission', personId: p.id, permission: o.k })}
              style={{ display: 'flex', alignItems: 'center', gap: 12, height: 46, padding: '0 14px',
                       borderRadius: 'var(--r-sm)',
                       background: on ? 'var(--wm-blue)' : '#fff',
                       color: on ? '#fff' : 'var(--ink)',
                       boxShadow: `inset 0 0 0 1px ${on ? 'var(--wm-blue)' : 'var(--line)'}` }}>
              <FigIcon name={o.icon} size={17} color={on ? '#fff' : 'var(--ink)'} />
              <span style={{ fontSize: 15 }}>{PERMISSION_LABEL[o.k]}</span>
            </button>
          );
        })}
      </div>
      <button className="sheetrow" style={{ marginTop: 18, borderBottom: 0 }}
              onClick={() => { d({ t: 'removePerson', personId: p.id }); onBack(); }}>
        <FigIcon name="trash" size={17} color="var(--red)" />
        <span style={{ flex: 1 }}>
          <span className="t" style={{ color: 'var(--red)' }}>Remove from list</span>
          <span className="s" style={{ color: 'var(--red)' }}>Items {p.name} added stay on the list.</span>
        </span>
      </button>
    </Sheet>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '44px 44px 0' }}>
      <svg width="132" height="112" viewBox="0 0 132 112" fill="none" aria-hidden="true" style={{ margin: '0 auto 18px' }}>
        <circle cx="66" cy="56" r="45" fill="var(--wm-blue-tint)" />
        <path d="M40 48h52l-5 44a6 6 0 0 1-6 5H51a6 6 0 0 1-6-5L40 48Z" fill="var(--wm-blue)" />
        <path d="M55 48V38a11 11 0 0 1 22 0v10" stroke="var(--wm-navy)" strokeWidth="4" strokeLinecap="round" />
        <path d="m66 62 2.6 6.4 6.4 2.6-6.4 2.6L66 80l-2.6-6.4L57 71l6.4-2.6L66 62Z" fill="var(--wm-spark)" />
      </svg>
      <div style={{ fontSize: 15, fontWeight: 700 }}>Let's get shopping!</div>
      <div style={{ fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>
        Add your go-to items above, or save your favorites as you explore.
      </div>
    </div>
  );
}

/** Flat when sorted any other way; grouped with sticky aisle headers by Department. */
function ItemList({ listId, items, grouped }: { listId: string; items: LineItem[]; grouped: boolean }) {
  if (!grouped) {
    return <ul style={{ paddingBottom: 24 }}>{items.map(i => <ItemRow key={i.productId} listId={listId} item={i} />)}</ul>;
  }
  const groups: [string, LineItem[]][] = [];
  for (const i of items) {
    const a = product(i.productId).aisle;
    const last = groups[groups.length - 1];
    if (last && last[0] === a) last[1].push(i);
    else groups.push([a, [i]]);
  }
  return (
    <div style={{ paddingBottom: 24 }}>
      {groups.map(([aisle, rows]) => (
        <section key={aisle}>
          <header className="aisle-head">
            <FigIcon name="pin" size={15} />
            <strong>{aisle}</strong>
            <span className="count">{rows.length} items</span>
          </header>
          <ul>{rows.map(i => <ItemRow key={i.productId} listId={listId} item={i} />)}</ul>
        </section>
      ))}
    </div>
  );
}

function ItemRow({ listId, item }: { listId: string; item: LineItem }) {
  const { d } = useStore();
  const p = product(item.productId);
  return (
    <li className={`itemrow${item.checked ? ' checked' : ''}`}>
      <img className="thumb" src={asset(p.img)} alt="" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span className="kw">{p.keyword}</span>
          <span className="price">${p.price.toFixed(2)}</span>
        </div>
        <div className="title">{p.title}</div>
        {p.detail && <div className="detail">{p.detail}</div>}
        {item.addedBy && <div className="detail">{item.addedBy}</div>}
        <span className="aisle"><FigIcon name="pin" size={12} color="var(--ink-4)" />{p.aisle.split(' · ')[0]}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}>
          <button style={{ fontSize: 13, textDecoration: 'underline' }}
                  onClick={() => d({ t: 'removeItem', listId, productId: p.id })}>Remove</button>
          <label style={{ fontSize: 13 }}>
            Need:{' '}
            <select value={item.qty} aria-label={`Quantity for ${p.keyword}`}
                    onChange={e => d({ t: 'setQty', listId, productId: p.id, qty: +e.target.value })}
                    style={{ fontSize: 13, border: 0, background: 'none' }}>
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <button className="btn btn-primary" style={{ marginLeft: 'auto' }}
                  onClick={() => d({ t: 'addToCart', productId: p.id, qty: item.qty })}>Add to cart</button>
        </div>
      </div>
    </li>
  );
}
