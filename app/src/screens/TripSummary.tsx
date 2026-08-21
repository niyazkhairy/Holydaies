import { useNavigate, useParams } from 'react-router-dom';
import { StatusBar, TabBar, Avatar, CartButton } from '../components/Chrome';
import { FigIcon } from '../design/FigIcon';
import { useStore, listTotals, product } from '../store';

const SHOPPERS = [
  { name: 'You',       initial: 'N', colour: 'var(--avatar-n)', share: .46 },
  { name: 'Yasamin',   initial: 'Y', colour: 'var(--avatar-y)', share: .31 },
  { name: 'Farkhonda', initial: 'F', colour: 'var(--avatar-f)', share: .23 },
];

export default function TripSummary() {
  const { id } = useParams();
  const nav = useNavigate();
  const { s, d } = useStore();
  const list = s.lists.find(l => l.id === id) ?? s.lists[0];
  const { savings } = listTotals(list);

  // The trip total is what was actually picked up, not the whole list.
  const picked = list.items.filter(i => i.checked);
  const subtotal = +picked.reduce((t, i) => t + i.qty * product(i.productId).price, 0).toFixed(2);
  const tax = +(subtotal * 0.0825).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);
  const units = picked.reduce((t, i) => t + i.qty, 0);

  return (
    <div className="screen">
      <div className="appbar">
        <StatusBar />
        <div className="appbar-row">
          <button className="iconbtn" aria-label="Back" onClick={() => nav(`/list/${list.id}/instore`)}>
            <FigIcon name="back" size={17} color="#fff" />
          </button>
          <h1>List</h1>
          <CartButton />
        </div>
      </div>

      <div className="scroll" style={{ padding: '22px 17px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: 'var(--wm-navy)' }}>{list.name}</h2>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {['share', 'gear'].map(n => (
              <span key={n} style={{ width: 33, height: 33, borderRadius: 999, display: 'grid',
                                     placeItems: 'center', boxShadow: 'inset 0 0 0 1px var(--ink)' }}>
                <FigIcon name={n} size={15} />
              </span>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 15, fontWeight: 700, marginTop: 24 }}>Trip 12, and your quickest yet</div>
        <div style={{ fontSize: 14, marginTop: 6, lineHeight: 1.4 }}>
          19 minutes. Five under usual for a list this size.
        </div>

        <ul style={{ marginTop: 24 }}>
          {SHOPPERS.map(p => (
            <li key={p.name} style={{ marginBottom: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar initial={p.initial} colour={p.colour} size={26} />
                <span style={{ fontSize: 15 }}>{p.name}</span>
                <span style={{ marginLeft: 'auto', fontSize: 15 }}>{Math.round(units * p.share)} items</span>
              </div>
              <div style={{ height: 5, background: 'var(--surface-2)', borderRadius: 3, marginTop: 9 }}>
                <div style={{ height: '100%', width: `${p.share * 100}%`, background: p.colour, borderRadius: 3 }} />
              </div>
            </li>
          ))}
        </ul>

        <Line label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
        <Line label="Tax" value={`$${tax.toFixed(2)}`} />

        <div style={{ display: 'flex', gap: 11, marginTop: 18 }}>
          <Stat label="Items" value={String(units)} />
          <Stat label="Total" value={`$${total.toFixed(2)}`} />
          <Stat label="Saved" value={`$${savings.toFixed(2)}`} green />
        </div>

        {units === 0 && (
          <div style={{ fontSize: 13, color: 'var(--ink-4)', marginTop: 14, textAlign: 'center' }}>
            Nothing was checked off on this trip — tick items in Shop in-store to see them counted here.
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, margin: '24px 0 30px' }}>
          <button className="btn btn-primary" style={{ flex: 1 }}>
            <FigIcon name="barcode" size={16} color="#fff" /> Scan &amp; Go
          </button>
          <button className="btn btn-outline" style={{ flex: 1 }}
                  onClick={() => { d({ t: 'resetTrip', listId: list.id }); nav('/'); }}>
            Done
          </button>
        </div>
      </div>
      <TabBar />
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', padding: '15px 0', borderTop: '1px solid var(--line)', fontSize: 15 }}>
      <span>{label}</span><span style={{ marginLeft: 'auto' }}>{value}</span>
    </div>
  );
}

function Stat({ label, value, green = false }: { label: string; value: string; green?: boolean }) {
  const c = green ? 'var(--green)' : 'var(--ink)';
  return (
    <div style={{ flex: 1, background: green ? 'var(--green-bg)' : 'var(--surface-2)',
                  borderRadius: 'var(--r-sm)', padding: '11px 13px' }}>
      <div style={{ fontSize: 15, color: c }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 6, color: c }}>{value}</div>
    </div>
  );
}
