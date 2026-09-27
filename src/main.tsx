import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/app';
import { initMonitoring, reportError } from '@/shared/lib/monitoring';
import './index.css';

initMonitoring();

const container = document.getElementById('root');
if (!container) throw new Error('#root element missing');

createRoot(container, {
  onUncaughtError: (error) => reportError(error),
  onCaughtError: (error) => reportError(error),
}).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
