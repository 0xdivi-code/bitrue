/**
 * Built-in wide instrument catalog.
 *
 * Used instantly (and as a fallback) so the market sidebar, selector modal and
 * futures terminal always present a full, tradable-looking asset list even
 * before — or if — a venue catalog request succeeds. Precisions follow common
 * exchange conventions; when a live venue catalog loads it replaces this list.
 */
import type { ExchangeId, InstrumentMeta, MarketType } from '../types/marketDataTypes';

type Row = [base: string, pricePrecision: number, amountPrecision: number];

const SPOT_ROWS: Row[] = [
  ['BTC', 2, 5], ['ETH', 2, 4], ['XRP', 4, 1], ['SOL', 3, 2], ['BNB', 2, 3], ['USDC', 4, 2], ['DOGE', 5, 0],
  ['ADA', 4, 0], ['TRX', 5, 0], ['LINK', 3, 2], ['AVAX', 3, 2], ['DOT', 4, 1], ['LTC', 2, 3], ['SHIB', 8, 0],
  ['TON', 4, 2], ['SUI', 4, 1], ['UNI', 4, 2], ['PEPE', 8, 0], ['ATOM', 4, 2], ['NEAR', 4, 2], ['APT', 4, 2],
  ['ARB', 4, 1], ['OP', 4, 1], ['INJ', 3, 2], ['TIA', 4, 1], ['SEI', 5, 0], ['WLD', 4, 1], ['FIL', 4, 2],
  ['ICP', 4, 2], ['HBAR', 5, 0], ['ALGO', 4, 0], ['VET', 5, 0], ['XLM', 5, 0], ['SAND', 4, 1], ['MANA', 4, 1],
  ['AAVE', 2, 3], ['CRV', 4, 1], ['LDO', 4, 2], ['GRT', 4, 0], ['RNDR', 4, 2], ['IMX', 4, 1], ['GALA', 5, 0],
  ['FTM', 4, 0], ['ETC', 3, 2], ['BCH', 2, 3], ['XMR', 2, 3], ['KAS', 4, 0], ['RUNE', 4, 1], ['STX', 4, 1],
  ['EGLD', 3, 2], ['JUP', 4, 1], ['PYTH', 5, 0], ['JTO', 4, 1], ['WIF', 4, 0], ['BONK', 8, 0], ['FLOKI', 8, 0],
  ['ORDI', 3, 2], ['STRK', 4, 1], ['STRAX', 4, 2], ['CELO', 4, 1], ['ZRO', 4, 1], ['ENA', 5, 0], ['ONDO', 4, 0],
  ['BOME', 6, 0], ['NOT', 6, 0], ['TURBO', 6, 0], ['PENDLE', 4, 2], ['DYDX', 4, 1], ['GMT', 4, 0], ['APE', 4, 0],
  ['CHZ', 5, 0], ['AXS', 4, 1], ['THETA', 4, 1], ['EOS', 4, 0], ['XTZ', 4, 0], ['FLOW', 4, 1], ['EIGEN', 4, 1],
  ['SNX', 4, 1], ['COMP', 3, 2], ['MKR', 2, 3], ['ZEC', 2, 3], ['DASH', 2, 3], ['IOTA', 4, 0], ['QNT', 3, 3],
  ['BTR', 5, 0], ['BTW', 5, 0], ['USDS', 4, 2], ['HYPE', 4, 2], ['BERA', 4, 1], ['TST', 5, 0], ['LAYER', 5, 0],
  ['ANIME', 5, 0], ['PENGU', 5, 0], ['ACT', 5, 0], ['HMSTR', 6, 0], ['CATI', 4, 2], ['NEIRO', 8, 0],
];

const SWAP_ROWS: Row[] = [
  ['BTC', 1, 3], ['ETH', 2, 2], ['XRP', 4, 0], ['SOL', 3, 1], ['BNB', 2, 2], ['DOGE', 5, 0], ['ADA', 5, 0],
  ['TRX', 6, 0], ['LINK', 4, 1], ['AVAX', 4, 1], ['DOT', 4, 0], ['LTC', 3, 2], ['SHIB', 8, 0], ['SUI', 5, 0],
  ['UNI', 4, 1], ['PEPE', 8, 0], ['ATOM', 4, 1], ['NEAR', 4, 1], ['APT', 4, 1], ['ARB', 5, 0], ['OP', 5, 0],
  ['INJ', 4, 1], ['TIA', 4, 0], ['SEI', 5, 0], ['WLD', 5, 0], ['FIL', 4, 1], ['ICP', 4, 1], ['HBAR', 6, 0],
  ['ALGO', 6, 0], ['VET', 6, 0], ['XLM', 6, 0], ['SAND', 6, 0], ['AAVE', 3, 2], ['CRV', 6, 0], ['LDO', 5, 0],
  ['GRT', 6, 0], ['RNDR', 5, 0], ['GALA', 6, 0], ['ETC', 4, 1], ['BCH', 3, 2], ['XMR', 3, 2], ['KAS', 6, 0],
  ['RUNE', 5, 0], ['STX', 5, 0], ['JUP', 5, 0], ['PYTH', 6, 0], ['WIF', 6, 0], ['BONK', 8, 0], ['FLOKI', 8, 0],
  ['ORDI', 4, 1], ['STRK', 5, 0], ['ZRO', 5, 0], ['ENA', 6, 0], ['ONDO', 6, 0], ['PENDLE', 5, 1], ['DYDX', 5, 1],
  ['ZEC', 3, 2], ['HYPE', 4, 1], ['BERA', 5, 0], ['PENGU', 6, 0], ['1000PEPE', 6, 0], ['1000SHIB', 6, 0],
  ['1000BONK', 6, 0], ['1000FLOKI', 6, 0], ['1000LUNC', 6, 0], ['XAU', 2, 2], ['XAG', 3, 1],
];

function build(rows: Row[], exchange: ExchangeId, marketType: MarketType): InstrumentMeta[] {
  const quote = 'USDT';
  return rows.map(([base, pp, ap]) => ({
    exchange,
    marketType,
    pair: `${base.toLowerCase()}_${quote.toLowerCase()}`,
    symbol: marketType === 'swap' ? `${base}/${quote}:${quote}` : `${base}/${quote}`,
    base,
    quote,
    settle: marketType === 'swap' ? quote : undefined,
    active: true,
    tickSize: Math.pow(10, -pp),
    stepSize: Math.pow(10, -ap),
    minAmount: undefined,
    minCost: undefined,
  }));
}

const CACHE = new Map<string, InstrumentMeta[]>();

/** Wide default catalog for a venue/market-type (instant, offline-safe). */
export function defaultCatalog(exchange: ExchangeId, marketType: MarketType): InstrumentMeta[] {
  const key = `${exchange}|${marketType}`;
  let list = CACHE.get(key);
  if (!list) {
    list = build(marketType === 'swap' ? SWAP_ROWS : SPOT_ROWS, exchange, marketType);
    CACHE.set(key, list);
  }
  return list;
}
