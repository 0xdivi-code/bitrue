import { useEffect, useState } from 'react';
import type { ExchangeId, InstrumentMeta, MarketType } from '../types/marketDataTypes';
import { pairMarketStore } from '../services/marketDataService';

export interface InstrumentsResult {
  instruments: InstrumentMeta[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** Exchange market catalog (spot pairs or linear perpetuals), cached per venue. */
export function useInstruments(exchange: ExchangeId, marketType: MarketType): InstrumentsResult {
  const [instruments, setInstruments] = useState<InstrumentMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    pairMarketStore
      .getCatalog(exchange, marketType)
      .then((list) => {
        if (!alive) return;
        setInstruments(list);
        setError(list.length ? null : 'Catalog unavailable for this venue');
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : 'catalog error');
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [exchange, marketType, nonce]);

  return { instruments, loading, error, reload: () => setNonce((n) => n + 1) };
}
