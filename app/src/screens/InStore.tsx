import { useNavigate, useParams } from 'react-router-dom';
import { StatusBar, TabBar, CartButton } from '../components/Chrome';
import * as I from '../components/Icons';
import { useStore, product, byAisle, type LineItem } from '../store';

export default function InStore() {
  const { id } = useParams();
  const nav = useNavigate();
  const { s, d } = useStore();
  const list = s.lists.find(l => l.id === id) ?? s.lists[0];

  const picked = list.items.filter(i => i.checked).length;
  const total = list.items.length;
  const pct = total ? (picked / total) * 100 : 0;
  const groups = byAisle(list.items);
  const card = s.instoreLayout === 'card';

  return (
    <div className="screen">
      <div className="appbar" style={{ paddingBottom: 14 }}>
        <StatusBar />
        <div className="row" style={{ paddingBottom: 6 }}>
          <button onClick={() => nav(`/list/${list.id}`)} aria-label="Back"><I.ChevLeft size={22} color="#fff" /></button>
          <h1>{list.name}</h1>
          <div style={{ marginLeft: 'auto' }}><CartButton /></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', padding: '0 17px' }}>
          <span style={{ fontSize: 30, color: '#fff', lineHeight: 1 }}>{picked} of {total}</span>
          <span style={{ fontSize: 15, color: '#fff', marginLeft: 8, marginBottom: 2 }}>picked</span>
          <div style={{ marginLeft: 'auto', display: 'flex', background: 'rgba(255,255,255,.18)',
                        borderRadius: 999, padding: 3 }}>
            <Toggle on={card} onClick={() => d({ t: 'setLayout', layout: 'card' })} label="Card view">
              <I.GridIcon size={18} color={card ? 'var(--wm-blue)' : '#fff'} />
            </Toggle>
            <Toggle on={!card} onClick={() => d({ t: 'setLayout', layout: 'list' })} label="List view">
              <I.Rows size={18} color={!card ? 'var(--wm-blue)' : '#fff'} />
            </Toggle>
          </div>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,.28)', borderRadius: 2, margin: '14px 17px 0' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--wm-spark)',
                        borderRadius: 2, transition: 'width .28s ease-out' }} />
        </div>
      </div>

      <div className="scroll">
        {groups.map(([aisle, items]) => (
          <section key={aisle}>
            <header style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-2)',
                             padding: '10px 17px' }}>
              <I.Pin size={15} />
              <span style={{ fontSize: 15, fontWeight: 700 }}>{aisle}</span>
              <span style={{ marginLeft: 'auto', fontSize: 15 }}>{items.length} items</span>
            </header>
            <ul>
              {items.map(it => card
                ? <CardRow key={it.productId} listId={list.id} item={it} />
                : <ListRow key={it.productId} listId={list.id} item={it} />)}
            </ul>
          </section>
        ))}

        <div style={{ padding: '20px 17px' }}>
          <button className="btn btn-primary btn-block" onClick={() => nav(`/list/${list.id}/done`)}>
            End trip
          </button>
        </div>

        {picked > 0 && (
          <>
            <header style={{ display: 'flex', background: 'var(--surface-2)', padding: '10px 17px' }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Items Picked</span>
              <span style={{ marginLeft: 'auto', fontSize: 15 }}>{picked} items</span>
            </header>
            <ul style={{ padding: '4px 0 20px' }}>
              {list.items.filter(i => i.checked).map(i => (
                <li key={i.productId} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '11px 17px' }}>
                  <span style={{ width: 20, height: 20, borderRadius: 999, background: 'var(--wm-blue)',
                                 display: 'grid', placeItems: 'center' }}>
                    <I.Check size={12} color="#fff" strokeWidth={3} />
                  </span>
                  <span>
                    <span style={{ display: 'block', fontSize: 13 }}>{product(i.productId).keyword}</span>
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--ink-4)', marginTop: 2 }}>
                      You picked this up, just now
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <TabBar />
    </div>
  );
}

function Toggle({ on, onClick, children, label }:
  { on: boolean; onClick: () => void; children: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} aria-label={label} aria-pressed={on}
      style={{ width: 46, height: 29, borderRadius: 999, display: 'grid', placeItems: 'center',
               background: on ? '#fff' : 'transparent' }}>
      {children}
    </button>
  );
}

function Tick({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label={on ? 'Uncheck item' : 'Check item off'} aria-pressed={on}
      style={{ width: 22, height: 22, borderRadius: 999, flex: '0 0 22px', display: 'grid', placeItems: 'center',
               border: on ? 'none' : '2px dashed var(--wm-blue)',
               background: on ? 'var(--wm-blue)' : 'transparent' }}>
      {on && <I.Check size={13} color="#fff" strokeWidth={3} />}
    </button>
  );
}

function CardRow({ listId, item }: { listId: string; item: LineItem }) {
  const { d } = useStore();
  const p = product(item.productId);
  return (
    <li style={{ display: 'flex', gap: 12, padding: '14px 17px', borderBottom: '1px solid var(--line)',
                 opacity: item.checked ? .55 : 1 }}>
      <Tick on={item.checked} onClick={() => d({ t: 'toggleCheck', listId, productId: p.id })} />
      <img src={p.img} alt="" style={{ width: 62, height: 62, objectFit: 'contain', flex: '0 0 62px' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex' }}>
          <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{p.keyword}</span>
          <span style={{ marginLeft: 'auto', fontSize: 13 }}>Qty: {item.qty}</span>
        </div>
        <div style={{ fontSize: 13, marginTop: 5, lineHeight: 1.35,
                      textDecoration: item.checked ? 'line-through' : 'none' }}>{p.title}</div>
        {item.addedBy && <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 4 }}>{item.addedBy}</div>}
      </div>
    </li>
  );
}

function ListRow({ listId, item }: { listId: string; item: LineItem }) {
  const { d } = useStore();
  const p = product(item.productId);
  return (
    <li style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '13px 17px',
                 borderBottom: '1px solid var(--line)', opacity: item.checked ? .55 : 1 }}>
      <Tick on={item.checked} onClick={() => d({ t: 'toggleCheck', listId, productId: p.id })} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, textDecoration: item.checked ? 'line-through' : 'none' }}>{p.title}</div>
        {item.addedBy && <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 3 }}>{item.addedBy}</div>}
      </div>
      {p.flashTag && <u style={{ fontSize: 13, whiteSpace: 'nowrap' }}>Flash tag</u>}
    </li>
  );
}
