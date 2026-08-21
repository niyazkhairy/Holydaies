import { useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FigIcon } from '../design/FigIcon';
import { useStore } from '../store';
import { ART } from '../data/catalog';
import { asset } from '../data/assets';

export function StatusBar() {
  return (
    <div className="statusbar">
      <span>9:30</span>
      <span className="glyphs">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="#fff" aria-hidden="true">
          <rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none" stroke="#fff" strokeWidth="1.7"
             strokeLinecap="round" aria-hidden="true">
          <path d="M1 4.2a11 11 0 0 1 15 0M3.9 7.1a7 7 0 0 1 9.2 0" />
          <circle cx="8.5" cy="10.2" r="1" fill="#fff" stroke="none" />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none" aria-hidden="true">
          <rect x=".6" y=".6" width="21" height="10.8" rx="3" stroke="#fff" strokeOpacity=".5" />
          <rect x="2.2" y="2.2" width="17.8" height="7.6" rx="1.8" fill="#fff" />
          <path d="M23 4.2v3.6a2 2 0 0 0 0-3.6Z" fill="#fff" fillOpacity=".5" />
        </svg>
      </span>
    </div>
  );
}

export function CartButton() {
  const { s } = useStore();
  return (
    <div className="cartbtn">
      <FigIcon name="cart" size={26} color="#fff" />
      <span className="cartbadge">{s.cartCount}</span>
      <span className="carttotal">${s.cartTotal.toFixed(2)}</span>
    </div>
  );
}

/** The blue bar: either the search treatment (01) or a titled bar with back. */
export function AppBar({ title, onBack, search = false, children }: {
  title?: string; onBack?: () => void; search?: boolean; children?: ReactNode;
}) {
  return (
    <div className="appbar">
      <StatusBar />
      {search ? (
        <div className="appbar-search">
          {/* design: 346x42 pill, r21; magnifier 19px, 15px input, barcode 26x18 */}
          <SearchField />
          <CartButton />
        </div>
      ) : (
        <div className="appbar-row">
          {onBack && (
            <button className="iconbtn" onClick={onBack} aria-label="Back">
              <FigIcon name="back" size={17} color="#fff" />
            </button>
          )}
          <h1>{title}</h1>
          <CartButton />
        </div>
      )}
      {children}
    </div>
  );
}

/** Search with the states a real field needs: hover, focus, clear, submit. */
function SearchField() {
  const [q, setQ] = useState('');
  return (
    <form className="searchfield" role="search" onSubmit={e => e.preventDefault()}>
      <FigIcon name="search" size={19} color="var(--ink)" />
      <input
        className="searchinput"
        type="search"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search Walmart"
        aria-label="Search Walmart"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
      />
      {q ? (
        <button type="button" className="inputclear" aria-label="Clear search" onClick={() => setQ('')}>
          <FigIcon name="close" size={10} color="#fff" />
        </button>
      ) : (
        <FigIcon name="barcode" size={19} color="var(--ink)" />
      )}
    </form>
  );
}

const TABS = [
  { id: 'shop', label: 'Shop', icon: 'nav-shop' },
  { id: 'items', label: 'My Items', icon: 'nav-items' },
  { id: 'sparky', label: 'Ask Sparky', icon: null },
  { id: 'services', label: 'Services', icon: 'nav-services' },
  { id: 'account', label: 'Account', icon: 'nav-account' },
];

export function TabBar() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const active = pathname === '/shop' ? 'shop' : 'items';
  return (
    <>
      <nav className="tabbar">
        {TABS.map(t => {
          const on = t.id === active;
          return (
            <button key={t.id} className={`tab${on ? ' active' : ''}`}
                    onClick={() => nav(t.id === 'items' ? '/' : '/shop')}>
              {t.icon
                ? <FigIcon name={t.icon} size={22} color={on ? 'var(--wm-blue-nav)' : 'var(--ink-3)'} />
                : <img src={asset(ART.sparky)} alt="" width={24} height={24} />}
              <span>{t.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="homebar" />
    </>
  );
}

export function Sheet({ title, onClose, onBack, children }: {
  title?: string; onClose: () => void; onBack?: () => void; children: ReactNode;
}) {
  return (
    <>
      <div className="scrimlayer" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        {onBack && (
          <button className="sheet-back" onClick={onBack} aria-label="Back">
            <FigIcon name="back" size={17} />
          </button>
        )}
        {title && <h2>{title}</h2>}
        <button className="sheet-close" onClick={onClose} aria-label="Close">
          <FigIcon name="close" size={16} />
        </button>
        <div className="sheet-body">{children}</div>
      </div>
    </>
  );
}

export function Avatar({ initial, colour, size = 22 }: { initial: string; colour: string; size?: number }) {
  return (
    <span className="avatar" style={{ background: colour, width: size, height: size, fontSize: size * 0.55 }}>
      {initial}
    </span>
  );
}

/** The design's selection-circle: 22px, 2px stroke #0052E2, dash pattern 4/3. */
export function TickRing({ checked }: { checked: boolean }) {
  return checked ? (
    <svg className="tickring" width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <circle cx="11" cy="11" r="11" fill="var(--wm-blue)" />
      <path d="m6.2 11.3 3.2 3.2 6.4-6.4" fill="none" stroke="#fff" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg className="tickring" width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <circle cx="11" cy="11" r="10" fill="none" stroke="var(--wm-blue)" strokeWidth="2"
              strokeDasharray="4 3" />
    </svg>
  );
}

export function Device({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return <div className="device" style={style}>{children}</div>;
}
