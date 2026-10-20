/**
 * Normalized market-data schemas shared by every provider adapter,
 * the caching layer, the datafeed and the UI.
 */

export type DataSourceState = 'live' | 'cached' | 'stale' | 'simulated' | 'loading' | 'error';

/** A globally-ranked asset (USD market statistics). */
export interface GlobalAsset {
  providerId: string; // stable provider id (e.g. coingecko "ripple")
  symbol: string; // display symbol, upper case ("XRP")
  name: string; // display name ("XRP")
  priceUsd: number;
  marketCapUsd: number;
  volume24hUsd: number;
  change24hPct: number;
  change7dPct?: number;
  rank?: number;
  logoUrl?: string;
  sparkline7d?: number[];
  updatedAt: number; // epoch ms of last successful provider update
}

export interface GlobalMarketSnapshot {
  assets: GlobalAsset[];
  source: string; // provider name, e.g. "coingecko" | "simulated"
  state: DataSourceState;
  fetchedAt: number;
  lastSuccessAt: number | null;
  error?: string;
}

/** Exchange-specific ticker for one trading pair. */
export interface PairTicker {
  pair: string; // normalized pair key, e.g. "xrp_usdt"
  base: string;
  quote: string;
  last: number;
  change24hPct: number;
  high24h: number;
  low24h: number;
  baseVolume24h: number;
  quoteVolume24h: number;
  bid?: number;
  ask?: number;
  updatedAt: number;
}

export interface Candle {
  time: number; // epoch seconds (UTC)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type CandleInterval = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';

export interface OrderBookLevel {
  price: number;
  amount: number;
  total: number;
}

export interface OrderBook {
  pair: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  updatedAt: number;
}

export interface TradeTick {
  id: string;
  pair: string;
  price: number;
  amount: number;
  side: 'buy' | 'sell'; // taker side
  time: number; // epoch ms
}

export interface PairMarketState {
  key: string; // "<exchange>|<marketType>|<pair>"
  pair: string;
  ticker: PairTicker | null;
  candles: Partial<Record<CandleInterval, Candle[]>>;
  orderBook: OrderBook | null;
  trades: TradeTick[];
  funding: FundingInfo | null;
  instrument: InstrumentMeta | null;
  source: string;
  state: DataSourceState;
  fetchedAt: number;
  lastSuccessAt: number | null;
  error?: string;
}

/** Metadata describing a tradable pair (exchange-agnostic). */
export interface TradingPairMeta {
  pair: string; // "xrp_usdt"
  base: string;
  quote: string;
  category: 'USDT' | 'XRP' | 'TRADFI' | 'ETF' | 'RLUSD' | 'USD';
  pricePrecision: number;
  amountPrecision: number;
  listed: boolean;
}

/* ------------------------- multi-venue instruments ------------------------- */

export type MarketType = 'spot' | 'swap'; // swap = USDT/USDC-margined perpetual futures
export type ExchangeId = 'binance' | 'bybit' | 'okx';

/** Normalized instrument metadata fetched from an exchange market catalog. */
export interface InstrumentMeta {
  exchange: ExchangeId;
  marketType: MarketType;
  pair: string; // normalized "xrp_usdt"
  symbol: string; // venue symbol, e.g. "XRP/USDT" or "XRP/USDT:USDT"
  base: string;
  quote: string;
  settle?: string;
  active: boolean;
  tickSize?: number;
  stepSize?: number;
  minAmount?: number;
  minCost?: number;
  contractSize?: number;
}

export interface FundingInfo {
  markPrice?: number;
  indexPrice?: number;
  fundingRate?: number;
  nextFundingTime?: number;
  interval?: string;
  source: string;
  updatedAt: number;
}

/** Composite store key: "<exchange>|<marketType>|<pair>". */
export function mkKey(exchange: ExchangeId, marketType: MarketType, pair: string): string {
  return `${exchange}|${marketType}|${pair}`;
}

export function splitKey(key: string): { exchange: ExchangeId; marketType: MarketType; pair: string } {
  const [exchange, marketType, pair] = key.split('|');
  return {
    exchange: (exchange as ExchangeId) || 'binance',
    marketType: (marketType as MarketType) || 'spot',
    pair: pair || 'xrp_usdt',
  };
}
