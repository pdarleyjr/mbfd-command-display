import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Style layers: tokens (vars) → Tailwind → command-glass + layout primitives.
import '@/styles/tokens.css';
import './index.css';
import '@/styles/command-glass.css';
import '@/styles/layout.css';

import { App } from '@/app/App';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
