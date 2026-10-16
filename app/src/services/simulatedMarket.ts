/**
 * Deterministic simulated market engine.
 *
 * Used ONLY as a clearly-labelled fallback when no live provider is reachable
 * (offline sandbox, geo-blocked exchange APIs, rate limits). Every value it
 * produces is marked `source: 'simulated'` by the service layer so the UI can
 * never present it as live data.
 */
import type { Candle, CandleInterval, GlobalAsset, OrderBook, PairTicker, TradeTick, TradingPairMeta } from '../types/marketDataTypes';
import { hashString, seededRandom } from '../utils/format';

interface Anchor {
  price: number;
  supply: number;
  name: string;
}

/** Reference magnitudes for the simulated fallback dataset (not live prices). */
export const ASSET_ANCHORS: Record<string, Anchor> = {
  BTC: { price: 96420, supply: 19_800_000, name: 'Bitcoin' },
  ETH: { price: 3310, supply: 120_400_000, name: 'Ethereum' },
  XRP: { price: 2.41, supply: 57_600_000_000, name: 'XRP' },
  USDT: { price: 1, supply: 140_000_000_000, name: 'Tether' },
  BNB: { price: 640, supply: 145_000_000, name: 'BNB' },
  SOL: { price: 196, supply: 470_000_000, name: 'Solana' },
  DOGE: { price: 0.318, supply: 146_000_000_000, name: 'Dogecoin' },
  ADA: { price: 0.92, supply: 35_300_000_000, name: 'Cardano' },
  TRX: { price: 0.243, supply: 86_400_000_000, name: 'TRON' },
  LINK: { price: 21.4, supply: 626_000_000, name: 'Chainlink' },
  AVAX: { price: 37.8, supply: 404_000_000, name: 'Avalanche' },
  DOT: { price: 7.1, supply: 1_520_000_000, name: 'Polkadot' },
  LTC: { price: 104, supply: 75_300_000, name: 'Litecoin' },
  SHIB: { price: 0.0000221, supply: 589_000_000_000_000, name: 'Shiba Inu' },
  TON: { price: 5.4, supply: 2_540_000_000, name: 'Toncoin' },
  SUI: { price: 3.62, supply: 2_900_000_000, name: 'Sui' },
  UNI: { price: 12.1, supply: 600_000_000, name: 'Uniswap' },
  PEPE: { price: 0.0000182, supply: 420_000_000_000_000, name: 'Pepe' },
  ATOM: { price: 7.4, supply: 390_000_000, name: 'Cosmos' },
  NEAR: { price: 5.6, supply: 1_130_000_000, name: 'NEAR Protocol' },
  APT: { price: 9.4, supply: 460_000_000, name: 'Aptos' },
  ARB: { price: 0.84, supply: 4_100_000_000, name: 'Arbitrum' },
  OP: { price: 1.86, supply: 1_640_000_000, name: 'Optimism' },
  INJ: { price: 22.6, supply: 81_000_000, name: 'Injective' },
  TIA: { price: 5.9, supply: 420_000_000, name: 'Celestia' },
  SEI: { price: 0.47, supply: 4_700_000_000, name: 'Sei' },
  WLD: { price: 2.31, supply: 1_430_000_000, name: 'Worldcoin' },
  FIL: { price: 5.3, supply: 610_000_000, name: 'Filecoin' },
  ICP: { price: 10.8, supply: 470_000_000, name: 'Internet Computer' },
  HBAR: { price: 0.246, supply: 38_700_000_000, name: 'Hedera' },
  ALGO: { price: 0.352, supply: 8_200_000_000, name: 'Algorand' },
  VET: { price: 0.042, supply: 72_700_000_000, name: 'VeChain' },
  XLM: { price: 0.381, supply: 30_700_000_000, name: 'Stellar' },
  SAND: { price: 0.52, supply: 2_280_000_000, name: 'The Sandbox' },
  MANA: { price: 0.56, supply: 1_890_000_000, name: 'Decentraland' },
  AAVE: { price: 262, supply: 15_000_000, name: 'Aave' },
  CRV: { price: 0.82, supply: 1_310_000_000, name: 'Curve DAO' },
  LDO: { price: 2.05, supply: 895_000_000, name: 'Lido DAO' },
  GRT: { price: 0.262, supply: 9_400_000_000, name: 'The Graph' },
  RNDR: { price: 7.3, supply: 387_000_000, name: 'Render' },
  IMX: { price: 1.62, supply: 1_530_000_000, name: 'Immutable' },
  GALA: { price: 0.038, supply: 36_800_000_000, name: 'Gala' },
  FTM: { price: 0.71, supply: 2_800_000_000, name: 'Fantom' },
  ETC: { price: 27.4, supply: 152_000_000, name: 'Ethereum Classic' },
  BCH: { price: 468, supply: 19_800_000, name: 'Bitcoin Cash' },
  XMR: { price: 168, supply: 18_400_000, name: 'Monero' },
  KAS: { price: 0.148, supply: 25_900_000_000, name: 'Kaspa' },
  RUNE: { price: 4.4, supply: 338_000_000, name: 'THORChain' },
  STX: { price: 1.94, supply: 1_510_000_000, name: 'Stacks' },
  EGLD: { price: 32.6, supply: 27_400_000, name: 'MultiversX' },
};

const SYMBOL_ORDER = Object.keys(ASSET_ANCHORS);

interface WalkState {
  price: number;
  drift: number;
}
const walks = new Map<string, WalkState>();

function walkState(key: string): WalkState {
  let s = walks.get(key);
  if (!s) {
    const rng = seededRandom(hashString(key));
    const anchor = ASSET_ANCHORS[key.split('_')[0].split('-')[0]]?.price ?? 1;
    s = { price: anchor * (0.94 + rng() * 0.12), drift: (rng() - 0.5) * 0.002 };
    walks.set(key, s);
  }
  return s;
}

/** Advance the random walk; returns the new price. */
export function simulatedPrice(key: string, stepMs = 1200): number {
  const s = walkState(key);
  const rng = Math.random;
  s.drift = s.drift * 0.94 + (rng() - 0.5) * 0.0016;
  const shock = (rng() - 0.5) * 0.0022 * Math.min(4, stepMs / 1200);
  s.price = Math.max(1e-9, s.price * (1 + s.drift + shock));
  return s.price;
}

export function simulatedPriceStatic(key: string): number {
  return walkState(key).price;
}

export function simulatedChange24h(key: string): number {
  const rng = seededRandom(hashString(key + ':chg'));
  return (rng() - 0.46) * 14;
}

export function simulatedTicker(pair: string, meta?: TradingPairMeta): PairTicker {
  const [base, quote] = pair.split('_');
  const last = simulatedPriceStatic(pair);
  const chg = simulatedChange24h(pair);
  const vol = simulatedVolume24h(base);
  return {
    pair,
    base,
    quote,
    last,
    change24hPct: chg,
    high24h: last * (1 + Math.abs(chg) / 100 + 0.012),
    low24h: last * (1 - Math.abs(chg) / 100 - 0.014),
    baseVolume24h: vol,
    quoteVolume24h: vol * last,
    bid: last * 0.9998,
    ask: last * 1.0002,
    updatedAt: Date.now(),
  };
}

function simulatedVolume24h(base: string): number {
  const rng = seededRandom(hashString(base + ':vol'));
  const mcap = (ASSET_ANCHORS[base]?.price ?? 1) * (ASSET_ANCHORS[base]?.supply ?? 1e9);
  return (mcap * (0.015 + rng() * 0.1)) / (ASSET_ANCHORS[base]?.price ?? 1);
}

const INTERVAL_SECONDS: Record<CandleInterval, number> = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '30m': 1800,
  '1h': 3600,
  '4h': 14400,
  '1d': 86400,
  '1w': 604800,
};

export function intervalSeconds(i: CandleInterval): number {
  return INTERVAL_SECONDS[i];
}

/** Reproducible OHLCV series ending at the current simulated price. */
export function simulatedCandles(pair: string, interval: CandleInterval, limit = 300): Candle[] {
  const step = INTERVAL_SECONDS[interval];
  const now = Math.floor(Date.now() / 1000 / step) * step;
  const rng = seededRandom(hashString(`${pair}:${interval}`));
  const endPrice = simulatedPriceStatic(pair);
  const candles: Candle[] = [];
  // random-walk backwards from a start price, then rescale so last close == endPrice
  let price = endPrice * (0.72 + rng() * 0.5);
  const vol = interval === '1w' ? 0.09 : interval === '1d' ? 0.045 : interval === '4h' ? 0.024 : 0.011;
  for (let i = limit - 1; i >= 0; i--) {
    const open = price;
    const drift = (rng() - 0.492) * vol * 2;
    const close = open * (1 + drift);
    const high = Math.max(open, close) * (1 + rng() * vol * 0.7);
    const low = Math.min(open, close) * (1 - rng() * vol * 0.7);
    const volume = simulatedVolume24h(pair.split('_')[0]) / (86400 / step) * (0.4 + rng() * 1.6);
    candles.push({ time: now - i * step, open, high, low, close, volume });
    price = close;
  }
  const scale = endPrice / candles[candles.length - 1].close;
  return candles.map((c) => ({
    ...c,
    open: c.open * scale,
    high: c.high * scale,
    low: c.low * scale,
    close: c.close * scale,
  }));
}

export function simulatedOrderBook(pair: string, depth = 16): OrderBook {
  const mid = simulatedPriceStatic(pair);
  const tick = mid * 0.00012;
  const rng = seededRandom(hashString(pair + ':book') ^ (Math.floor(Date.now() / 2000) & 0xffff));
  const bids = [];
  const asks = [];
  let bidTotal = 0;
  let askTotal = 0;
  for (let i = 0; i < depth; i++) {
    const bAmt = mid * 0 > 0 ? 0 : 0; // placeholder to keep types happy
    void bAmt;
    const bAmount = (rng() * 0.9 + 0.08) * bookScale(pair);
    const aAmount = (rng() * 0.9 + 0.08) * bookScale(pair);
    bidTotal += bAmount;
    askTotal += aAmount;
    bids.push({ price: round(mid - tick * (i + 1)), amount: round(bAmount, 4), total: round(bidTotal, 4) });
    asks.push({ price: round(mid + tick * (i + 1)), amount: round(aAmount, 4), total: round(askTotal, 4) });
  }
  return { pair, bids, asks, updatedAt: Date.now() };
}

function bookScale(pair: string): number {
  const base = pair.split('_')[0];
  const price = ASSET_ANCHORS[base]?.price ?? 1;
  return 220000 / price;
}

export function simulatedTrades(pair: string, limit = 40): TradeTick[] {
  const mid = simulatedPriceStatic(pair);
  const rng = seededRandom(hashString(pair + ':trades') ^ (Math.floor(Date.now() / 1500) & 0xffff));
  const now = Date.now();
  const out: TradeTick[] = [];
  for (let i = 0; i < limit; i++) {
    const price = mid * (1 + (rng() - 0.5) * 0.0012);
    out.push({
      id: `${pair}-${now - i * 1400}-${i}`,
      pair,
      price,
      amount: round((rng() * 0.8 + 0.02) * bookScale(pair) * 0.06, 4),
      side: rng() > 0.5 ? 'buy' : 'sell',
      time: now - i * (900 + Math.floor(rng() * 2600)),
    });
  }
  return out;
}

export function simulatedGlobalAssets(limit = 50): GlobalAsset[] {
  const now = Date.now();
  return SYMBOL_ORDER.slice(0, limit)
    .map((symbol, idx) => {
      const anchor = ASSET_ANCHORS[symbol];
      const price = simulatedPriceStatic(symbol.toLowerCase() + '_usd');
      const rng = seededRandom(hashString(symbol + ':g'));
      const change = simulatedChange24h(symbol.toLowerCase() + '_usd');
      const spark: number[] = [];
      let p = price * (1 - change / 100 / 2);
      const srng = seededRandom(hashString(symbol + ':spark'));
      for (let i = 0; i < 24; i++) {
        p = p * (1 + (srng() - 0.48) * 0.02);
        spark.push(p);
      }
      spark.push(price);
      return {
        providerId: `sim-${symbol.toLowerCase()}`,
        symbol,
        name: anchor.name,
        priceUsd: price,
        marketCapUsd: price * anchor.supply,
        volume24hUsd: price * anchor.supply * (0.015 + rng() * 0.09),
        change24hPct: change,
        change7dPct: (rng() - 0.45) * 22,
        rank: idx + 1,
        sparkline7d: spark,
        updatedAt: now,
      } satisfies GlobalAsset;
    })
    .sort((a, b) => b.marketCapUsd - a.marketCapUsd)
    .map((a, i) => ({ ...a, rank: i + 1 }));
}

function round(v: number, d = 8): number {
  const f = Math.pow(10, d);
  return Math.round(v * f) / f;
}
