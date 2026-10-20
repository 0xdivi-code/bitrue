/**
 * CCXT-powered exchange adapters (Binance, Bybit, OKX) for public market data.
 *
 * - REST via the unified CCXT API: markets catalog, tickers, order books,
 *   trades, OHLCV and (where supported) perpetual funding/mark/index prices.
 * - Live streams via CCXT Pro watch* methods (free, part of the ccxt package),
 *   which implement each exchange's documented snapshot + incremental
 *   order-book sync and auto-reconnection internally.
 * - Rate limits respected through ccxt's built-in throttling
 *   (`enableRateLimit: true`).
 *
 * The library is loaded with a dynamic import so the heavy vendor bundle is
 * code-split away from the initial page load.
 */
import type {
  Candle,
  CandleInterval,
  ExchangeId,
  FundingInfo,
  InstrumentMeta,
  MarketType,
  OrderBook,
  PairTicker,
  TradeTick,
} from '../types/marketDataTypes';
import { splitKey } from '../types/marketDataTypes';
import type { ExchangeAdapter, StreamHandlers } from './adapterTypes';

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyExchange = any;

interface CcxtBundle {
  venues: Record<string, AnyExchange>;
  proVenues: Record<string, AnyExchange>;
}

let bundlePromise: Promise<CcxtBundle> | null = null;

async function loadCcxt(): Promise<CcxtBundle> {
  if (!bundlePromise) {
    bundlePromise = import('./ccxtBundle').then((m) => ({
      venues: m.venues as Record<string, AnyExchange>,
      proVenues: m.proVenues as Record<string, AnyExchange>,
    }));
  }
  return bundlePromise;
}

const TF: Record<CandleInterval, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
  '1w': '1w',
};

const LABELS: Record<ExchangeId, string> = {
  binance: 'Binance',
  bybit: 'Bybit',
  okx: 'OKX',
};

export class CcxtAdapter implements ExchangeAdapter {
  readonly id: ExchangeId;
  readonly label: string;
  private rest: AnyExchange | null = null;
  private pro: AnyExchange | null = null;
  private catalogs = new Map<MarketType, InstrumentMeta[]>();
  private symbolIndex = new Map<string, InstrumentMeta>(); // `${mtype}|${pair}`

  constructor(id: ExchangeId) {
    this.id = id;
    this.label = LABELS[id];
  }

  private async restClient(): Promise<AnyExchange> {
    if (this.rest) return this.rest;
    const mod = await loadCcxt();
    const Ctor = mod.venues[this.id];
    if (!Ctor) throw new Error(`${this.id}: venue bundle missing`);
    this.rest = new Ctor({ enableRateLimit: true, timeout: 12_000 });
    return this.rest;
  }

  private async proClient(): Promise<AnyExchange> {
    if (this.pro) return this.pro;
    const mod = await loadCcxt();
    const Ctor = mod.proVenues[this.id];
    if (!Ctor) throw new Error(`${this.id}: CCXT Pro streams unavailable`);
    this.pro = new Ctor({ enableRateLimit: true });
    return this.pro;
  }

  /* ------------------------------ catalog ------------------------------ */

  async getCatalog(marketType: MarketType): Promise<InstrumentMeta[]> {
    const cached = this.catalogs.get(marketType);
    if (cached) return cached;
    const ex = await this.restClient();
    const markets = (await ex.loadMarkets(true)) as Record<string, AnyExchange>;
    const out: InstrumentMeta[] = [];
    for (const symbol of Object.keys(markets)) {
      const m = markets[symbol];
      const kind: string = m.type ?? '';
      const spot = kind === 'spot' && m.spot === true;
      const linearPerp = kind === 'swap' && m.swap === true && m.linear === true;
      if (marketType === 'spot' ? !spot : !linearPerp) continue;
      const quote: string = m.quote ?? '';
      if (marketType === 'swap' && !['USDT', 'USDC'].includes(quote)) continue;
      if (marketType === 'spot' && !['USDT', 'USDC', 'USD', 'EUR', 'BTC', 'ETH'].includes(quote)) continue;
      const base: string = m.base ?? '';
      if (!base || !quote) continue;
      const settle: string | undefined = m.settle ?? undefined;
      if (marketType === 'swap' && settle && settle !== quote) continue; // linear, quote-settled
      const meta: InstrumentMeta = {
        exchange: this.id,
        marketType,
        pair: `${base.toLowerCase()}_${quote.toLowerCase()}`,
        symbol,
        base,
        quote,
        settle,
        active: m.active !== false,
        tickSize: m.precision?.price ?? undefined,
        stepSize: m.precision?.amount ?? undefined,
        minAmount: m.limits?.amount?.min ?? undefined,
        minCost: m.limits?.cost?.min ?? undefined,
        contractSize: m.contractSize ?? undefined,
      };
      out.push(meta);
      this.symbolIndex.set(`${marketType}|${meta.pair}`, meta);
    }
    out.sort((a, b) => a.pair.localeCompare(b.pair));
    this.catalogs.set(marketType, out);
    return out;
  }

  supports(pair: string, marketType: MarketType): boolean {
    // Before the catalog loads we accept optimistically; calls fail fast and
    // the service marks the pair unsupported for this venue.
    const known = this.symbolIndex.get(`${marketType}|${pair}`);
    if (known) return known.active;
    if (this.catalogs.has(marketType)) return false;
    const [, quote] = pair.split('_');
    return marketType === 'spot' ? !!quote : ['usdt', 'usdc'].includes(quote ?? '');
  }

  private async meta(key: string): Promise<InstrumentMeta> {
    const { marketType, pair } = splitKey(key);
    const known = this.symbolIndex.get(`${marketType}|${pair}`);
    if (known) return known;
    await this.getCatalog(marketType);
    const found = this.symbolIndex.get(`${marketType}|${pair}`);
    if (!found) throw new Error(`${this.id}: no ${marketType} market for ${pair}`);
    return found;
  }

  /* ------------------------------ REST data ----------------------------- */

  async getTicker(key: string): Promise<PairTicker> {
    const m = await this.meta(key);
    const ex = await this.restClient();
    const t = await ex.fetchTicker(m.symbol);
    const { pair } = splitKey(key);
    const [base, quote] = [m.base, m.quote];
    return {
      pair,
      base,
      quote,
      last: t.last ?? t.close ?? 0,
      change24hPct: t.percentage ?? 0,
      high24h: t.high ?? 0,
      low24h: t.low ?? 0,
      baseVolume24h: t.baseVolume ?? t.volume ?? 0,
      quoteVolume24h: t.quoteVolume ?? 0,
      bid: t.bid ?? undefined,
      ask: t.ask ?? undefined,
      updatedAt: Date.now(),
    };
  }

  async getKlines(key: string, interval: CandleInterval, limit: number): Promise<Candle[]> {
    const m = await this.meta(key);
    const ex = await this.restClient();
    const raw = (await ex.fetchOHLCV(m.symbol, TF[interval], undefined, limit)) as number[][];
    return raw.map((r) => ({
      time: Math.floor(r[0] / 1000),
      open: r[1],
      high: r[2],
      low: r[3],
      close: r[4],
      volume: r[5] ?? 0,
    }));
  }

  async getOrderBook(key: string, depth: number): Promise<OrderBook> {
    const m = await this.meta(key);
    const ex = await this.restClient();
    const book = await ex.fetchOrderBook(m.symbol, depth);
    let bt = 0;
    let at = 0;
    return {
      pair: m.pair,
      bids: (book.bids as number[][]).map(([price, amount]) => {
        bt += amount;
        return { price, amount, total: bt };
      }),
      asks: (book.asks as number[][]).map(([price, amount]) => {
        at += amount;
        return { price, amount, total: at };
      }),
      updatedAt: Date.now(),
    };
  }

  async getTrades(key: string, limit: number): Promise<TradeTick[]> {
    const m = await this.meta(key);
    const ex = await this.restClient();
    const raw = (await ex.fetchTrades(m.symbol, undefined, limit)) as Array<Record<string, unknown>>;
    return raw.map((t, i) => ({
      id: String(t.id ?? `${t.timestamp}-${i}`),
      pair: m.pair,
      price: Number(t.price),
      amount: Number(t.amount),
      side: (t.side === 'sell' ? 'sell' : 'buy') as 'buy' | 'sell',
      time: Number(t.timestamp ?? Date.now()),
    }));
  }

  async getFundingInfo(key: string): Promise<FundingInfo | null> {
    const { marketType } = splitKey(key);
    if (marketType !== 'swap') return null;
    const m = await this.meta(key);
    const ex = await this.restClient();
    try {
      const f = await ex.fetchFundingRate(m.symbol);
      return {
        markPrice: f.markPrice ?? undefined,
        indexPrice: f.indexPrice ?? undefined,
        fundingRate: f.fundingRate ?? undefined,
        nextFundingTime: f.fundingTimestamp ?? undefined,
        interval: f.interval ?? undefined,
        source: this.id,
        updatedAt: Date.now(),
      };
    } catch {
      try {
        const t = await ex.fetchTicker(m.symbol);
        const info = t.info as Record<string, unknown> | undefined;
        const pick = (...names: string[]): number | undefined => {
          for (const n of names) {
            const v = info?.[n];
            if (v != null && v !== '') return Number(v);
          }
          return undefined;
        };
        return {
          markPrice: pick('markPrice', 'mark_price'),
          indexPrice: pick('indexPrice', 'index_price'),
          fundingRate: pick('lastFundingRate', 'funding_rate', 'fundingRate'),
          nextFundingTime: pick('nextFundingTime', 'funding_timestamp'),
          source: `${this.id} (ticker.info)`,
          updatedAt: Date.now(),
        };
      } catch {
        return null;
      }
    }
  }

  /* ------------------------------- streams ------------------------------ */

  connect(key: string, handlers: StreamHandlers): () => void {
    let closed = false;
    let stop: (() => void) | null = null;

    void (async () => {
      if (closed) return;
      const m = await this.meta(key);
      const pro = await this.proClient();
      if (closed) return;

      const unsubs: Array<() => void> = [];
      if (handlers.onTicker && pro.hasWatchTicker) {
        void (async () => {
          while (!closed) {
            try {
              const t = await pro.watchTicker(m.symbol);
              if (closed) break;
              handlers.onTicker?.({
                pair: m.pair,
                base: m.base,
                quote: m.quote,
                last: t.last ?? t.close ?? 0,
                change24hPct: t.percentage ?? 0,
                high24h: t.high ?? 0,
                low24h: t.low ?? 0,
                baseVolume24h: t.baseVolume ?? t.volume ?? 0,
                quoteVolume24h: t.quoteVolume ?? 0,
                bid: t.bid ?? undefined,
                ask: t.ask ?? undefined,
                updatedAt: Date.now(),
              });
            } catch {
              if (closed) break;
              await new Promise((r) => setTimeout(r, 1500));
            }
          }
        })();
      }
      if (handlers.onBook && pro.hasWatchOrderBook) {
        void (async () => {
          while (!closed) {
            try {
              const book = await pro.watchOrderBook(m.symbol, 20);
              if (closed) break;
              let bt = 0;
              let at = 0;
              handlers.onBook?.({
                pair: m.pair,
                bids: (book.bids as number[][]).slice(0, 20).map(([price, amount]) => {
                  bt += amount;
                  return { price, amount, total: bt };
                }),
                asks: (book.asks as number[][]).slice(0, 20).map(([price, amount]) => {
                  at += amount;
                  return { price, amount, total: at };
                }),
                updatedAt: Date.now(),
              });
            } catch {
              if (closed) break;
              await new Promise((r) => setTimeout(r, 1500));
            }
          }
        })();
      }
      if (handlers.onTrade && pro.hasWatchTrades) {
        void (async () => {
          while (!closed) {
            try {
              const trades = await pro.watchTrades(m.symbol);
              if (closed) break;
              for (const t of trades.slice(-5)) {
                handlers.onTrade?.({
                  id: String(t.id ?? `${t.timestamp}-${t.price}`),
                  pair: m.pair,
                  price: Number(t.price),
                  amount: Number(t.amount),
                  side: (t.side === 'sell' ? 'sell' : 'buy') as 'buy' | 'sell',
                  time: Number(t.timestamp ?? Date.now()),
                });
              }
            } catch {
              if (closed) break;
              await new Promise((r) => setTimeout(r, 1500));
            }
          }
        })();
      }

      stop = () => unsubs.forEach((u) => u());
    })().catch(() => {
      /* stream setup failed — service keeps REST polling + simulated overlay */
    });

    return () => {
      closed = true;
      stop?.();
      // CCXT Pro sockets are shared per exchange instance; closing the whole
      // client would drop other markets, so we simply stop consuming.
    };
  }
}
