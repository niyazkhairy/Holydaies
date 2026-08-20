import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Store } from './store';
import { Device } from './components/Chrome';
import Lists from './screens/Lists';
import ListDetail from './screens/ListDetail';
import InStore from './screens/InStore';
import TripSummary from './screens/TripSummary';

const W = 430, H = 932, BEZEL = 26, PAD = 24;

/** Largest whole-device scale that fits the viewport (never upscales). */
function useFitScale() {
  const [k, setK] = useState(1);
  useEffect(() => {
    const fit = () => setK(Math.min(1,
      (window.innerWidth  - PAD) / (W + BEZEL),
      (window.innerHeight - PAD) / (H + BEZEL)));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
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
            <div style={{ transform: `scale(${k})`, transformOrigin: 'top left', width: W, height: H }}>
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
          </div>
        </div>
      </HashRouter>
    </Store>
  );
}
