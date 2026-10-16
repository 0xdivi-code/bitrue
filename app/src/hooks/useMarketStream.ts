import { useEffect, useState } from 'react';
import { pairMarketStore } from '../services/marketDataService';

export interface MarketStreamStatus {
  active: boolean;
  subscribers: number;
}

/** Observes whether a live/simulated stream is running for a pair. */
export function useMarketStream(pair: string): MarketStreamStatus {
  const [status, setStatus] = useState<MarketStreamStatus>({ active: false, subscribers: 0 });
  useEffect(() => {
    const read = () =>
      setStatus({
        active: (pairMarketStore.refCount.get(pair) ?? 0) > 0,
        subscribers: pairMarketStore.refCount.get(pair) ?? 0,
      });
    read();
    const id = window.setInterval(read, 1000);
    return () => window.clearInterval(id);
  }, [pair]);
  return status;
}
