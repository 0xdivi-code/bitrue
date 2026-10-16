/**
 * Centralized pair-level market data store.
 *
 * - Picks the first healthy exchange adapter (Binance → OKX).
 * - Opens ONE stream per active pair and fans updates out to subscribers.
 * - Falls back to the simulated engine only when every live source fails,
 *   and marks the resulting state `simulated` so the UI can label it.
 * - Keeps the last successful snapshot during outages (state `stale`).
 */
import type {
  Candle,
  CandleInterval,
  DataSourceState,
  OrderBook,
  PairMarketState,
  PairTicker,
  TradeTick,
} from '../types/marketDataTypes';
import { exchangeAdapters, intervalMs, type ExchangeAdapter } from './exchangeAdapters';
import {
  simulatedCandles,
  simulatedOrderBook,
  simulatedPrice,
  simulatedTicker,
  simulatedTrades,
} from './simulatedMarket';

type Listener = (state: PairMarketState) => void;

const EMPTY_STATE = (pair: string): PairMarketState => ({
  pair,
  ticker: null,
  candles: {},
  orderBook: null,
  trades: [],
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
  private adapterHealth = new Map<string, number>(); // id → cooldown-until ts
  private unsupported = new Map<string, Set<string>>(); // adapter id → symbols it does not list
  private activeAdapter: ExchangeAdapter | null = null;
  refCount = new Map<string, number>();

  getState(pair: string): PairMarketState {
    let s = this.states.get(pair);
    if (!s) {
      s = EMPTY_STATE(pair);
      this.states.set(pair, s);
    }
    return s;
  }

  subscribe(pair: string, cb: Listener): () => void {
    let set = this.listeners.get(pair);
    if (!set) {
      set = new Set();
      this.listeners.set(pair, set);
    }
    set.add(cb);
    cb(this.getState(pair));
    return () => {
      set!.delete(cb);
    };
  }

  private emit(pair: string): void {
    const s = this.getState(pair);
    this.listeners.get(pair)?.forEach((cb) => cb(s));
  }

  private patch(pair: string, patch: Partial<PairMarketState>): void {
    const s = this.getState(pair);
    this.states.set(pair, { ...s, ...patch });
    this.emit(pair);
  }

  /** Reference-counted activation: keeps a stream alive while any view uses it. */
  retain(pair: string): () => void {
    const n = (this.refCount.get(pair) ?? 0) + 1;
    this.refCount.set(pair, n);
    if (n === 1) this.activate(pair);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const left = (this.refCount.get(pair) ?? 1) - 1;
      this.refCount.set(pair, Math.max(0, left));
      if (left <= 0) this.deactivate(pair);
    };
  }

  private healthyAdapters(pair: string): ExchangeAdapter[] {
    const now = Date.now();
    return exchangeAdapters.filter(
      (a) =>
        a.supports(pair) &&
        (this.adapterHealth.get(a.id) ?? 0) < now &&
        !(this.unsupported.get(a.id)?.has(pair) ?? false),
    );
  }

  private markFailed(adapter: ExchangeAdapter, cooldownMs = 60_000): void {
    this.adapterHealth.set(adapter.id, Date.now() + cooldownMs);
    if (this.activeAdapter?.id === adapter.id) this.activeAdapter = null;
  }

  /**
   * Distinguish "this exchange does not list the symbol" (400/404 → remember
   * per pair) from rate limits (429) and outages/geo-blocks (other → cooldown).
   */
  private noteFailure(adapter: ExchangeAdapter, err: unknown, pair: string): void {
    const msg = err instanceof Error ? err.message : String(err);
    const m = /HTTP (\d+)/.exec(msg);
    const status = m ? Number(m[1]) : 0;
    if (status === 400 || status === 404) {
      const set = this.unsupported.get(adapter.id) ?? new Set<string>();
      set.add(pair);
      this.unsupported.set(adapter.id, set);
    } else if (status === 429) {
      this.markFailed(adapter, 60_000);
    } else {
      this.markFailed(adapter, 45_000);
    }
  }

  private activate(pair: string): void {
    void this.loadSnapshot(pair);
    const candidates = this.healthyAdapters(pair);
    const adapter = this.activeAdapter && candidates.includes(this.activeAdapter)
      ? this.activeAdapter
      : candidates[0] ?? null;

    if (adapter) {
      this.activeAdapter = adapter;
      const stop = adapter.connect(pair, {
        onTicker: (t) => this.applyTicker(pair, t, adapter.id),
        onBook: (b) => this.patch(pair, { orderBook: b, state: 'live', source: adapter.id, lastSuccessAt: Date.now() }),
        onTrade: (t) => {
          const s = this.getState(pair);
          this.patch(pair, { trades: [t, ...s.trades].slice(0, 60), state: 'live', source: adapter.id });
        },
      });
      this.streams.set(pair, stop);
      // periodic candle refresh while streaming
      const poll = window.setInterval(() => void this.refreshCandles(pair, adapter), 30_000);
      this.pollers.set(pair, poll);
    } else {
      this.startSimulated(pair);
    }
  }

  private deactivate(pair: string): void {
    this.streams.get(pair)?.();
    this.streams.delete(pair);
    const poll = this.pollers.get(pair);
    if (poll) window.clearInterval(poll);
    this.pollers.delete(pair);
    const sim = this.simTimers.get(pair);
    if (sim) window.clearInterval(sim);
    this.simTimers.delete(pair);
  }

  private applyTicker(pair: string, t: PairTicker, source: string): void {
    const s = this.getState(pair);
    this.states.set(pair, {
      ...s,
      ticker: t,
      state: 'live',
      source,
      fetchedAt: Date.now(),
      lastSuccessAt: Date.now(),
    });
    this.emit(pair);
  }

  /** One-shot REST snapshot (ticker, book, trades, candles). */
  async loadSnapshot(pair: string, interval: CandleInterval = '1d'): Promise<void> {
    const candidates = this.healthyAdapters(pair);
    for (const adapter of candidates) {
      try {
        const [ticker, book, trades, candles] = await Promise.all([
          adapter.getTicker(pair),
          adapter.getOrderBook(pair, 20),
          adapter.getTrades(pair, 40),
          adapter.getKlines(pair, interval, 300),
        ]);
        this.activeAdapter = adapter;
        this.patch(pair, {
          ticker,
          orderBook: book,
          trades,
          candles: { ...this.getState(pair).candles, [interval]: candles },
          source: adapter.id,
          state: 'live',
          fetchedAt: Date.now(),
          lastSuccessAt: Date.now(),
          error: undefined,
        });
        return;
      } catch (err) {
        this.noteFailure(adapter, err, pair);
      }
    }
    // every live source failed → simulated fallback (clearly labelled)
    const prev = this.getState(pair);
    if (prev.lastSuccessAt) {
      this.patch(pair, { state: 'stale', error: 'Live exchange unreachable — showing last snapshot + simulated ticks' });
      this.startSimulatedOverlay(pair);
    } else {
      this.patch(pair, {
        ticker: simulatedTicker(pair),
        candles: { [interval]: simulatedCandles(pair, interval, 300) },
        orderBook: simulatedOrderBook(pair),
        trades: simulatedTrades(pair),
        source: 'simulated',
        state: 'simulated',
        fetchedAt: Date.now(),
        error: 'Live exchange unreachable — simulated data',
      });
      this.startSimulated(pair);
    }
  }

  async refreshCandles(pair: string, adapter: ExchangeAdapter, interval: CandleInterval = '1d'): Promise<void> {
    try {
      const candles = await adapter.getKlines(pair, interval, 300);
      this.patch(pair, { candles: { ...this.getState(pair).candles, [interval]: candles } });
    } catch {
      this.markFailed(adapter, 30_000);
    }
  }

  async getCandles(pair: string, interval: CandleInterval, limit = 300): Promise<Candle[]> {
    const cached = this.getState(pair).candles[interval];
    if (cached?.length) return cached;
    const adapter = this.activeAdapter ?? this.healthyAdapters(pair)[0];
    if (adapter) {
      try {
        const candles = await adapter.getKlines(pair, interval, limit);
        this.patch(pair, { candles: { ...this.getState(pair).candles, [interval]: candles } });
        return candles;
      } catch (err) {
        this.noteFailure(adapter, err, pair);
      }
    }
    const candles = simulatedCandles(pair, interval, limit);
    this.patch(pair, { candles: { ...this.getState(pair).candles, [interval]: candles } });
    return candles;
  }

  private startSimulated(pair: string): void {
    if (this.simTimers.has(pair)) return;
    const tick = () => {
      simulatedPrice(pair); // advance walk
      const s = this.getState(pair);
      const book = simulatedOrderBook(pair);
      const mid = book.bids[0]?.price ?? 0;
      const trade: TradeTick = simulatedTrades(pair, 1)[0];
      this.states.set(pair, {
        ...s,
        ticker: { ...simulatedTicker(pair), last: mid || s.ticker?.last || 0 },
        orderBook: book,
        trades: [trade, ...s.trades].slice(0, 60),
        source: 'simulated',
        state: s.lastSuccessAt ? 'stale' : 'simulated',
        fetchedAt: Date.now(),
      });
      this.emit(pair);
    };
    tick();
    this.simTimers.set(pair, window.setInterval(tick, 1500));
  }

  /** Keeps book/trades moving while retaining the last real ticker as "stale". */
  private startSimulatedOverlay(pair: string): void {
    if (this.simTimers.has(pair)) return;
    const timer = window.setInterval(() => {
      const s = this.getState(pair);
      const book = simulatedOrderBook(pair);
      this.states.set(pair, {
        ...s,
        orderBook: book,
        trades: [simulatedTrades(pair, 1)[0], ...s.trades].slice(0, 60),
      });
      this.emit(pair);
    }, 2000);
    this.simTimers.set(pair, timer);
  }

  /** Manual refresh used by the UI "refresh" control. */
  async refresh(pair: string): Promise<void> {
    this.adapterHealth.clear();
    await this.loadSnapshot(pair);
  }

  describe(state: PairMarketState): { label: string; state: DataSourceState } {
    if (state.state === 'live') return { label: `Live · ${state.source}`, state: 'live' };
    if (state.state === 'stale') return { label: 'Stale · last snapshot', state: 'stale' };
    if (state.state === 'simulated') return { label: 'Simulated', state: 'simulated' };
    if (state.state === 'loading') return { label: 'Loading…', state: 'loading' };
    return { label: 'Error', state: 'error' };
  }
}

export const pairMarketStore = new PairMarketStore();
export { intervalMs };
