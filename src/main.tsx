import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Self-hosted fonts (offline-safe; bundled by Vite, no CDN/CSP dependency).
import '@fontsource/saira/500.css';
import '@fontsource/saira/600.css';
import '@fontsource/saira/700.css';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans/700.css';
import '@fontsource/ibm-plex-mono/500.css';

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
