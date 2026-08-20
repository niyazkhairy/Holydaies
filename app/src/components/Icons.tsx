type P = { size?: number; color?: string; strokeWidth?: number; className?: string };
const S = ({ size = 24, color = 'currentColor', strokeWidth = 1.8, className, d }: P & { d: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}
       stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export const Search   = (p: P) => <S {...p} d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm6.5-1.5L21 21" />;
export const ChevRight= (p: P) => <S {...p} d="m9 18 6-6-6-6" />;
export const ChevLeft = (p: P) => <S {...p} d="m15 18-6-6 6-6" />;
export const ChevDown = (p: P) => <S {...p} d="m6 9 6 6 6-6" />;
export const Close    = (p: P) => <S {...p} d="M18 6 6 18M6 6l12 12" />;
export const Plus     = (p: P) => <S {...p} d="M12 5v14M5 12h14" />;
export const Check    = (p: P) => <S {...p} d="m20 6-11 11-5-5" />;
export const Trash    = (p: P) => <S {...p} d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />;
export const Share    = (p: P) => <S {...p} d="M12 16V3m0 0L8 7m4-4 4 4M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />;
export const Gear     = (p: P) => (
  <svg width={p.size ?? 24} height={p.size ?? 24} viewBox="0 0 24 24" fill="none"
       stroke={p.color ?? 'currentColor'} strokeWidth={p.strokeWidth ?? 1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" />
  </svg>
);
export const Pin      = (p: P) => <S {...p} d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />;
export const Eye      = (p: P) => <S {...p} d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />;
export const Pencil   = (p: P) => <S {...p} d="M4 20h4L20 8a2.8 2.8 0 0 0-4-4L4 16v4Z" />;
export const CheckBox = (p: P) => <S {...p} d="M4 4h16v16H4zM8 12l3 3 5-5" />;
export const Refresh  = (p: P) => <S {...p} d="M20 11A8 8 0 0 0 6 6L4 8m0-4v4h4m-4 5a8 8 0 0 0 14 5l2-2m0 4v-4h-4" />;
export const Copy     = (p: P) => <S {...p} d="M9 9h10v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9Zm-2 6H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />;
export const Link     = (p: P) => <S {...p} d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 1 0-7-7l-1 1m-2 6a5 5 0 0 0-7 0l-3 3a5 5 0 1 0 7 7l1-1" />;
export const Sliders  = (p: P) => <S {...p} d="M4 7h10M18 7h2M4 17h4M12 17h8M16 5v4M8 15v4" />;
export const GridIcon = (p: P) => <S {...p} d="M4 6h7M4 12h7M4 18h7M15 6h5M15 12h5M15 18h5" />;
export const Rows     = (p: P) => <S {...p} d="M4 7h16M4 12h16M4 17h16" />;
export const Barcode  = (p: P) => (
  <svg width={p.size ?? 22} height={p.size ?? 22} viewBox="0 0 24 24" fill="none"
       stroke={p.color ?? 'currentColor'} strokeWidth={p.strokeWidth ?? 1.7} strokeLinecap="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
    <path d="M7 8v8M10 8v8M13 8v8M17 8v8" />
  </svg>
);
export const Cart = ({ size = 26, color = '#fff' }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
       strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 4h2l2.4 11.2A2 2 0 0 0 9.4 17h7.9a2 2 0 0 0 2-1.6L21 8H6" />
    <circle cx="10" cy="20" r="1.3" /><circle cx="18" cy="20" r="1.3" />
  </svg>
);

/* ---- bottom-nav glyphs ---- */
export const NavShop = (p: P) => <S {...p} d="M4 10 12 4l8 6v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9Z" />;
export const NavItems = (p: P) => <S {...p} d="M7 4h10a1 1 0 0 1 1 1v15l-6-3-6 3V5a1 1 0 0 1 1-1Z" />;
export const NavServices = (p: P) => (
  <svg width={p.size ?? 22} height={p.size ?? 22} viewBox="0 0 24 24" fill={p.color ?? 'currentColor'}>
    {[6, 12, 18].flatMap(cx => [6, 12, 18].map(cy => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.8" />))}
  </svg>
);
export const NavAccount = (p: P) => <S {...p} d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 8a8 8 0 0 1 16 0" />;
export const Sparky = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="var(--wm-spark)" />
    <path d="M8.5 14.5a4.5 4.5 0 0 0 7 0" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="9" cy="10" r="1.2" fill="#1a1a1a" /><circle cx="15" cy="10" r="1.2" fill="#1a1a1a" />
  </svg>
);

/* ---- status bar glyphs ---- */
export const Signal = ({ color = '#fff' }: P) => (
  <svg width="18" height="12" viewBox="0 0 18 12" fill={color}>
    <rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" />
    <rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" />
  </svg>
);
export const Wifi = ({ color = '#fff' }: P) => (
  <svg width="17" height="12" viewBox="0 0 17 12" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round">
    <path d="M1 4.2a11 11 0 0 1 15 0M3.9 7.1a7 7 0 0 1 9.2 0" /><circle cx="8.5" cy="10.2" r="1" fill={color} stroke="none" />
  </svg>
);
export const Battery = ({ color = '#fff' }: P) => (
  <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
    <rect x=".6" y=".6" width="21" height="10.8" rx="3" stroke={color} strokeOpacity=".5" />
    <rect x="2.2" y="2.2" width="17.8" height="7.6" rx="1.8" fill={color} />
    <path d="M23 4.2v3.6a2 2 0 0 0 0-3.6Z" fill={color} fillOpacity=".5" />
  </svg>
);
