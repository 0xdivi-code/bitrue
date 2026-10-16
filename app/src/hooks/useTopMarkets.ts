import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { GlobalAsset, GlobalMarketSnapshot } from '../types/marketDataTypes';
import { globalMarketStore } from '../services/globalMarketProvider';

export interface TopMarketsResult {
  snapshot: GlobalMarketSnapshot;
  assets: GlobalAsset[];
  bySymbol: Map<string, GlobalAsset>;
  gainers: GlobalAsset[];
  losers: GlobalAsset[];
  search: (q: string) => GlobalAsset[];
  refresh: () => void;
}

/** Shared, subscription-based view of the top-50 market-cap dataset. */
export function useTopMarkets(): TopMarketsResult {
  const snapshot = useSyncExternalStore(
    (cb) => globalMarketStore.subscribe(() => cb()),
    () => globalMarketStore.getSnapshot(),
  );

  const bySymbol = useMemo(() => {
    const m = new Map<string, GlobalAsset>();
    snapshot.assets.forEach((a) => m.set(a.symbol, a));
    return m;
  }, [snapshot]);

  const gainers = useMemo(
    () => [...snapshot.assets].sort((a, b) => b.change24hPct - a.change24hPct).slice(0, 8),
    [snapshot],
  );
  const losers = useMemo(
    () => [...snapshot.assets].sort((a, b) => a.change24hPct - b.change24hPct).slice(0, 8),
    [snapshot],
  );

  const search = useCallback(
    (q: string) => {
      const needle = q.trim().toLowerCase();
      if (!needle) return snapshot.assets;
      return snapshot.assets.filter(
        (a) => a.symbol.toLowerCase().includes(needle) || a.name.toLowerCase().includes(needle),
      );
    },
    [snapshot],
  );

  const refresh = useCallback(() => {
    void globalMarketStore.refresh(true);
  }, []);

  return { snapshot, assets: snapshot.assets, bySymbol, gainers, losers, search, refresh };
}
