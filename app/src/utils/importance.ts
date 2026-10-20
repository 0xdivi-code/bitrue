/**
 * "Importance" ordering for instrument lists: global market-cap rank first,
 * then the curated blue-chip → long-tail order of the built-in catalog,
 * then anything the venue adds beyond that. Never plain alphabetical.
 */
import { defaultCatalog } from '../data/defaultCatalog';
import type { ExchangeId, InstrumentMeta, MarketType } from '../types/marketDataTypes';

const curatedIndex = new Map<string, number>();
(['spot', 'swap'] as MarketType[]).forEach((m) => {
  defaultCatalog('binance', m).forEach((i, idx) => {
    const key = `${m}|${i.base}`;
    if (!curatedIndex.has(key)) curatedIndex.set(key, idx);
  });
});

export function importanceRank(
  instrument: InstrumentMeta,
  globalRank: number | undefined,
  exchange: ExchangeId,
): number {
  void exchange;
  if (globalRank != null && Number.isFinite(globalRank)) return globalRank;
  const curated = curatedIndex.get(`${instrument.marketType}|${instrument.base}`);
  if (curated != null) return 1000 + curated;
  return 100000 + instrument.base.length * 10 + instrument.base.charCodeAt(0);
}

export function sortByImportance(
  list: InstrumentMeta[],
  rankOf: (base: string) => number | undefined,
  exchange: ExchangeId,
): InstrumentMeta[] {
  return [...list].sort(
    (a, b) => importanceRank(a, rankOf(a.base), exchange) - importanceRank(b, rankOf(b.base), exchange),
  );
}
