import { useNavigate, useParams } from 'react-router-dom';
import { StatusBar, TabBar, Avatar, CartButton } from '../components/Chrome';
import * as I from '../components/Icons';
import { useStore, listTotals } from '../store';

const SHOPPERS = [
  { name: 'You',       initial: 'N', colour: 'var(--avatar-n)', share: .46 },
  { name: 'Yasamin',   initial: 'Y', colour: 'var(--avatar-y)', share: .31 },
  { name: 'Farkhonda', initial: 'F', colour: 'var(--avatar-f)', share: .23 },
];

export default function TripSummary() {
  const { id } = useParams();
  const nav = useNavigate();
  const { s } = useStore();
  const list = s.lists.find(l => l.id === id) ?? s.lists[0];
  const { est, savings } = listTotals(list);

  const subtotal = +(est * 1.865).toFixed(2);   // basket incl. items picked in-store
  const tax = 1.0;
  const total = +(subtotal + tax).toFixed(2);
  const units = list.items.reduce((t, i) => t + i.qty, 0) * 4;

  return (
    <div className="screen">
      <div className="appbar">
        <StatusBar />
        <div className="row">
          <button onClick={() => nav(`/list/${list.id}`)} aria-label="Back"><I.ChevLeft size={22} color="#fff" /></button>
          <h1>List</h1>
          <div style={{ marginLeft: 'auto' }}><CartButton /></div>
        </div>
      </div>

      <div className="scroll" style={{ padding: '22px 17px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: 'var(--wm-navy)' }}>{list.name}</h2>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {[<I.Share size={15} key="s" />, <I.Gear size={15} key="g" />].map((el, i) => (
              <span key={i} style={{ width: 33, height: 33, borderRadius: 999, border: '1px solid var(--ink)',
                                     display: 'grid', placeItems: 'center' }}>{el}</span>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 15, fontWeight: 700, marginTop: 26 }}>Trip 12, and your quickest yet</div>
        <div style={{ fontSize: 14, marginTop: 6, lineHeight: 1.4 }}>
          19 minutes. Five under usual for a list this size.
        </div>

        <ul style={{ marginTop: 26 }}>
          {SHOPPERS.map(p => (
            <li key={p.name} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar initial={p.initial} colour={p.colour} lg />
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

        <div style={{ display: 'flex', gap: 11, marginTop: 20 }}>
          <Stat label="Items" value={String(units)} />
          <Stat label="Total" value={`$${total.toFixed(2)}`} />
          <Stat label="Saved" value={`$${savings.toFixed(2)}`} green />
        </div>

        <div style={{ display: 'flex', gap: 16, margin: '26px 0 30px' }}>
          <button className="btn btn-primary" style={{ flex: 1 }}>
            <I.Barcode size={16} color="#fff" /> Scan &amp; Go
          </button>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => nav('/')}>Done</button>
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
  return (
    <div style={{ flex: 1, background: green ? 'var(--green-bg)' : 'var(--surface-2)',
                  borderRadius: 'var(--r-sm)', padding: '11px 13px' }}>
      <div style={{ fontSize: 15, color: green ? 'var(--green)' : 'var(--ink)' }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 6, color: green ? 'var(--green)' : 'var(--ink)' }}>
        {value}
      </div>
    </div>
  );
}
