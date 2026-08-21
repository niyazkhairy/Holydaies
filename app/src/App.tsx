import { useCallback, useEffect, useState } from 'react';
import { DesignScreen, SCREENS, screenById, FRAME_W, FRAME_H } from './design/DesignScreen';
import { HOTSPOTS, SHEET_SCREENS, S } from './design/flow';

const BEZEL = 26, PAD = 24;

function useFitScale() {
  const [k, setK] = useState(1);
  useEffect(() => {
    const fit = () => setK(Math.min(1,
      (window.innerWidth  - PAD) / (FRAME_W + BEZEL),
      (window.innerHeight - PAD) / (FRAME_H + BEZEL)));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  return k;
}

/** Product imagery lives in /products, named by the first 12 hex of its hash.
 *  The single-file bundle injects `__ASSETS` with data URIs instead, so the
 *  published page never fetches anything. */
declare global { interface Window { __ASSETS?: Record<string, string> } }

const assetUrl = (hash: string) => {
  const key = hash.slice(0, 12);
  return window.__ASSETS?.[key] ?? `/products/${key}.png`;
};

export default function App() {
  const k = useFitScale();
  const [current, setCurrent] = useState<string>(() => location.hash.slice(1) || S.lists);
  const [anim, setAnim] = useState<'sheet' | 'push' | 'pop' | null>(null);

  const go = useCallback((to: string) => {
    setAnim(SHEET_SCREENS.has(to) ? 'sheet' : SHEET_SCREENS.has(current) ? 'pop' : 'push');
    setCurrent(to);
    history.replaceState(null, '', '#' + to);
  }, [current]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') go(S.lists); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const screen = screenById(current) ?? SCREENS[0];

  return (
    <div className="stage">
      <div className="fit" style={{ width: FRAME_W * k, height: FRAME_H * k }}>
        <div style={{ transform: `scale(${k})`, transformOrigin: 'top left', width: FRAME_W, height: FRAME_H }}>
          <div className="device">
            <div key={current} className={anim ? `enter-${anim}` : undefined}
                 style={{ position: 'absolute', inset: 0 }}>
              <DesignScreen
                screen={screen}
                hotspots={HOTSPOTS[current] ?? []}
                onNavigate={go}
                assetUrl={assetUrl}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
