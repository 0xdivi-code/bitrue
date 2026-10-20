import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);

// Warm the heavy vendor bundle + primary catalogs during idle time so the
// first visit to a trading terminal paints instantly.
const preload = () => {
  void import('./services/ccxtBundle')
    .then(() => import('./services/marketDataService'))
    .then(({ pairMarketStore }) => {
      void pairMarketStore.getCatalog('binance', 'spot');
      void pairMarketStore.getCatalog('binance', 'swap');
    })
    .catch(() => undefined);
};
const idle = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void }).requestIdleCallback;
if (typeof idle === 'function') {
  idle(preload, { timeout: 2500 });
} else {
  window.setTimeout(preload, 1200);
}
