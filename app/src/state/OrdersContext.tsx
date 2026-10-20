/**
 * Simulated order engine.
 *
 * Orders exist purely in React state (+sessionStorage). Limit orders fill
 * when the pair's live/simulated last price crosses the limit price; market
 * orders fill immediately at the last price with a tiny simulated slippage.
 * Every order carries `simulated: true` and the UI labels all fills as demo
 * executions with no financial effect.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Order, OrderSide, OrderType } from '../types/domain';
import { pairMarketStore } from '../services/marketDataService';
import { useAuth } from './AuthContext';
import { useUi } from './UiContext';

export interface NewOrderInput {
  pair: string;
  /** composite market-data key "<exchange>|<marketType>|<pair>" */
  storeKey: string;
  venueLabel?: string;
  side: OrderSide;
  type: OrderType;
  price?: number;
  triggerPrice?: number;
  amount: number;
  total?: number;
  tpSl?: { tp?: number; sl?: number };
  market?: 'spot' | 'futures';
}

interface OrdersContextValue {
  openOrders: Order[];
  history: Order[];
  placeOrder: (input: NewOrderInput) => { ok: boolean; error?: string; order?: Order };
  cancelOrder: (id: string) => void;
  clearHistory: () => void;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

let idSeq = 1;
const nextId = () => `sim-${Date.now().toString(36)}-${idSeq++}`;

export function OrdersProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const { account, adjustBalance, lockBalance } = useAuth();
  const { pushToast } = useUi();
  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [history, setHistory] = useState<Order[]>([]);
  const openRef = useRef<Order[]>([]);
  openRef.current = openOrders;

  const placeOrder = useCallback(
    (input: NewOrderInput): { ok: boolean; error?: string; order?: Order } => {
      if (!account.loggedIn) return { ok: false, error: 'auth-required' };
      if (!Number.isFinite(input.amount) || input.amount <= 0) return { ok: false, error: 'Enter a valid amount' };
      const [base, quote] = input.pair.toUpperCase().split('_');
      const ticker = pairMarketStore.getState(input.storeKey).ticker;
      const last = ticker?.last ?? 0;

      if (input.type === 'limit' && (!input.price || input.price <= 0))
        return { ok: false, error: 'Enter a limit price' };
      if (input.type === 'trigger' && (!input.triggerPrice || input.triggerPrice <= 0))
        return { ok: false, error: 'Enter a trigger price' };
      if (input.type === 'trigger' && (!input.price || input.price <= 0))
        return { ok: false, error: 'Enter a limit price for the triggered order' };

      // reserve quote (buy) or base (sell)
      const reserveSymbol = input.side === 'buy' ? quote : base;
      const reserveAmount =
        input.side === 'buy'
          ? (input.type === 'market' ? last * input.amount : (input.price ?? 0) * input.amount)
          : input.amount;
      if (reserveAmount > 0 && !lockBalance(reserveSymbol, reserveAmount, true)) {
        return { ok: false, error: `Insufficient ${reserveSymbol} balance (simulated account)` };
      }

      const order: Order = {
        id: nextId(),
        pair: input.pair,
        storeKey: input.storeKey,
        side: input.side,
        type: input.type,
        price: input.price,
        triggerPrice: input.triggerPrice,
        amount: input.amount,
        filledAmount: 0,
        total: input.total,
        status: 'open',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tpSl: input.tpSl,
        market: input.market ?? 'spot',
        venueLabel: input.venueLabel,
        simulated: true,
      };

      if (input.type === 'market') {
        const fillPrice = last * (input.side === 'buy' ? 1.0004 : 0.9996) || input.price || 1;
        order.status = 'filled';
        order.filledAmount = input.amount;
        order.filledAvgPrice = fillPrice;
        order.updatedAt = Date.now();
        settle(order, lockBalance, adjustBalance);
        setHistory((h) => [order, ...h].slice(0, 200));
        pushToast({
          tone: 'success',
          title: `Simulated ${input.side} filled`,
          body: `${input.amount} ${base} @ ${fillPrice.toFixed(6)} ${quote} — demo execution, no real funds.`,
        });
        return { ok: true, order };
      }

      setOpenOrders((o) => [order, ...o]);
      pushToast({
        tone: 'info',
        title: input.type === 'trigger' ? 'Simulated trigger order placed' : 'Simulated limit order placed',
        body: `${input.side} ${input.amount} ${base} — demo order, no real funds.`,
      });
      return { ok: true, order };
    },
    [account.loggedIn, adjustBalance, lockBalance, pushToast],
  );

  const cancelOrder = useCallback(
    (id: string) => {
      const order = openRef.current.find((o) => o.id === id);
      if (!order) return;
      const [base, quote] = order.pair.toUpperCase().split('_');
      const symbol = order.side === 'buy' ? quote : base;
      const reserved =
        order.side === 'buy'
          ? (order.price ?? 0) * (order.amount - order.filledAmount)
          : order.amount - order.filledAmount;
      lockBalance(symbol, reserved, false);
      const canceled: Order = { ...order, status: 'canceled', updatedAt: Date.now() };
      setOpenOrders((o) => o.filter((x) => x.id !== id));
      setHistory((h) => [canceled, ...h].slice(0, 200));
      pushToast({ tone: 'info', title: 'Order canceled', body: `Simulated order ${id} removed.` });
    },
    [lockBalance, pushToast],
  );

  const clearHistory = useCallback(() => setHistory([]), []);

  // ---------------- simulated matching loop ----------------
  useEffect(() => {
    const timer = window.setInterval(() => {
      const orders = openRef.current;
      if (!orders.length) return;
      const prices = new Map<string, number>();
      orders.forEach((o) => {
        const k = o.storeKey ?? `binance|spot|${o.pair}`;
        if (!prices.has(o.id)) prices.set(o.id, pairMarketStore.getState(k).ticker?.last ?? 0);
      });
      const filled: Order[] = [];
      const triggered: Order[] = [];
      orders.forEach((o) => {
        const last = prices.get(o.id) ?? 0;
        if (!last) return;
        if (o.type === 'trigger') {
          const crossed =
            o.side === 'buy' ? last >= (o.triggerPrice ?? Infinity) : last <= (o.triggerPrice ?? 0);
          if (crossed) triggered.push(o);
          return;
        }
        if (o.type === 'limit') {
          const hits = o.side === 'buy' ? last <= (o.price ?? 0) : last >= (o.price ?? 0);
          if (hits) filled.push(o);
        }
      });
      if (!filled.length && !triggered.length) return;

      setOpenOrders((current) => {
        const remain: Order[] = [];
        current.forEach((o) => {
          const f = filled.find((x) => x.id === o.id);
          const t = triggered.find((x) => x.id === o.id);
          if (f) {
            const done: Order = {
              ...o,
              status: 'filled',
              filledAmount: o.amount,
              filledAvgPrice: o.price,
              updatedAt: Date.now(),
            };
            settle(done, lockBalance, adjustBalance);
            setHistory((h) => [done, ...h].slice(0, 200));
            pushToast({
              tone: 'success',
              title: 'Simulated order filled',
              body: `${o.side} ${o.amount} ${o.pair.toUpperCase().replace('_', '/')} @ ${o.price} — demo execution (no order sent to ${o.venueLabel ?? 'any venue'}).`,
            });
          } else if (t) {
            remain.push({ ...o, status: 'triggered', updatedAt: Date.now() });
            pushToast({
              tone: 'info',
              title: 'Trigger price reached',
              body: `Simulated trigger order ${o.id} activated (demo).`,
            });
          } else {
            remain.push(o);
          }
        });
        return remain;
      });
    }, 1500);
    return () => window.clearInterval(timer);
  }, [adjustBalance, lockBalance, pushToast]);

  const value = useMemo(
    () => ({ openOrders, history, placeOrder, cancelOrder, clearHistory }),
    [openOrders, history, placeOrder, cancelOrder, clearHistory],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

/** Moves locked funds on fill: buy spends quote, sell spends base. */
function settle(
  order: Order,
  lockBalance: (s: string, a: number, l: boolean) => boolean,
  adjustBalance: (s: string, d: number, from?: 'available' | 'locked') => void,
): void {
  const [base, quote] = order.pair.toUpperCase().split('_');
  const price = order.filledAvgPrice ?? order.price ?? 0;
  if (order.side === 'buy') {
    lockBalance(quote, price * order.filledAmount, false); // release reservation
    adjustBalance(base, order.filledAmount, 'available');
  } else {
    lockBalance(base, order.filledAmount, false);
    adjustBalance(quote, price * order.filledAmount, 'available');
  }
}

export function useOrders(): OrdersContextValue {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders outside provider');
  return ctx;
}
