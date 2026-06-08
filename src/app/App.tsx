import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryProvider } from '@/providers/QueryProvider';
import { CommandOverview } from './routes/CommandOverview';
import { StationView } from './routes/StationView';

export function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CommandOverview />} />
          <Route path="/station/:number" element={<StationView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryProvider>
  );
}
