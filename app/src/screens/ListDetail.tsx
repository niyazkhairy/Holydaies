import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StatusBar, TabBar, Sheet, Avatar, CartButton } from '../components/Chrome';
import * as I from '../components/Icons';
import { useStore, listTotals, product, sortItems, type SortKey } from '../store';
import { PRODUCTS, SUGGESTIONS, SHARE_LINK, PERMISSION_LABEL, type Permission } from '../data/catalog';

type SheetId = null | 'sort' | 'share' | 'settings' | 'sharelist' | 'permission';
const SORTS: { k: SortKey; label: string }[] = [
  { k: 'recent', label: 'Most recent' }, { k: 'department', label: 'Department' },
  { k: 'low', label: 'Price low' }, { k: 'high', label: 'Price high' },
];

export default function ListDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { s, d } = useStore();
  const list = s.lists.find(l => l.id === id) ?? s.lists[0];
  const [sheet, setSheet] = useState<SheetId>(null);
  const [person, setPerson] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [rename, setRename] = useState(list?.name ?? '');

  const { est, savings } = listTotals(list);
  const items = useMemo(() => sortItems(list.items, s.sort), [list.items, s.sort]);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const fromDesign = SUGGESTIONS.filter(x => x.q.includes(q));
    if (fromDesign.length)
      return fromDesign.map(x => ({ label: x.q, img: product(x.productId).img, pid: x.productId }));
    return PRODUCTS.filter(p => (p.keyword + ' ' + p.title).toLowerCase().includes(q))
      .slice(0, 5).map(p => ({ label: p.keyword, img: p.img, pid: p.id }));
  }, [query]);

  const addProduct = (pid: string) => {
    d({ t: 'addItem', listId: list.id, productId: pid });
    setQuery(''); setSearching(false);
  };

  /* ---------- 04 Search inside the list ---------- */
  if (searching) {
    return (
      <div className="screen">
        <div className="appbar">
          <StatusBar />
          <div className="row">
            <button onClick={() => setSearching(false)} aria-label="Back"><I.ChevLeft size={22} color="#fff" /></button>
            <h1>List</h1>
            <div style={{ marginLeft: 'auto' }}><CartButton /></div>
          </div>
        </div>
        <div style={{ padding: '18px 16px 8px', display: 'flex', gap: 14, alignItems: 'center' }}>
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                 placeholder="Add an item to your list"
                 style={{ flex: 1, height: 40, border: '1px solid var(--ink)', borderRadius: 'var(--r-sm)',
                          padding: '0 12px', fontSize: 15 }} />
          <button style={{ fontSize: 15 }} onClick={() => { setSearching(false); setQuery(''); }}>Cancel</button>
        </div>
        <div style={{ padding: '0 16px', fontSize: 11, color: 'var(--ink)' }}>
          Enter an item, like “milk” or “coffee”.
        </div>
        <ul className="scroll" style={{ padding: '14px 16px' }}>
          {matches.map(m => (
            <li key={m.label + m.pid}>
              <button onClick={() => addProduct(m.pid)}
                style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%',
                         padding: '9px 0', textAlign: 'left' }}>
                <img src={m.img} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                <span style={{ fontSize: 11 }}>
                  {m.label.split(new RegExp(`(${query.trim()})`, 'i')).map((part, i) =>
                    part.toLowerCase() === query.trim().toLowerCase()
                      ? <span key={i}>{part}</span> : <strong key={i}>{part}</strong>)}
                </span>
                <I.Plus size={14} className="" color="var(--ink)" />
              </button>
            </li>
          ))}
        </ul>
        <TabBar />
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="appbar">
        <StatusBar />
        <div className="row">
          <button onClick={() => nav('/')} aria-label="Back"><I.ChevLeft size={22} color="#fff" /></button>
          <h1>List</h1>
          <div style={{ marginLeft: 'auto' }}><CartButton /></div>
        </div>
      </div>

      <div className="scroll">
        {/* ---- summary card ---- */}
        <div style={{ padding: '22px 17px 16px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: 'var(--wm-navy)' }}>{list.name}</h2>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <RoundBtn label="Share" onClick={() => setSheet('share')}><I.Share size={15} /></RoundBtn>
              <RoundBtn label="List settings" onClick={() => { setRename(list.name); setSheet('settings'); }}>
                <I.Gear size={15} />
              </RoundBtn>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 16 }}>
            <span data-testid="est-total" style={{ fontSize: 16, fontWeight: 700, color: 'var(--wm-navy)' }}>${est.toFixed(2)}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--wm-navy)' }}>Est. total</span>
            <span className="savings" style={{ fontSize: 12 }}>-${savings.toFixed(2)}</span>
            <span style={{ marginLeft: 'auto', fontSize: 9 }}>Delivery as soon as 6am</span>
          </div>

          <div style={{ display: 'flex', gap: 18, marginTop: 18 }}>
            <button className="btn btn-outline" style={{ flex: 1 }}
                    onClick={() => nav(`/list/${list.id}/instore`)}>
              <I.Rows size={15} /> Shop in-store
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }}
                    onClick={() => d({ t: 'addAllToCart', listId: list.id })}>
              <I.Cart size={15} color="#fff" /> Add all to cart
            </button>
          </div>
        </div>

        {/* ---- items ---- */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '18px 17px 8px' }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink-2)' }}>All items</span>
          <span style={{ fontSize: 17, color: 'var(--ink-2)', marginLeft: 4 }}>({list.items.length})</span>
          <button onClick={() => setSheet('sort')} className="btn"
                  style={{ marginLeft: 'auto', background: 'var(--surface-2)', color: 'var(--ink-2)', height: 33 }}>
            <I.Sliders size={15} /> Sort by
          </button>
        </div>

        <div style={{ padding: '0 17px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 8 }}>
            Add an item to your list
          </div>
          <button onClick={() => setSearching(true)}
            style={{ width: '100%', height: 40, border: '1px solid var(--ink)', borderRadius: 'var(--r-sm)',
                     textAlign: 'left', padding: '0 12px', color: 'var(--muted)', fontSize: 15 }}>
            Add an item to your list
          </button>
          <div style={{ fontSize: 11, margin: '8px 0 4px' }}>Enter an item, like “milk” or “coffee”.</div>
        </div>

        {list.items.length === 0 ? <EmptyState /> : (
          <ul style={{ padding: '10px 0 24px' }}>
            {items.map(it => <ItemRow key={it.productId} listId={list.id} item={it} />)}
          </ul>
        )}
      </div>

      <TabBar />

      {sheet === 'sort' && (
        <Sheet title="Sort by" onClose={() => setSheet(null)}>
          {SORTS.map(o => (
            <button key={o.k} onClick={() => d({ t: 'setSort', sort: o.k })}
              style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '13px 4px' }}>
              <span style={{ width: 18, height: 18, borderRadius: 999, display: 'grid', placeItems: 'center',
                             border: `2px solid ${s.sort === o.k ? 'var(--wm-blue)' : 'var(--ink-5)'}` }}>
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
          <ShareRow icon={<I.Eye size={19} />} title="Share view only"
            sub="They'll see your list and any changes you make. Only you can edit."
            onClick={() => setSheet('sharelist')} />
          <ShareRow icon={<I.CheckBox size={18} />} title="Let them shop it"
            sub="They can check items off. Only you can add or remove."
            onClick={() => setSheet('sharelist')} />
          <ShareRow icon={<I.Pencil size={17} />} title="Shop together"
            sub="Add and check off together, in real time."
            onClick={() => setSheet('sharelist')} />
        </Sheet>
      )}

      {sheet === 'settings' && (
        <Sheet title="List settings" onClose={() => setSheet(null)}>
          <label style={{ fontSize: 13, fontWeight: 700 }}>Enter list name</label>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '10px 0 20px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input value={rename} onChange={e => setRename(e.target.value)}
                style={{ width: '100%', height: 42, border: '1px solid var(--ink)', borderRadius: 'var(--r-sm)',
                         padding: '0 38px 0 14px', fontSize: 15 }} />
              {rename && (
                <button onClick={() => setRename('')} style={{ position: 'absolute', right: 11, top: 11 }} aria-label="Clear">
                  <span style={{ display: 'grid', placeItems: 'center', width: 20, height: 20, borderRadius: 999, background: 'var(--ink-2)' }}>
                    <I.Close size={12} color="#fff" strokeWidth={2.4} />
                  </span>
                </button>
              )}
            </div>
            <button className="btn" disabled={rename === list.name || !rename.trim()}
              style={{ background: rename !== list.name && rename.trim() ? 'var(--wm-blue)' : 'var(--line)',
                       color: rename !== list.name && rename.trim() ? '#fff' : 'var(--muted)', height: 36 }}
              onClick={() => { d({ t: 'renameList', listId: list.id, name: rename.trim() }); setSheet(null); }}>
              Save
            </button>
          </div>
          <ShareRow icon={<I.Share size={17} />} title="Manage Share List"
            sub="Plan your shopping together" onClick={() => setSheet('sharelist')} />
          <ShareRow icon={<I.CheckBox size={17} />} title="Manage items"
            sub="Select multiple items to delete or move to another list" onClick={() => setSheet(null)} />
          <button onClick={() => { d({ t: 'deleteList', listId: list.id }); nav('/'); }}
            style={{ display: 'flex', gap: 16, alignItems: 'flex-start', width: '100%', padding: '14px 6px', textAlign: 'left' }}>
            <I.Trash size={17} color="var(--red)" />
            <span>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--red)' }}>Delete list</span>
              <span style={{ display: 'block', fontSize: 13, color: 'var(--red)', marginTop: 4 }}>
                This list will be permanently deleted and cannot be recovered
              </span>
            </span>
          </button>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink-5)', marginTop: 10 }}>
            Created {list.createdAt} · {list.orders} orders · ${list.spent} spent.
          </div>
        </Sheet>
      )}

      {sheet === 'sharelist' && (
        <Sheet title="Share List" onClose={() => setSheet(null)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--ink)',
                        borderRadius: 'var(--r-sm)', padding: '11px 13px' }}>
            <I.Link size={16} />
            <span style={{ fontSize: 14, flex: 1 }}>{SHARE_LINK}</span>
            <button onClick={() => navigator.clipboard?.writeText(SHARE_LINK)} aria-label="Copy link"><I.Copy size={17} /></button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-4)', margin: '8px 0 16px' }}>
            Anyone with this link can access to the list
          </div>
          {s.people.map(p => (
            <button key={p.id} onClick={() => p.id !== 'you' && (setPerson(p.id), setSheet('permission'))}
              style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                       padding: '13px 2px', borderTop: '1px solid var(--line)', textAlign: 'left' }}>
              <Avatar initial={p.initial} colour={p.colour} />
              <span>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 700 }}>{p.name}</span>
                <span style={{ display: 'block', fontSize: 13, color: 'var(--ink-4)', marginTop: 3 }}>
                  {p.id === 'you' ? 'Owner' : p.signedIn ? PERMISSION_LABEL[p.permission] : 'Not signed in'}
                </span>
              </span>
              {p.id !== 'you' && <span style={{ marginLeft: 'auto' }}><I.ChevRight size={15} /></span>}
            </button>
          ))}
          <button style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}
                  onClick={() => d({ t: 'regenerateLink' })}>
            <I.Refresh size={17} color="var(--wm-blue)" />
            <span style={{ fontSize: 14, color: 'var(--wm-blue)', fontWeight: 700 }}>Get a new link</span>
          </button>
          <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 6, paddingLeft: 27 }}>
            The old link stops working. People already in the list stay
          </div>
        </Sheet>
      )}

      {sheet === 'permission' && person && (
        <PermissionSheet personId={person} onBack={() => setSheet('sharelist')} onClose={() => setSheet(null)} />
      )}
    </div>
  );
}

function RoundBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} aria-label={label}
      style={{ width: 33, height: 33, borderRadius: 999, border: '1px solid var(--ink)',
               display: 'grid', placeItems: 'center' }}>
      {children}
    </button>
  );
}

function ShareRow({ icon, title, sub, onClick }:
  { icon: React.ReactNode; title: string; sub: string; onClick: () => void }) {
  return (
    <button className="sheetrow" onClick={onClick}>
      <span style={{ marginTop: 2 }}>{icon}</span>
      <span style={{ flex: 1 }}>
        <span className="t" style={{ display: 'block' }}>{title}</span>
        <span className="s" style={{ display: 'block' }}>{sub}</span>
      </span>
      <span className="chev"><I.ChevRight size={15} /></span>
    </button>
  );
}

function PermissionSheet({ personId, onBack, onClose }:
  { personId: string; onBack: () => void; onClose: () => void }) {
  const { s, d } = useStore();
  const p = s.people.find(x => x.id === personId);
  if (!p) return null;
  const opts: { k: Permission; icon: React.ReactNode }[] = [
    { k: 'view', icon: <I.Eye size={17} /> },
    { k: 'check', icon: <I.CheckBox size={17} /> },
    { k: 'add', icon: <I.Pencil size={16} /> },
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
                       border: `1px solid ${on ? 'var(--wm-blue)' : 'var(--line)'}`,
                       background: on ? 'var(--wm-blue)' : '#fff',
                       color: on ? '#fff' : 'var(--ink)', borderRadius: 'var(--r-sm)' }}>
              {o.icon}
              <span style={{ fontSize: 15 }}>{PERMISSION_LABEL[o.k]}</span>
              {on && <span style={{ marginLeft: 'auto' }}><I.Check size={17} color="#fff" /></span>}
            </button>
          );
        })}
      </div>
      <button onClick={() => { d({ t: 'removePerson', personId: p.id }); onBack(); }}
        style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginTop: 22, textAlign: 'left' }}>
        <I.Trash size={17} color="var(--red)" />
        <span>
          <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--red)' }}>Remove from list</span>
          <span style={{ display: 'block', fontSize: 13, color: 'var(--red)', marginTop: 3 }}>
            Items {p.name} added stay on the list.
          </span>
        </span>
      </button>
    </Sheet>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 40px 0' }}>
      <svg width="132" height="112" viewBox="0 0 132 112" fill="none" style={{ marginBottom: 18 }}>
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

function ItemRow({ listId, item }: { listId: string; item: { productId: string; qty: number; checked: boolean; addedBy?: string } }) {
  const { d } = useStore();
  const p = product(item.productId);
  return (
    <li style={{ display: 'flex', gap: 12, padding: '14px 17px', borderBottom: '1px solid var(--line)' }}>
      <img src={p.img} alt="" style={{ width: 64, height: 64, objectFit: 'contain', flex: '0 0 64px' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex' }}>
          <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{p.keyword}</span>
          <span style={{ marginLeft: 'auto', fontSize: 15, fontWeight: 700 }}>${p.price.toFixed(2)}</span>
        </div>
        <div style={{ fontSize: 13, marginTop: 4, lineHeight: 1.35 }}>{p.title}</div>
        {item.addedBy && <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 4 }}>{item.addedBy}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 11, color: 'var(--ink-4)' }}>
          <I.Pin size={13} color="var(--ink-4)" /><u>{p.aisle.split(' · ')[0]}</u>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}>
          <button style={{ fontSize: 13, textDecoration: 'underline' }}
                  onClick={() => d({ t: 'removeItem', listId, productId: p.id })}>Remove</button>
          <span style={{ fontSize: 13 }}>Need:</span>
          <select value={item.qty} onChange={e => d({ t: 'setQty', listId, productId: p.id, qty: +e.target.value })}
            style={{ fontSize: 13, border: 0, background: 'none' }}>
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <button className="btn btn-primary" style={{ marginLeft: 'auto' }}
                  onClick={() => d({ t: 'addToCart', productId: p.id })}>Add to cart</button>
        </div>
      </div>
    </li>
  );
}
