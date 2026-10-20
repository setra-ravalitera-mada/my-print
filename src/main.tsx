import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initLiquidGlassInteractions } from './services/liquidInteractions';
import { LiquidToastProvider } from './components/liquid/LiquidGlassToast';

// Initialisation globale des reflets optiques Liquid Glass
initLiquidGlassInteractions();

createRoot(document.getElementById('root')!).render(
  <LiquidToastProvider>
    <App />
  </LiquidToastProvider>
);
