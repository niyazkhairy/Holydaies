import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Store } from './store';
import { Device } from './components/Chrome';
import Lists from './screens/Lists';
import ListDetail from './screens/ListDetail';
import InStore from './screens/InStore';
import TripSummary from './screens/TripSummary';

export default function App() {
  return (
    <Store>
      <HashRouter>
        <div className="stage">
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
