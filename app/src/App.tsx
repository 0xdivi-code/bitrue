import React, { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Toasts } from './components/layout/Toasts';
import { SupportWidget } from './components/layout/SupportWidget';
import { ModalHost } from './components/modals/ModalHost';
import { AuthProvider } from './state/AuthContext';
import { OrdersProvider } from './state/OrdersContext';
import { UiProvider } from './state/UiContext';
import HomePage from './pages/HomePage';
import SpotTradingPage from './pages/SpotTradingPage';

// secondary pages load on demand to keep the first paint small
const FuturesPage = lazy(() => import('./pages/FuturesPage'));
const BuyCryptoPage = lazy(() => import('./pages/BuyCryptoPage'));
const AuthPages = lazy(() =>
  import('./pages/AuthPages').then((m) => ({ default: m.LoginPage })),
);
const SignupPage = lazy(() =>
  import('./pages/AuthPages').then((m) => ({ default: m.SignupPage })),
);
const PlaceholderPage = lazy(() => import('./pages/PlaceholderPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function PageFallback(): React.ReactElement {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-night-900">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-night-500 border-t-accent" aria-label="Loading page" />
    </div>
  );
}

function ScrollToTop(): null {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

export default function App(): React.ReactElement {
  return (
    <UiProvider>
      <AuthProvider>
        <OrdersProvider>
          <ScrollToTop />
          <div className="flex min-h-full flex-col bg-night-900">
            <Header />
            <main className="flex-1">
              <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/trade/:pair" element={<SpotTradingPage />} />
                <Route path="/futures" element={<FuturesPage />} />
                <Route path="/futures/:pair" element={<FuturesPage />} />
                <Route path="/buy-usdt" element={<BuyCryptoPage />} />
                <Route path="/login" element={<AuthPages />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot" element={<AuthPages />} />
                <Route path="/download" element={<PlaceholderPage />} />
                <Route path="/placeholder/:slug" element={<PlaceholderPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
          <ModalHost />
          <Toasts />
          <SupportWidget />
        </OrdersProvider>
      </AuthProvider>
    </UiProvider>
  );
}
