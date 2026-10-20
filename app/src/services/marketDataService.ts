/**
 * Centralized market-data store, keyed by "<exchange>|<marketType>|<pair>".
 *
 * - Prefers the user-selected exchange, fails over to other CCXT venues.
 * - One stream per key, reference-counted, fanned out to subscribers.
 * - Catalog + funding metadata cached per venue/market-type.
 * - Falls back to the deterministic simulated engine ONLY when every live
 *   venue fails, and labels the state `simulated` (never silently live).
 * - Keeps the last successful snapshot during outages (state `stale`).
 */
import type {
  Candle,
  CandleInterval,
  DataSourceState,
  ExchangeId,
  FundingInfo,
  InstrumentMeta,
  OrderBook,
  PairMarketState,
  PairTicker,
  TradeTick,
} from '../types/marketDataTypes';
import { mkKey, splitKey } from '../types/marketDataTypes';
import { exchangeAdapters, intervalMs, type ExchangeAdapter } from './exchangeAdapters';
import {
  simulatedCandles,
  simulatedOrderBook,
  simulatedPrice,
  simulatedTicker,
  simulatedTrades,
} from './simulatedMarket';

type Listener = (state: PairMarketState) => void;

const EMPTY_STATE = (key: string): PairMarketState => ({
  key,
  pair: splitKey(key).pair,
  ticker: null,
  candles: {},
  orderBook: null,
  trades: [],
  funding: null,
  instrument: null,
  source: '—',
  state: 'loading',
  fetchedAt: 0,
  lastSuccessAt: null,
});

class PairMarketStore {
  private states = new Map<string, PairMarketState>();
  private listeners = new Map<string, Set<Listener>>();
  private streams = new Map<string, () => void>();
  private pollers = new Map<string, number>();
  private simTimers = new Map<string, number>();
  private adapterHealth = new Map<string, number>();
  private unsupported = new Map<string, Set<string>>();
  private activeAdapter: ExchangeAdapter | null = null;
  private preferredExchange: ExchangeId = 'binance';
  refCount = new Map<string, number>();

  /* ---------------------------- configuration ---------------------------- */

  setPreferredExchange(ex: ExchangeId): void {
    this.preferredExchange = ex;
  }
  getPreferredExchange(): ExchangeId {
    return this.preferredExchange;
  }
  defaultKey(pair: string, marketType: 'spot' | 'swap' = 'spot'): string {
    return mkKey(this.preferredExchange, marketType, pair);
  }

  /* ------------------------------ catalog ------------------------------- */

  async getCatalog(exchange: ExchangeId, marketType: 'spot' | 'swap'): Promise<InstrumentMeta[]> {
    const adapter = exchangeAdapters.find((a) => a.id === exchange);
    if (!adapter) return [];
    try {
      return await adapter.getCatalog(marketType);
    } catch (err) {
      this.noteFailure(adapter, err, mkKey(exchange, marketType, '*'));
      return [];
    }
  }

  /* -------------------------------- store -------------------------------- */

  getState(key: string): PairMarketState {
    let s = this.states.get(key);
    if (!s) {
      s = EMPTY_STATE(key);
      this.states.set(key, s);
    }
    return s;
  }

  subscribe(key: string, cb: Listener): () => void {
    let set = this.listeners.get(key);
    if (!set) {
      set = new Set();
      this.listeners.set(key, set);
    }
    set.add(cb);
    cb(this.getState(key));
    return () => {
      set!.delete(cb);
    };
  }

  private emit(key: string): void {
    const s = this.getState(key);
    this.listeners.get(key)?.forEach((cb) => cb(s));
  }

  private patch(key: string, patch: Partial<PairMarketState>): void {
    const s = this.getState(key);
    this.states.set(key, { ...s, ...patch });
    this.emit(key);
  }

  retain(key: string): () => void {
    const n = (this.refCount.get(key) ?? 0) + 1;
    this.refCount.set(key, n);
    if (n === 1) this.activate(key);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const left = (this.refCount.get(key) ?? 1) - 1;
      this.refCount.set(key, Math.max(0, left));
      if (left <= 0) this.deactivate(key);
    };
  }

  /* --------------------------- adapter selection -------------------------- */

  private healthyAdapters(key: string): ExchangeAdapter[] {
    const { exchange, marketType, pair } = splitKey(key);
    const now = Date.now();
    const ok = exchangeAdapters.filter(
      (a) =>
        a.supports(pair, marketType) &&
        (this.adapterHealth.get(a.id) ?? 0) < now &&
        !(this.unsupported.get(a.id)?.has(key) ?? false),
    );
    ok.sort((a, b) => (a.id === exchange ? -1 : b.id === exchange ? 1 : a.id === this.preferredExchange ? -1 : 0));
    return ok;
  }

  private markFailed(adapter: ExchangeAdapter, cooldownMs = 60_000): void {
    this.adapterHealth.set(adapter.id, Date.now() + cooldownMs);
    if (this.activeAdapter?.id === adapter.id) this.activeAdapter = null;
  }

  private noteFailure(adapter: ExchangeAdapter, err: unknown, key: string): void {
    const msg = err instanceof Error ? err.message : String(err);
    const m = /HTTP (\d+)|(\b400\b|\b404\b|\b429\b|\b451\b)/.exec(msg);
    const status = m?.[1] ? Number(m[1]) : 0;
    const low = msg.toLowerCase();
    if (status === 400 || status === 404 || low.includes('no binance market') || low.includes('bad symbol') || low.includes('invalid symbol')) {
      const set = this.unsupported.get(adapter.id) ?? new Set<string>();
      set.add(key);
      this.unsupported.set(adapter.id, set);
    } else if (status === 429 || low.includes('rate limit')) {
      this.markFailed(adapter, 60_000);
    } else {
      this.markFailed(adapter, 45_000);
    }
  }

  /* ------------------------------- lifecycle ------------------------------ */

  private activate(key: string): void {
    void this.loadSnapshot(key);
    const candidates = this.healthyAdapters(key);
    const adapter = candidates[0] ?? null;

    if (adapter) {
      this.activeAdapter = adapter;
      adapter.connect(key, {
        onTicker: (t) => this.applyTicker(key, t, adapter.id),
        onBook: (b) =>
          this.patch(key, { orderBook: b, state: 'live', source: adapter.id, lastSuccessAt: Date.now() }),
        onTrade: (t) => {
          const s = this.getState(key);
          this.patch(key, { trades: [t, ...s.trades].slice(0, 60), state: 'live', source: adapter.id });
        },
      });
      this.streams.set(key, () => undefined);
      const poll = window.setInterval(() => {
        void this.refreshCandles(key, adapter);
        if (splitKey(key).marketType === 'swap') void this.refreshFunding(key, adapter);
      }, 30_000);
      this.pollers.set(key, poll);
    } else {
      this.startSimulated(key);
    }
  }

  private deactivate(key: string): void {
    this.streams.get(key)?.();
    this.streams.delete(key);
    const poll = this.pollers.get(key);
    if (poll) window.clearInterval(poll);
    this.pollers.delete(key);
    const sim = this.simTimers.get(key);
    if (sim) window.clearInterval(sim);
    this.simTimers.delete(key);
  }

  private applyTicker(key: string, t: PairTicker, source: string): void {
    const s = this.getState(key);
    this.states.set(key, { ...s, ticker: t, state: 'live', source, fetchedAt: Date.now(), lastSuccessAt: Date.now() });
    this.emit(key);
  }

  async loadSnapshot(key: string, interval: CandleInterval = '1d'): Promise<void> {
    const { pair } = splitKey(key);
    for (const adapter of this.healthyAdapters(key)) {
      try {
        const [ticker, book, trades, candles, funding, catalog] = await Promise.all([
          adapter.getTicker(key),
          adapter.getOrderBook(key, 20),
          adapter.getTrades(key, 40),
          adapter.getKlines(key, interval, 300),
          adapter.getFundingInfo(key),
          adapter.getCatalog(splitKey(key).marketType).catch(() => []),
        ]);
        this.activeAdapter = adapter;
        this.patch(key, {
          ticker,
          orderBook: book,
          trades,
          candles: { ...this.getState(key).candles, [interval]: candles },
          funding,
          instrument: catalog.find((c) => c.pair === pair) ?? this.getState(key).instrument,
          source: adapter.id,
          state: 'live',
          fetchedAt: Date.now(),
          lastSuccessAt: Date.now(),
          error: undefined,
        });
        return;
      } catch (err) {
        this.noteFailure(adapter, err, key);
      }
    }
    const prev = this.getState(key);
    if (prev.lastSuccessAt) {
      this.patch(key, { state: 'stale', error: 'Live venues unreachable — showing last snapshot + simulated ticks' });
      this.startSimulatedOverlay(key);
    } else {
      this.patch(key, {
        ticker: simulatedTicker(pair),
        candles: { [interval]: simulatedCandles(pair, interval, 300) },
        orderBook: simulatedOrderBook(pair),
        trades: simulatedTrades(pair),
        funding: null,
        source: 'simulated',
        state: 'simulated',
        fetchedAt: Date.now(),
        error: 'Live venues unreachable — simulated data',
      });
      this.startSimulated(key);
    }
  }

  async refreshCandles(key: string, adapter: ExchangeAdapter, interval: CandleInterval = '1d'): Promise<void> {
    try {
      const candles = await adapter.getKlines(key, interval, 300);
      this.patch(key, { candles: { ...this.getState(key).candles, [interval]: candles } });
    } catch (err) {
      this.noteFailure(adapter, err, key);
    }
  }

  async refreshFunding(key: string, adapter: ExchangeAdapter): Promise<void> {
    try {
      const funding = await adapter.getFundingInfo(key);
      if (funding) this.patch(key, { funding });
    } catch {
      /* funding is best-effort */
    }
  }

  async getCandles(key: string, interval: CandleInterval, limit = 300): Promise<Candle[]> {
    const cached = this.getState(key).candles[interval];
    if (cached?.length) return cached;
    const adapter = this.activeAdapter ?? this.healthyAdapters(key)[0];
    if (adapter) {
      try {
        const candles = await adapter.getKlines(key, interval, limit);
        this.patch(key, { candles: { ...this.getState(key).candles, [interval]: candles } });
        return candles;
      } catch (err) {
        this.noteFailure(adapter, err, key);
      }
    }
    const { pair } = splitKey(key);
    const candles = simulatedCandles(pair, interval, limit);
    this.patch(key, { candles: { ...this.getState(key).candles, [interval]: candles } });
    return candles;
  }

  /* ------------------------------ simulated ------------------------------ */

  private startSimulated(key: string): void {
    if (this.simTimers.has(key)) return;
    const { pair } = splitKey(key);
    const tick = () => {
      simulatedPrice(pair);
      const s = this.getState(key);
      const book = simulatedOrderBook(pair);
      const mid = book.bids[0]?.price ?? 0;
      const trade = simulatedTrades(pair, 1)[0];
      this.states.set(key, {
        ...s,
        ticker: { ...simulatedTicker(pair), last: mid || s.ticker?.last || 0 },
        orderBook: book,
        trades: [trade, ...s.trades].slice(0, 60),
        source: 'simulated',
        state: s.lastSuccessAt ? 'stale' : 'simulated',
        fetchedAt: Date.now(),
      });
      this.emit(key);
    };
    tick();
    this.simTimers.set(key, window.setInterval(tick, 1500));
  }

  private startSimulatedOverlay(key: string): void {
    if (this.simTimers.has(key)) return;
    const { pair } = splitKey(key);
    const timer = window.setInterval(() => {
      const s = this.getState(key);
      this.states.set(key, {
        ...s,
        orderBook: simulatedOrderBook(pair),
        trades: [simulatedTrades(pair, 1)[0], ...s.trades].slice(0, 60),
      });
      this.emit(key);
    }, 2000);
    this.simTimers.set(key, timer);
  }

  async refresh(key: string): Promise<void> {
    this.adapterHealth.clear();
    await this.loadSnapshot(key);
  }

  describe(state: PairMarketState): { label: string; state: DataSourceState } {
    const { exchange, marketType } = splitKey(state.key);
    const venue = `${exchange}${marketType === 'swap' ? ' perp' : ''}`;
    if (state.state === 'live') return { label: `Live · ${state.source} · ${venue}`, state: 'live' };
    if (state.state === 'stale') return { label: `Stale · ${venue}`, state: 'stale' };
    if (state.state === 'simulated') return { label: `Simulated · ${venue}`, state: 'simulated' };
    if (state.state === 'loading') return { label: 'Loading…', state: 'loading' };
    return { label: 'Error', state: 'error' };
  }
}

export const pairMarketStore = new PairMarketStore();
export { intervalMs, mkKey, splitKey };
export type { FundingInfo, OrderBook, TradeTick };
