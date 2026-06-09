import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryProvider } from '@/providers/QueryProvider';
import { CommandOverview } from './routes/CommandOverview';
import { StationView } from './routes/StationView';

export function App() {
  return (
    <QueryProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<CommandOverview />} />
          <Route path="/stations/:number" element={<StationView />} />
          <Route path="/station/:number" element={<LegacyStationRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryProvider>
  );
}

function LegacyStationRedirect() {
  const number = window.location.pathname.split('/').filter(Boolean).pop();
  return <Navigate to={number ? `/stations/${number}` : '/'} replace />;
}
