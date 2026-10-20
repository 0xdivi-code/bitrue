import { useEffect, useState } from 'react';
import type { ExchangeId, InstrumentMeta, MarketType } from '../types/marketDataTypes';
import { pairMarketStore } from '../services/marketDataService';
import { defaultCatalog } from '../data/defaultCatalog';

export interface InstrumentsResult {
  instruments: InstrumentMeta[];
  loading: boolean;
  error: string | null;
  /** true when the built-in wide catalog is shown instead of a live venue catalog */
  fromFallback: boolean;
  reload: () => void;
}

/**
 * Exchange market catalog (spot pairs or linear perpetuals).
 * Shows the built-in wide catalog immediately and swaps to the live venue
 * catalog once it loads, so lists are never empty or sparse.
 */
export function useInstruments(exchange: ExchangeId, marketType: MarketType): InstrumentsResult {
  const fallback = defaultCatalog(exchange, marketType);
  const [instruments, setInstruments] = useState<InstrumentMeta[]>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromFallback, setFromFallback] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    pairMarketStore
      .getCatalog(exchange, marketType)
      .then((list) => {
        if (!alive) return;
        if (list.length >= 10) {
          setInstruments(list);
          setFromFallback(false);
          setError(null);
        } else {
          setInstruments(fallback);
          setFromFallback(true);
          setError(list.length ? null : 'Venue catalog unavailable — showing built-in market list');
        }
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setInstruments(fallback);
        setFromFallback(true);
        setError(e instanceof Error ? e.message : 'catalog error');
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [exchange, marketType, nonce, fallback]);

  return { instruments, loading, error, fromFallback, reload: () => setNonce((n) => n + 1) };
}
