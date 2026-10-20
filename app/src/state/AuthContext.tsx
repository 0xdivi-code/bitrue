/**
 * Simulated authentication. Credentials are validated for shape only and are
 * NEVER transmitted, stored, or logged. Session state lives in memory plus a
 * flag in sessionStorage so a refresh keeps the demo logged in.
 */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { AccountState, Balance } from '../types/domain';

const SESSION_KEY = 'bityaris.demo.session';

const DEFAULT_BALANCES: Balance[] = [
  { symbol: 'USDT', available: 12500, locked: 0 },
  { symbol: 'XRP', available: 4200, locked: 0 },
  { symbol: 'BTC', available: 0.184, locked: 0 },
  { symbol: 'ETH', available: 2.42, locked: 0 },
  { symbol: 'SOL', available: 36.5, locked: 0 },
  { symbol: 'DOGE', available: 18400, locked: 0 },
];

interface AuthContextValue {
  account: AccountState;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  register: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  adjustBalance: (symbol: string, delta: number, from?: 'available' | 'locked') => void;
  lockBalance: (symbol: string, amount: number, lock: boolean) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): string | null {
  try {
    return window.sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const initialEmail = readSession();
  const [account, setAccount] = useState<AccountState>({
    loggedIn: Boolean(initialEmail),
    email: initialEmail,
    demoMode: true,
    balances: DEFAULT_BALANCES.map((b) => ({ ...b })),
  });

  const login = useCallback((email: string, password: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: 'Enter a valid email address' };
    if (password.length < 8) return { ok: false, error: 'Password must be at least 8 characters' };
    setAccount((a) => ({ ...a, loggedIn: true, email }));
    try {
      window.sessionStorage.setItem(SESSION_KEY, email);
    } catch {
      /* noop */
    }
    return { ok: true };
  }, []);

  const register = useCallback((email: string, password: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: 'Enter a valid email address' };
    if (password.length < 8) return { ok: false, error: 'Password must be at least 8 characters' };
    setAccount((a) => ({ ...a, loggedIn: true, email }));
    try {
      window.sessionStorage.setItem(SESSION_KEY, email);
    } catch {
      /* noop */
    }
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    setAccount((a) => ({ ...a, loggedIn: false, email: null }));
    try {
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* noop */
    }
  }, []);

  const adjustBalance = useCallback((symbol: string, delta: number, from: 'available' | 'locked' = 'available') => {
    setAccount((a) => ({
      ...a,
      balances: a.balances.map((b) =>
        b.symbol === symbol ? { ...b, [from]: Math.max(0, round8(b[from] + delta)) } : b,
      ),
    }));
  }, []);

  const lockBalance = useCallback((symbol: string, amount: number, lock: boolean): boolean => {
    let ok = true;
    setAccount((a) => {
      const balances = a.balances.map((b) => {
        if (b.symbol !== symbol) return b;
        if (lock) {
          if (b.available < amount - 1e-9) {
            ok = false;
            return b;
          }
          return { ...b, available: round8(b.available - amount), locked: round8(b.locked + amount) };
        }
        return { ...b, available: round8(b.available + amount), locked: round8(Math.max(0, b.locked - amount)) };
      });
      return { ...a, balances };
    });
    return ok;
  }, []);

  const value = useMemo(
    () => ({ account, login, register, logout, adjustBalance, lockBalance }),
    [account, login, register, logout, adjustBalance, lockBalance],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function round8(v: number): number {
  return Math.round(v * 1e8) / 1e8;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside provider');
  return ctx;
}
