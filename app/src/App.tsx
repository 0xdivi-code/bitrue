import React, { useEffect } from 'react';
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
import FuturesPage from './pages/FuturesPage';
import BuyCryptoPage from './pages/BuyCryptoPage';
import { LoginPage, SignupPage } from './pages/AuthPages';
import PlaceholderPage from './pages/PlaceholderPage';
import NotFoundPage from './pages/NotFoundPage';

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
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/trade/:pair" element={<SpotTradingPage />} />
                <Route path="/futures" element={<FuturesPage />} />
                <Route path="/futures/:pair" element={<FuturesPage />} />
                <Route path="/buy-usdt" element={<BuyCryptoPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot" element={<LoginPage />} />
                <Route path="/download" element={<PlaceholderPage />} />
                <Route path="/placeholder/:slug" element={<PlaceholderPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
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
