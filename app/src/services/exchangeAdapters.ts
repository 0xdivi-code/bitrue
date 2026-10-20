/**
 * Venue registry. CCXT-backed adapters for Binance, Bybit and OKX (public
 * market data + CCXT Pro streams). Order of entry = default failover order;
 * the service always tries the user-selected exchange first.
 */
import { CcxtAdapter } from './ccxtAdapters';
import type { ExchangeAdapter } from './adapterTypes';

export const exchangeAdapters: ExchangeAdapter[] = [
  new CcxtAdapter('binance'),
  new CcxtAdapter('bybit'),
  new CcxtAdapter('okx'),
];

export type { ExchangeAdapter, StreamHandlers } from './adapterTypes';
export { intervalMs } from './adapterTypes';
