import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Store } from './store';
import { Device } from './components/Chrome';
import Lists from './screens/Lists';
import ListDetail from './screens/ListDetail';
import InStore from './screens/InStore';
import TripSummary from './screens/TripSummary';

const H = 932, BEZEL = 26, PAD = 32;

/**
 * The phone keeps 1:1 pixels — scaling by a fractional factor resamples every
 * glyph and image, which is what made the earlier build look soft. When the
 * viewport is short the shell simply gets shorter and scrolls internally.
 */
function useDeviceHeight() {
  const [h, setH] = useState(H);
  useEffect(() => {
    const fit = () => setH(Math.max(560, Math.min(H, window.innerHeight - BEZEL - PAD)));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  return h;
}

export default function App() {
  const h = useDeviceHeight();
  return (
    <Store>
      <HashRouter>
        <div className="stage" style={{ ['--device-h' as string]: `${h}px` }}>
          <Device>
            <Routes>
              <Route path="/" element={<Lists />} />
              <Route path="/list/:id" element={<ListDetail />} />
              <Route path="/list/:id/instore" element={<InStore />} />
              <Route path="/list/:id/done" element={<TripSummary />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Device>
        </div>
      </HashRouter>
    </Store>
  );
}
