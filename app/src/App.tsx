import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Store } from './store';
import { Device } from './components/Chrome';
import Lists from './screens/Lists';
import ListDetail from './screens/ListDetail';
import InStore from './screens/InStore';
import TripSummary from './screens/TripSummary';

const W = 430, H = 932, BEZEL = 26, PAD = 24;

/**
 * The frame keeps the design's true 430x932 and is scaled only as far as the
 * viewport demands, so the whole phone is always visible without page scroll.
 * Scaling is a plain 2D transform with no will-change: Chrome re-rasterises
 * text at the composited scale, which is what keeps it sharp.
 */
function useFitScale() {
  const [k, setK] = useState(1);
  useEffect(() => {
    const fit = () => setK(Math.min(1,
      (window.innerWidth  - PAD) / (W + BEZEL),
      (window.innerHeight - PAD) / (H + BEZEL)));
    fit();
    window.addEventListener('resize', fit);
    window.addEventListener('orientationchange', fit);
    return () => {
      window.removeEventListener('resize', fit);
      window.removeEventListener('orientationchange', fit);
    };
  }, []);
  return k;
}

export default function App() {
  const k = useFitScale();
  return (
    <Store>
      <HashRouter>
        <div className="stage">
          <div className="fit" style={{ width: W * k, height: H * k }}>
            <Device style={{ transform: k === 1 ? undefined : `scale(${k})` }}>
              <Routes>
                <Route path="/" element={<Lists />} />
                <Route path="/list/:id" element={<ListDetail />} />
                <Route path="/list/:id/instore" element={<InStore />} />
                <Route path="/list/:id/done" element={<TripSummary />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Device>
          </div>
        </div>
      </HashRouter>
    </Store>
  );
}
