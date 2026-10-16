/**
 * TradingView-compatible datafeed adapter.
 *
 * Implements the same contract as the official TradingView Charting Library
 * `IDatafeedChartApi` (onReady / resolveSymbol / getBars / subscribeBars /
 * unsubscribeBars), so this module can be handed straight to the licensed
 * Advanced Charts widget (`new TradingView.widget({ datafeed, ... })`) if the
 * project obtains access. In this repository the same adapter drives the
 * bundled TradingView Lightweight Charts renderer (the officially supported
 * open-source fallback), so chart data always flows through one adapter.
 *
 * The library never supplies market data itself — candles and live bars come
 * from the exchange adapters / simulated fallback via `pairMarketStore`.
 */
import type { Candle, CandleInterval } from '../types/marketDataTypes';
import { pairMarketStore } from './marketDataService';
import { intervalMs } from './exchangeAdapters';

export const SUPPORTED_RESOLUTIONS = ['1', '5', '15', '30', '60', '240', '1D', '1W'] as const;
export type Resolution = (typeof SUPPORTED_RESOLUTIONS)[number];

export function resolutionToInterval(res: Resolution): CandleInterval {
  switch (res) {
    case '1':
      return '1m';
    case '5':
      return '5m';
    case '15':
      return '15m';
    case '30':
      return '30m';
    case '60':
      return '1h';
    case '240':
      return '4h';
    case '1D':
      return '1d';
    case '1W':
      return '1w';
    default:
      return '1d';
  }
}

export function intervalToResolution(i: CandleInterval): Resolution {
  switch (i) {
    case '1m':
      return '1';
    case '5m':
      return '5';
    case '15m':
      return '15';
    case '30m':
      return '30';
    case '1h':
      return '60';
    case '4h':
      return '240';
    case '1d':
      return '1D';
    case '1w':
      return '1W';
    default:
      return '1D';
  }
}

export interface ChartSymbolInfo {
  name: string;
  ticker: string;
  description: string;
  type: 'crypto';
  session: '24x7';
  timezone: 'Etc/UTC';
  minmov: 1;
  pricescale: number;
  has_intraday: boolean;
  supported_resolutions: string[];
  volume_precision: number;
}

export interface HistoryCallback {
  (bars: Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }>, meta?: {
    noData?: boolean;
  }): void;
}

export interface DatafeedConfiguration {
  supported_resolutions: string[];
  supports_time: boolean;
  supports_marks: boolean;
  supports_timescale_marks: boolean;
}

export interface TradingViewDatafeed {
  onReady(callback: (config: DatafeedConfiguration) => void): void;
  resolveSymbol(symbolName: string, onResolve: (info: ChartSymbolInfo) => void, onError: (reason: string) => void): void;
  getBars(
    symbolInfo: ChartSymbolInfo,
    resolution: string,
    periodParams: { from: number; to: number; firstDataRequest: boolean },
    onHistoryCb: HistoryCallback,
    onErrorCb: (reason: string) => void,
  ): void;
  subscribeBars(
    symbolInfo: ChartSymbolInfo,
    resolution: string,
    onTick: (bar: { time: number; open: number; high: number; low: number; close: number; volume: number }) => void,
    listenerGuid: string,
    onResetCacheNeededCallback: () => void,
  ): void;
  unsubscribeBars(listenerGuid: string): void;
}

/** Normalized pair key ("xrp_usdt") → symbol info. */
export function symbolInfoForPair(pair: string, pricePrecision = 5): ChartSymbolInfo {
  const [base, quote] = pair.toUpperCase().split('_');
  return {
    name: pair,
    ticker: `${base}${quote}`,
    description: `${base}/${quote} Spot`,
    type: 'crypto',
    session: '24x7',
    timezone: 'Etc/UTC',
    minmov: 1,
    pricescale: Math.pow(10, pricePrecision),
    has_intraday: true,
    supported_resolutions: [...SUPPORTED_RESOLUTIONS],
    volume_precision: 2,
  };
}

export function createTradingViewDatafeed(): TradingViewDatafeed {
  const subscriptions = new Map<string, () => void>();

  return {
    onReady(cb) {
      setTimeout(
        () =>
          cb({
            supported_resolutions: [...SUPPORTED_RESOLUTIONS],
            supports_time: false,
            supports_marks: false,
            supports_timescale_marks: false,
          }),
        0,
      );
    },

    resolveSymbol(symbolName, onResolve, onError) {
      const pair = symbolName.toLowerCase().replace(/[-/]/g, '_');
      if (!/^[a-z0-9]+_[a-z0-9]+$/.test(pair)) {
        onError('invalid symbol');
        return;
      }
      setTimeout(() => onResolve(symbolInfoForPair(pair)), 0);
    },

    getBars(symbolInfo, resolution, periodParams, onHistoryCb, onErrorCb) {
      const interval = resolutionToInterval(resolution as Resolution);
      const limit = periodParams.firstDataRequest
        ? 300
        : Math.min(1000, Math.max(50, Math.ceil((periodParams.to - periodParams.from) / (intervalMs(interval) / 1000))));
      pairMarketStore
        .getCandles(symbolInfo.name, interval, limit)
        .then((candles: Candle[]) => {
          if (!candles.length) {
            onHistoryCb([], { noData: true });
            return;
          }
          onHistoryCb(candles.map((c) => ({ ...c, time: c.time * 1000 })));
        })
        .catch((err: unknown) => onErrorCb(err instanceof Error ? err.message : 'history error'));
    },

    subscribeBars(symbolInfo, resolution, onTick, listenerGuid) {
      const interval = resolutionToInterval(resolution as Resolution);
      const stepMs = intervalMs(interval);
      const release = pairMarketStore.retain(symbolInfo.name);
      const un = pairMarketStore.subscribe(symbolInfo.name, (state) => {
        const series = state.candles[interval];
        const last = series?.[series.length - 1];
        const tick = state.ticker;
        if (!tick) return;
        const bucket = Math.floor(tick.updatedAt / stepMs) * stepMs;
        if (last && bucket === last.time) {
          onTick({
            time: bucket * 1000,
            open: last.open,
            high: Math.max(last.high, tick.last),
            low: Math.min(last.low, tick.last),
            close: tick.last,
            volume: last.volume,
          });
        } else {
          onTick({
            time: bucket * 1000,
            open: tick.last,
            high: tick.last,
            low: tick.last,
            close: tick.last,
            volume: 0,
          });
        }
      });
      subscriptions.set(listenerGuid, () => {
        un();
        release();
      });
    },

    unsubscribeBars(listenerGuid) {
      subscriptions.get(listenerGuid)?.();
      subscriptions.delete(listenerGuid);
    },
  };
}

export const tradingViewDatafeed = createTradingViewDatafeed();
