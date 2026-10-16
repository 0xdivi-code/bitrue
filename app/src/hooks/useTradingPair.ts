import { useEffect, useMemo, useSyncExternalStore } from 'react';
import type { CandleInterval, PairMarketState } from '../types/marketDataTypes';
import { pairMarketStore } from '../services/marketDataService';

export interface TradingPairResult {
  state: PairMarketState;
  sourceLabel: string;
  sourceState: PairMarketState['state'];
  refresh: () => void;
}

/**
 * Subscribes a component to one trading pair. The store keeps exactly one
 * stream per pair no matter how many panels (ticker, chart, book, trades,
 * forms) are mounted.
 */
export function useTradingPair(pair: string): TradingPairResult {
  const state = useSyncExternalStore(
    (cb) => pairMarketStore.subscribe(pair, () => cb()),
    () => pairMarketStore.getState(pair),
  );

  useEffect(() => pairMarketStore.retain(pair), [pair]);

  const refresh = useMemo(() => () => void pairMarketStore.refresh(pair), [pair]);

  const info = pairMarketStore.describe(state);
  return { state, sourceLabel: info.label, sourceState: info.state, refresh };
}

/** Convenience: request candles for an interval (chart control). */
export function usePairCandles(pair: string, interval: CandleInterval) {
  const { state } = useTradingPair(pair);
  useEffect(() => {
    void pairMarketStore.getCandles(pair, interval, 300);
  }, [pair, interval]);
  return state.candles[interval] ?? [];
}
