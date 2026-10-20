/**
 * Exchange-adapter contract shared by every venue implementation.
 * Market-data (public) only — authenticated execution lives in
 * `executionAdapter.ts` and is deliberately kept separate.
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

export interface StreamHandlers {
  onTicker?: (t: PairTicker) => void;
  onBook?: (b: OrderBook) => void;
  onTrade?: (t: TradeTick) => void;
}

export interface ExchangeAdapter {
  id: ExchangeId;
  label: string;
  /** Venue + market-type availability for a normalized pair. */
  supports(pair: string, marketType: MarketType): boolean;
  /** Full public market catalog (cached by the adapter). */
  getCatalog(marketType: MarketType): Promise<InstrumentMeta[]>;
  getTicker(key: string): Promise<PairTicker>;
  getKlines(key: string, interval: CandleInterval, limit: number): Promise<Candle[]>;
  getOrderBook(key: string, depth: number): Promise<OrderBook>;
  getTrades(key: string, limit: number): Promise<TradeTick[]>;
  /** Perpetual-futures specifics; null when the venue does not provide them. */
  getFundingInfo(key: string): Promise<FundingInfo | null>;
  /** Opens live streams; returns an unsubscribe function. */
  connect(key: string, handlers: StreamHandlers): () => void;
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
