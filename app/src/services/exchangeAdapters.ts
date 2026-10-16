/**
 * Exchange-specific market data adapters (public, key-less REST + WebSocket).
 *
 * Binance is the primary source, OKX the secondary. Both expose public market
 * endpoints that do not require API keys and allow browser CORS. When neither
 * is reachable the service layer falls back to the clearly-labelled simulated
 * engine — live data is never silently replaced.
 */
import type { Candle, CandleInterval, OrderBook, PairTicker, TradeTick } from '../types/marketDataTypes';

export interface StreamHandlers {
  onTicker?: (t: PairTicker) => void;
  onBook?: (b: OrderBook) => void;
  onTrade?: (t: TradeTick) => void;
}

export interface ExchangeAdapter {
  id: string;
  label: string;
  supports(pair: string): boolean;
  getTicker(pair: string): Promise<PairTicker>;
  getKlines(pair: string, interval: CandleInterval, limit: number): Promise<Candle[]>;
  getOrderBook(pair: string, depth: number): Promise<OrderBook>;
  getTrades(pair: string, limit: number): Promise<TradeTick[]>;
  /** Returns an unsubscribe function. */
  connect(pair: string, handlers: StreamHandlers): () => void;
}

const INTERVAL_MS: Record<CandleInterval, number> = {
  '1m': 60_000,
  '5m': 300_000,
  '15m': 900_000,
  '30m': 1_800_000,
  '1h': 3_600_000,
  '4h': 14_400_000,
  '1d': 86_400_000,
  '1w': 604_800_000,
};

export function intervalMs(i: CandleInterval): number {
  return INTERVAL_MS[i];
}

async function fetchJson(url: string, timeoutMs = 9000): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    window.clearTimeout(timer);
  }
}

function splitPair(pair: string): [string, string] {
  const [base, quote] = pair.toUpperCase().split('_');
  return [base, quote];
}

/* ------------------------------------------------------------------ */
/* Binance                                                             */
/* ------------------------------------------------------------------ */

const BINANCE_REST = 'https://api.binance.com/api/v3';
const BINANCE_WS = 'wss://stream.binance.com:9443/stream';

class BinanceAdapter implements ExchangeAdapter {
  id = 'binance';
  label = 'Binance Spot';

  supports(pair: string): boolean {
    const [base, quote] = splitPair(pair);
    return ['USDT', 'USDC', 'BTC', 'ETH', 'XRP', 'FDUSD', 'TRY', 'EUR'].includes(quote) && base.length > 0;
  }

  private symbol(pair: string): string {
    const [base, quote] = splitPair(pair);
    return `${base}${quote}`;
  }

  async getTicker(pair: string): Promise<PairTicker> {
    const sym = this.symbol(pair);
    const [base, quote] = splitPair(pair);
    const d = (await fetchJson(`${BINANCE_REST}/ticker/24hr?symbol=${sym}`)) as Record<string, string>;
    const last = parseFloat(d.lastPrice);
    return {
      pair,
      base,
      quote,
      last,
      change24hPct: parseFloat(d.priceChangePercent),
      high24h: parseFloat(d.highPrice),
      low24h: parseFloat(d.lowPrice),
      baseVolume24h: parseFloat(d.volume),
      quoteVolume24h: parseFloat(d.quoteVolume),
      bid: parseFloat(d.bidPrice),
      ask: parseFloat(d.askPrice),
      updatedAt: Date.now(),
    };
  }

  async getKlines(pair: string, interval: CandleInterval, limit: number): Promise<Candle[]> {
    const raw = (await fetchJson(
      `${BINANCE_REST}/klines?symbol=${this.symbol(pair)}&interval=${interval}&limit=${limit}`,
    )) as Array<Array<string | number>>;
    return raw.map((k) => ({
      time: Math.floor(Number(k[0]) / 1000),
      open: parseFloat(String(k[1])),
      high: parseFloat(String(k[2])),
      low: parseFloat(String(k[3])),
      close: parseFloat(String(k[4])),
      volume: parseFloat(String(k[5])),
    }));
  }

  async getOrderBook(pair: string, depth: number): Promise<OrderBook> {
    const d = (await fetchJson(`${BINANCE_REST}/depth?symbol=${this.symbol(pair)}&limit=${depth}`)) as {
      bids: string[][];
      asks: string[][];
    };
    return normalizeBook(pair, d.bids, d.asks);
  }

  async getTrades(pair: string, limit: number): Promise<TradeTick[]> {
    const raw = (await fetchJson(`${BINANCE_REST}/trades?symbol=${this.symbol(pair)}&limit=${limit}`)) as Array<
      Record<string, unknown>
    >;
    return raw
      .map((t) => ({
        id: String(t.id),
        pair,
        price: parseFloat(String(t.price)),
        amount: parseFloat(String(t.qty)),
        side: (t.isBuyerMaker ? 'sell' : 'buy') as 'buy' | 'sell',
        time: Number(t.time),
      }))
      .reverse();
  }

  connect(pair: string, h: StreamHandlers): () => void {
    const sym = this.symbol(pair).toLowerCase();
    const streams = [`${sym}@miniTicker`, `${sym}@depth20@100ms`, `${sym}@trade`].join('/');
    let ws: WebSocket | null = null;
    let closed = false;
    let retry = 0;
    const open = () => {
      if (closed) return;
      try {
        ws = new WebSocket(`${BINANCE_WS}?streams=${streams}`);
      } catch {
        return;
      }
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string) as { stream?: string; data?: Record<string, unknown> };
          const data = msg.data;
          if (!data || !msg.stream) return;
          const [base, quote] = splitPair(pair);
          if (msg.stream.endsWith('@miniTicker') && h.onTicker) {
            const last = parseFloat(String(data.c));
            const openP = parseFloat(String(data.o));
            h.onTicker({
              pair,
              base,
              quote,
              last,
              change24hPct: openP ? ((last - openP) / openP) * 100 : 0,
              high24h: parseFloat(String(data.h)),
              low24h: parseFloat(String(data.l)),
              baseVolume24h: parseFloat(String(data.v)),
              quoteVolume24h: parseFloat(String(data.q)),
              updatedAt: Date.now(),
            });
          } else if (msg.stream.includes('@depth20') && h.onBook) {
            h.onBook(
              normalizeBook(
                pair,
                (data.bids as string[][]) ?? [],
                (data.asks as string[][]) ?? [],
              ),
            );
          } else if (msg.stream.endsWith('@trade') && h.onTrade) {
            h.onTrade({
              id: String(data.t),
              pair,
              price: parseFloat(String(data.p)),
              amount: parseFloat(String(data.q)),
              side: data.m ? 'sell' : 'buy',
              time: Number(data.T),
            });
          }
        } catch {
          /* ignore malformed frame */
        }
      };
      ws.onclose = () => {
        if (closed) return;
        retry = Math.min(retry + 1, 5);
        window.setTimeout(open, 1500 * retry);
      };
      ws.onerror = () => ws?.close();
    };
    open();
    return () => {
      closed = true;
      try {
        ws?.close();
      } catch {
        /* noop */
      }
    };
  }
}

/* ------------------------------------------------------------------ */
/* OKX                                                                 */
/* ------------------------------------------------------------------ */

const OKX_REST = 'https://www.okx.com/api/v5';
const OKX_WS = 'wss://ws.okx.com:8443/ws/v5/public';

class OkxAdapter implements ExchangeAdapter {
  id = 'okx';
  label = 'OKX Spot';

  supports(pair: string): boolean {
    const [, quote] = splitPair(pair);
    return ['USDT', 'USDC', 'BTC', 'EUR'].includes(quote);
  }

  private instId(pair: string): string {
    const [base, quote] = splitPair(pair);
    return `${base}-${quote}`;
  }

  async getTicker(pair: string): Promise<PairTicker> {
    const [base, quote] = splitPair(pair);
    const res = (await fetchJson(`${OKX_REST}/market/ticker?instId=${this.instId(pair)}`)) as {
      data?: Array<Record<string, string>>;
    };
    const d = res.data?.[0];
    if (!d) throw new Error('OKX empty ticker');
    const last = parseFloat(d.last);
    const open = parseFloat(d.open24h);
    return {
      pair,
      base,
      quote,
      last,
      change24hPct: open ? ((last - open) / open) * 100 : 0,
      high24h: parseFloat(d.high24h),
      low24h: parseFloat(d.low24h),
      baseVolume24h: parseFloat(d.vol24h),
      quoteVolume24h: parseFloat(d.volCcy24h),
      bid: parseFloat(d.bidPx),
      ask: parseFloat(d.askPx),
      updatedAt: Date.now(),
    };
  }

  async getKlines(pair: string, interval: CandleInterval, limit: number): Promise<Candle[]> {
    const bar = interval === '1d' ? '1D' : interval === '1w' ? '1W' : interval;
    const raw = (await fetchJson(`${OKX_REST}/market/candles?instId=${this.instId(pair)}&bar=${bar}&limit=${limit}`)) as {
      data?: string[][];
    };
    const rows = raw.data ?? [];
    return rows
      .map((k) => ({
        time: Math.floor(Number(k[0]) / 1000),
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
      }))
      .reverse();
  }

  async getOrderBook(pair: string, depth: number): Promise<OrderBook> {
    const d = (await fetchJson(`${OKX_REST}/market/books?instId=${this.instId(pair)}&sz=${depth}`)) as {
      data?: Array<{ bids: string[][]; asks: string[][] }>;
    };
    const row = d.data?.[0];
    if (!row) throw new Error('OKX empty book');
    return normalizeBook(pair, row.bids, row.asks);
  }

  async getTrades(pair: string, limit: number): Promise<TradeTick[]> {
    const d = (await fetchJson(`${OKX_REST}/market/trades?instId=${this.instId(pair)}&limit=${limit}`)) as {
      data?: Array<Record<string, string>>;
    };
    return (d.data ?? []).map((t) => ({
      id: t.tradeId,
      pair,
      price: parseFloat(t.px),
      amount: parseFloat(t.sz),
      side: t.side as 'buy' | 'sell',
      time: Number(t.ts),
    }));
  }

  connect(pair: string, h: StreamHandlers): () => void {
    const inst = this.instId(pair);
    let ws: WebSocket | null = null;
    let closed = false;
    let retry = 0;
    let ping: number | undefined;
    const open = () => {
      if (closed) return;
      try {
        ws = new WebSocket(OKX_WS);
      } catch {
        return;
      }
      ws.onopen = () => {
        ws?.send(
          JSON.stringify({
            op: 'subscribe',
            args: [
              { channel: 'tickers', instId: inst },
              { channel: 'books5', instId: inst },
              { channel: 'trades', instId: inst },
            ],
          }),
        );
        ping = window.setInterval(() => ws?.send('ping'), 25000);
      };
      ws.onmessage = (ev) => {
        const text = typeof ev.data === 'string' ? ev.data : '';
        if (text === 'pong') return;
        try {
          const msg = JSON.parse(text) as { arg?: { channel?: string }; data?: Array<Record<string, unknown>> };
          const row = msg.data?.[0];
          if (!row || !msg.arg) return;
          const [base, quote] = splitPair(pair);
          if (msg.arg.channel === 'tickers' && h.onTicker) {
            const last = parseFloat(String(row.last));
            const open24 = parseFloat(String(row.open24h));
            h.onTicker({
              pair,
              base,
              quote,
              last,
              change24hPct: open24 ? ((last - open24) / open24) * 100 : 0,
              high24h: parseFloat(String(row.high24h)),
              low24h: parseFloat(String(row.low24h)),
              baseVolume24h: parseFloat(String(row.vol24h)),
              quoteVolume24h: parseFloat(String(row.volCcy24h)),
              bid: parseFloat(String(row.bidPx)),
              ask: parseFloat(String(row.askPx)),
              updatedAt: Date.now(),
            });
          } else if (msg.arg.channel === 'books5' && h.onBook) {
            h.onBook(
              normalizeBook(pair, (row.bids as string[][]) ?? [], (row.asks as string[][]) ?? []),
            );
          } else if (msg.arg.channel === 'trades' && h.onTrade) {
            h.onTrade({
              id: String(row.tradeId),
              pair,
              price: parseFloat(String(row.px)),
              amount: parseFloat(String(row.sz)),
              side: (row.side as 'buy' | 'sell') ?? 'buy',
              time: Number(row.ts),
            });
          }
        } catch {
          /* ignore */
        }
      };
      ws.onclose = () => {
        window.clearInterval(ping);
        if (closed) return;
        retry = Math.min(retry + 1, 5);
        window.setTimeout(open, 1500 * retry);
      };
      ws.onerror = () => ws?.close();
    };
    open();
    return () => {
      closed = true;
      window.clearInterval(ping);
      try {
        ws?.close();
      } catch {
        /* noop */
      }
    };
  }
}

/* ------------------------------------------------------------------ */

function normalizeBook(pair: string, bids: string[][], asks: string[][]): OrderBook {
  let bt = 0;
  let at = 0;
  return {
    pair,
    bids: bids.map(([p, a]) => {
      const price = parseFloat(p);
      const amount = parseFloat(a);
      bt += amount;
      return { price, amount, total: bt };
    }),
    asks: asks.map(([p, a]) => {
      const price = parseFloat(p);
      const amount = parseFloat(a);
      at += amount;
      return { price, amount, total: at };
    }),
    updatedAt: Date.now(),
  };
}

export const exchangeAdapters: ExchangeAdapter[] = [new BinanceAdapter(), new OkxAdapter()];
