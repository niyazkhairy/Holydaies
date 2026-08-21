import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StatusBar, TabBar, CartButton, TickRing } from '../components/Chrome';
import { FigIcon } from '../design/FigIcon';
import { useStore, product, byAisle, type LineItem } from '../store';
import { asset } from '../data/assets';

export default function InStore() {
  const { id } = useParams();
  const nav = useNavigate();
  const { s, d } = useStore();
  const list = s.lists.find(l => l.id === id) ?? s.lists[0];

  const picked = list.items.filter(i => i.checked).length;
  const total = list.items.length;
  const pct = total ? (picked / total) * 100 : 0;
  const card = s.instoreLayout === 'card';

  // Only unchecked items keep their aisle grouping. Everything ticked off drops
  // into the "Items Picked" block at the bottom, so the live list shortens and
  // End trip climbs toward the thumb as the trip progresses.
  const open = useMemo(() => list.items.filter(i => !i.checked), [list.items]);
  const done = useMemo(() => list.items.filter(i => i.checked), [list.items]);
  const groups = useMemo(() => byAisle(open), [open]);

  return (
    <div className="screen">
      <div className="appbar" style={{ paddingBottom: 14 }}>
        <StatusBar />
        <div className="appbar-row" style={{ paddingBottom: 6 }}>
          <button className="iconbtn" aria-label="Back" onClick={() => nav(`/list/${list.id}`)}>
            <FigIcon name="back" size={17} color="#fff" />
          </button>
          <h1>{list.name}</h1>
          <CartButton />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', padding: '0 17px' }}>
          <span style={{ fontSize: 30, color: '#fff', lineHeight: 1 }}>{picked} of {total}</span>
          <span style={{ fontSize: 15, color: '#fff', margin: '0 0 3px 8px' }}>picked</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 3, background: 'rgba(255,255,255,.18)',
                        borderRadius: 999, padding: 3 }}>
            <Toggle on={card} label="Card view" onClick={() => d({ t: 'setLayout', layout: 'card' })}>
              <FigIcon name="grid-view" size={17} color={card ? 'var(--wm-blue)' : '#fff'} />
            </Toggle>
            <Toggle on={!card} label="List view" onClick={() => d({ t: 'setLayout', layout: 'list' })}>
              <FigIcon name="list-view" size={17} color={!card ? 'var(--wm-blue)' : '#fff'} />
            </Toggle>
          </div>
        </div>

        <div className="progressbar"><div style={{ width: `${pct}%` }} /></div>
      </div>

      <div className="scroll">
        {groups.map(([aisle, rows]) => (
          <section key={aisle}>
            <header className="aisle-head">
              <FigIcon name="pin" size={15} />
              <strong>{aisle}</strong>
              <span className="count">{rows.length} items</span>
            </header>
            <ul>
              {rows.map(i => card
                ? <CardRow key={i.productId} listId={list.id} item={i} />
                : <CompactRow key={i.productId} listId={list.id} item={i} />)}
            </ul>
          </section>
        ))}

        {open.length === 0 && (
          <div style={{ textAlign: 'center', padding: '34px 40px 10px' }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Everything's picked</div>
            <div style={{ fontSize: 13, marginTop: 6, color: 'var(--ink-4)' }}>
              Nice work — end the trip whenever you're ready.
            </div>
          </div>
        )}

        <div style={{ padding: '18px 17px' }}>
          <button className="btn btn-primary btn-block" onClick={() => nav(`/list/${list.id}/done`)}>
            End trip
          </button>
        </div>

        {done.length > 0 && (
          <>
            <header className="aisle-head">
              <strong>Items Picked</strong>
              <span className="count">{done.length} items</span>
            </header>
            <ul style={{ paddingBottom: 24 }}>
              {done.map(i => {
                const p = product(i.productId);
                return (
                  <li key={i.productId} className={`itemrow${card ? '' : ' compact'}`}
                      style={{ alignItems: 'center' }}>
                    <Tick on label={`Uncheck ${p.keyword}`}
                          onClick={() => d({ t: 'toggleCheck', listId: list.id, productId: p.id })} />
                    {/* list view drops the thumbnail; card view keeps it */}
                    {card && <img className="thumb" src={asset(p.img)} alt=""
                                  style={{ width: 34, height: 34, flex: '0 0 34px' }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13 }}>{card ? p.keyword : p.title}</div>
                      <div className="detail">You picked this up, just now</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
      <TabBar />
    </div>
  );
}

function Toggle({ on, onClick, children, label }: {
  on: boolean; onClick: () => void; children: React.ReactNode; label: string;
}) {
  return (
    <button onClick={onClick} aria-label={label} aria-pressed={on}
      style={{ width: 44, height: 27, borderRadius: 999, display: 'grid', placeItems: 'center',
               background: on ? '#fff' : 'transparent' }}>
      {children}
    </button>
  );
}

function Tick({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button aria-pressed={on} aria-label={label} onClick={onClick}
            style={{ flex: '0 0 22px', display: 'grid', placeItems: 'center' }}>
      <TickRing checked={on} />
    </button>
  );
}

function CardRow({ listId, item }: { listId: string; item: LineItem }) {
  const { d } = useStore();
  const p = product(item.productId);
  return (
    <li className="itemrow">
      <Tick on={item.checked} label={`Check off ${p.keyword}`}
            onClick={() => d({ t: 'toggleCheck', listId, productId: p.id })} />
      <img className="thumb" src={asset(p.img)} alt="" style={{ width: 62, height: 62, flex: '0 0 62px' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span className="kw">{p.keyword}</span>
          {/* Qty belongs to card view only; the design's list view has none. */}
          <span style={{ marginLeft: 'auto', fontSize: 13 }}>Qty: {item.qty}</span>
        </div>
        <div className="title">{p.title}</div>
        {p.detail && <div className="detail">{p.detail}</div>}
        {item.addedBy && <div className="detail">{item.addedBy}</div>}
      </div>
    </li>
  );
}

function CompactRow({ listId, item }: { listId: string; item: LineItem }) {
  const { d } = useStore();
  const p = product(item.productId);
  return (
    <li className="itemrow compact" style={{ alignItems: 'center' }}>
      <Tick on={item.checked} label={`Check off ${p.keyword}`}
            onClick={() => d({ t: 'toggleCheck', listId, productId: p.id })} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13 }}>{p.title}</div>
        {item.addedBy && <div className="detail">{item.addedBy}</div>}
      </div>
      {/* list view carries a flash tag on every row */}
      <span className="flashtag">Flash tag</span>
    </li>
  );
}
