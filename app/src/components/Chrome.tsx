import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as I from './Icons';
import { useStore } from '../store';
import { ART } from '../data/catalog';

export function StatusBar({ dark = false }: { dark?: boolean }) {
  const c = dark ? 'var(--ink)' : '#fff';
  return (
    <div className={`statusbar${dark ? ' dark' : ''}`}>
      <span>9:30</span>
      <span className="glyphs"><I.Signal color={c} /><I.Wifi color={c} /><I.Battery color={c} /></span>
    </div>
  );
}

/** The blue Walmart bar. `variant` mirrors the two header treatments in the design. */
export function AppBar({ title, onBack, children, search = false }:
  { title?: string; onBack?: () => void; children?: ReactNode; search?: boolean }) {
  const { s } = useStore();
  return (
    <div className="appbar">
      <StatusBar />
      {search ? (
        <div style={{ padding: '0 17px 10px' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ flex: 1, height: 42, background: '#fff', borderRadius: 'var(--r-pill)',
                          display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px' }}>
              <I.Search size={19} color="var(--ink)" />
              <span style={{ fontSize: 15, color: 'var(--ink)' }}>Search Walmart</span>
              <I.Barcode size={20} color="var(--ink)" />
            </div>
            <CartButton />
          </div>
        </div>
      ) : (
        <div className="row">
          {onBack && <button onClick={onBack} aria-label="Back"><I.ChevLeft size={22} color="#fff" /></button>}
          <h1>{title}</h1>
          <div style={{ marginLeft: 'auto' }}><CartButton /></div>
        </div>
      )}
      {children}
      <span style={{ position: 'absolute', left: -9999 }}>{s.cartCount}</span>
    </div>
  );
}

export function CartButton() {
  const { s } = useStore();
  return (
    <div style={{ position: 'relative', width: 38, textAlign: 'center' }}>
      <I.Cart size={26} />
      <span style={{ position: 'absolute', top: -4, right: -2, minWidth: 17, height: 17, padding: '0 4px',
                     borderRadius: 999, background: 'var(--wm-spark)', color: '#393939',
                     fontSize: 12, fontWeight: 500, display: 'grid', placeItems: 'center' }}>
        {s.cartCount}
      </span>
      <div style={{ fontSize: 9, fontWeight: 500, color: '#fff', marginTop: 1 }}>
        ${s.cartTotal.toFixed(2)}
      </div>
    </div>
  );
}

function SparkyFace({ size = 22 }: { size?: number; color?: string }) {
  return <img src={ART.sparky} alt="" width={size} height={size} style={{ display: 'block' }} />;
}

const TABS = [
  { id: 'shop', label: 'Shop', Icon: I.NavShop },
  { id: 'items', label: 'My Items', Icon: I.NavItems },
  { id: 'sparky', label: 'Ask Sparky', Icon: SparkyFace },
  { id: 'services', label: 'Services', Icon: I.NavServices },
  { id: 'account', label: 'Account', Icon: I.NavAccount },
];

export function TabBar() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const active = pathname.startsWith('/shop') ? 'shop' : 'items';
  return (
    <>
      <nav className="tabbar">
        {TABS.map(({ id, label, Icon }) => {
          const on = id === active;
          return (
            <button key={id} className={`tab${on ? ' active' : ''}`}
                    onClick={() => nav(id === 'items' ? '/' : '/shop')}>
              <Icon size={22} color={on ? 'var(--wm-blue-nav)' : 'var(--ink-3)'} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
      <div className="homebar" />
    </>
  );
}

export function Sheet({ title, onClose, onBack, children }:
  { title?: string; onClose: () => void; onBack?: () => void; children: ReactNode }) {
  return (
    <>
      <div className="scrimlayer" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        {onBack && <button className="back" onClick={onBack} aria-label="Back"><I.ChevLeft size={20} /></button>}
        {title && <h2>{title}</h2>}
        <button className="close" onClick={onClose} aria-label="Close"><I.Close size={17} /></button>
        <div style={{ marginTop: 14 }}>{children}</div>
      </div>
    </>
  );
}

export function Avatar({ initial, colour, lg = false }: { initial: string; colour: string; lg?: boolean }) {
  return <span className={`avatar${lg ? ' lg' : ''}`} style={{ background: colour }}>{initial}</span>;
}

export function Device({ children }: { children: ReactNode }) {
  return <div className="device">{children}</div>;
}
