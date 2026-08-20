import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, TabBar, Sheet, Avatar } from '../components/Chrome';
import * as I from '../components/Icons';
import { useStore, listTotals, product, type List } from '../store';

const SEG = ['Reorder', 'Lists', 'Registries'];

export default function Lists() {
  const { s, d } = useStore();
  const nav = useNavigate();
  const [seg, setSeg] = useState('Lists');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const create = () => {
    const n = name.trim(); if (!n) return;
    d({ t: 'createList', name: n });
    setCreating(false); setName('');
    nav('/list/new');
  };

  return (
    <div className="screen">
      <AppBar search>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 17px 14px', fontSize: 14 }}>
          <I.Pin size={17} color="#fff" />
          <strong style={{ fontWeight: 700 }}>Pickup or delivery?</strong>
          <span style={{ opacity: .95, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            4249 W Michigan Ave, Gle…
          </span>
          <I.ChevDown size={18} color="#fff" />
        </div>
      </AppBar>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', flex: '0 0 auto' }}>
        {SEG.map(t => (
          <button key={t} onClick={() => setSeg(t)}
            style={{ flex: 1, height: 44, fontSize: 13, fontWeight: seg === t ? 700 : 400,
                     borderBottom: seg === t ? '3px solid var(--wm-blue)' : '3px solid transparent' }}>
            {t}
          </button>
        ))}
      </div>

      <div className="scroll">
        <div style={{ display: 'flex', alignItems: 'center', padding: '20px 18px 12px' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Lists</h2>
          <span style={{ fontSize: 14, marginLeft: 5 }}>({s.lists.length + 1})</span>
          <button className="btn btn-primary" style={{ marginLeft: 'auto', height: 42, fontSize: 16, padding: '0 22px' }}
                  onClick={() => setCreating(true)}>
            Create a list
          </button>
        </div>

        <div style={{ padding: '0 16px 20px', display: 'grid', gap: 14 }}>
          {s.lists.filter(l => l.favourite).map(l => <MiniCard key={l.id} list={l} />)}
          <ClaimedOffers />
          {s.lists.filter(l => !l.favourite).map(l => <ListCard key={l.id} list={l} />)}
        </div>
      </div>

      <TabBar />

      {creating && (
        <Sheet title="Create a new list" onClose={() => setCreating(false)}>
          <label style={{ fontSize: 13, fontWeight: 700 }}>Enter list name</label>
          <div style={{ position: 'relative', margin: '10px 0 22px' }}>
            <input autoFocus value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && create()}
              placeholder="Enter list name"
              style={{ width: '100%', height: 42, borderRadius: 'var(--r-sm)', border: '1px solid var(--ink)',
                       padding: '0 40px 0 14px', fontSize: 15 }} />
            {name && (
              <button onClick={() => setName('')} aria-label="Clear"
                style={{ position: 'absolute', right: 12, top: 11 }}>
                <span style={{ display: 'grid', placeItems: 'center', width: 20, height: 20,
                               borderRadius: 999, background: 'var(--ink-2)' }}>
                  <I.Close size={12} color="#fff" strokeWidth={2.4} />
                </span>
              </button>
            )}
          </div>
          <button className="btn btn-primary btn-block" disabled={!name.trim()} onClick={create}>Create</button>
        </Sheet>
      )}
    </div>
  );
}

function MiniCard({ list }: { list: List }) {
  const nav = useNavigate();
  return (
    <button onClick={() => nav(`/list/${list.id}`)}
      style={{ background: 'var(--wm-blue-tint)', borderRadius: 'var(--r-card)', padding: '16px 18px', textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <svg width="20" height="18" viewBox="0 0 24 24" fill="var(--wm-blue)">
          <path d="M12 21s-8-5.2-8-10.4A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 3.6C20 15.8 12 21 12 21Z" />
        </svg>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{list.name}</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, textAlign: 'right', lineHeight: 1.35 }}>
          2 items cheaper<br />this week
        </span>
      </div>
      <div style={{ fontSize: 13, marginTop: 8 }}>{list.subtitle}</div>
    </button>
  );
}

function ClaimedOffers() {
  return (
    <div style={{ background: 'var(--wm-blue-tint)', borderRadius: 'var(--r-card)', padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 22, height: 22, borderRadius: 999, background: 'var(--wm-gold)',
                       display: 'grid', placeItems: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>$</span>
        <span style={{ fontSize: 15, fontWeight: 700 }}>Claimed offers</span>
      </div>
      <div style={{ fontSize: 13, marginTop: 8 }}>Walmart Cash - 37 items</div>
    </div>
  );
}

function ListCard({ list }: { list: List }) {
  const { d } = useStore();
  const nav = useNavigate();
  const { est, savings } = listTotals(list);
  const thumbs = list.items.slice(0, 3);
  const extra = Math.max(0, list.items.length - 3);

  return (
    <div style={{ border: `1px solid ${list.waitingOnYou ? 'var(--wm-blue)' : 'var(--line)'}`,
                  borderRadius: 'var(--r-card)', overflow: 'hidden' }}>
      <button onClick={() => nav(`/list/${list.id}`)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '16px 18px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{list.name}</span>
          <span style={{ marginLeft: 'auto', fontSize: 12 }}>Est. total ${est.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 5 }}>
          <span style={{ fontSize: 9, color: list.waitingOnYou ? 'var(--wm-blue)' : 'var(--ink)' }}>
            {list.subtitle}
          </span>
          <span className="savings" style={{ marginLeft: 'auto', fontSize: 12 }}>-${savings.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0 12px' }}>
          {thumbs.map(i => (
            <img key={i.productId} src={product(i.productId).img} alt=""
                 style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 6, background: '#fff' }} />
          ))}
          {extra > 0 && <span style={{ fontSize: 13, fontWeight: 700 }}>+{extra}</span>}
          <span style={{ marginLeft: 'auto', display: 'flex' }}>
            <Avatar initial="Y" colour="var(--avatar-y)" lg />
            <span style={{ marginLeft: -6 }}><Avatar initial="F" colour="var(--avatar-f)" lg /></span>
          </span>
        </div>
      </button>
      <div className="divider" />
      <div style={{ display: 'flex', alignItems: 'center', padding: '13px 18px' }}>
        <button style={{ fontSize: 12 }} onClick={() => nav(`/list/${list.id}/instore`)}>Shop in-store</button>
        <button style={{ fontSize: 12, marginLeft: 'auto', textDecoration: 'underline' }}
                onClick={() => d({ t: 'addAllToCart', listId: list.id })}>Add all to cart</button>
      </div>
    </div>
  );
}
