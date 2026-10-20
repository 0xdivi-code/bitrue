import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Search, Star, X } from 'lucide-react';
import { useInstruments } from '../../hooks/useInstruments';
import { useTopMarkets } from '../../hooks/useTopMarkets';
import { pairMarketStore, mkKey } from '../../services/marketDataService';
import type { ExchangeId, InstrumentMeta, MarketType } from '../../types/marketDataTypes';
import { cn, formatNumber, formatPct } from '../../utils/format';
import { sortByImportance } from '../../utils/importance';

export interface PairSidebarProps {
  activePair: string;
  exchange: ExchangeId;
  marketType: MarketType;
  favorites: string[];
  toggleFavorite: (pair: string) => void;
  /** route prefix for navigation, e.g. '/trade' or '/futures' */
  basePath?: string;
}

/**
 * Searchable market list populated from the selected venue's live catalog
 * (spot pairs or linear perpetuals). Prices prefer the venue's own cached
 * ticker; otherwise a clearly-marked global USD reference is shown.
 */
export function PairSidebar({ activePair, exchange, marketType, favorites, toggleFavorite, basePath = '/trade' }: PairSidebarProps): React.ReactElement {
  const navigate = useNavigate();
  const { bySymbol } = useTopMarkets();
  const { instruments, loading, reload, fromFallback } = useInstruments(exchange, marketType);
  const [query, setQuery] = useState('');
  const [quote, setQuote] = useState<string>('ALL');
  const [favOnly, setFavOnly] = useState(false);

  const quotes = useMemo(() => {
    const set = new Set(instruments.map((i) => i.quote));
    return ['ALL', ...['USDT', 'USDC', 'USD', 'BTC', 'ETH', 'EUR'].filter((q) => set.has(q)), ...[...set].filter((q) => !['USDT', 'USDC', 'USD', 'BTC', 'ETH', 'EUR'].includes(q)).slice(0, 3)];
  }, [instruments]);

  const rows = useMemo(() => {
    const needle = query.trim().toUpperCase();
    const ranked = sortByImportance(instruments, (base) => bySymbol.get(base)?.rank, exchange);
    return ranked
      .filter((i) => {
        if (favOnly && !favorites.includes(i.pair)) return false;
        if (quote !== 'ALL' && i.quote !== quote) return false;
        if (needle && !`${i.base}/${i.quote}`.includes(needle)) return false;
        return true;
      })
      .slice(0, 140);
  }, [instruments, query, quote, favOnly, favorites]);

  const priceOf = (i: InstrumentMeta): { price: number; chg: number; venue: boolean } => {
    const cached = pairMarketStore.getState(mkKey(exchange, marketType, i.pair)).ticker;
    if (cached?.last) return { price: cached.last, chg: cached.change24hPct, venue: true };
    const g = bySymbol.get(i.base);
    if (g) return { price: g.priceUsd, chg: g.change24hPct, venue: false };
    return { price: 0, chg: 0, venue: false };
  };

  const go = (pair: string) =>
    navigate(
      basePath === '/futures'
        ? `/futures/${pair}?ex=${exchange}`
        : `${basePath}/${pair}?ex=${exchange}${marketType === 'swap' ? '&m=swap' : ''}`,
    );

  return (
    <div className="flex h-full flex-col bg-night-800">
      <div className="space-y-2 p-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-txt-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search markets"
            aria-label="Search markets"
            className="w-full rounded-lg bg-night-600 py-1.5 pl-8 pr-7 text-[12px] text-txt-primary outline-none placeholder:text-txt-muted focus:ring-1 focus:ring-accent"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-txt-muted hover:text-txt-primary"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setFavOnly((f) => !f)}
            className={cn('rounded p-1.5', favOnly ? 'text-accent' : 'text-txt-secondary hover:text-txt-primary')}
            aria-label="Show favorites only"
          >
            <Star size={13} fill={favOnly ? 'currentColor' : 'none'} />
          </button>
          {quotes.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setQuote(q)}
              className={cn(
                'whitespace-nowrap rounded px-2 py-1 text-[11px] font-semibold',
                quote === q ? 'bg-night-500 text-accent' : 'text-txt-secondary hover:text-txt-primary',
              )}
            >
              {q}
            </button>
          ))}
          <button
            type="button"
            onClick={reload}
            aria-label="Reload market catalog"
            className="ml-auto rounded p-1.5 text-txt-secondary hover:text-txt-primary"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[1.6fr_1fr_.8fr] px-3 py-1 text-[10px] text-txt-muted">
        <span>
          Pair · {exchange}
          {fromFallback && <span className="ml-1 rounded bg-night-600 px-1 text-[8px] uppercase text-txt-muted">built-in</span>}
        </span>
        <span className="text-right">Price</span>
        <span className="text-right">24h</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scroll-thin">
        {loading ? (
          <div className="space-y-1.5 px-3 py-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton h-4 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-3 py-6 text-center text-[11px] text-txt-muted">
            No {marketType === 'swap' ? 'perpetuals' : 'pairs'} match on {exchange}.
          </div>
        ) : (
          rows.map((i) => {
            const { price, chg, venue } = priceOf(i);
            const active = i.pair === activePair;
            return (
              <div
                key={i.symbol}
                role="button"
                tabIndex={0}
                onClick={() => go(i.pair)}
                onKeyDown={(e) => e.key === 'Enter' && go(i.pair)}
                className={cn(
                  'grid cursor-pointer grid-cols-[1.6fr_1fr_.8fr] items-center px-3 py-[5px] hover:bg-night-600 active:bg-night-500',
                  active && 'bg-night-600',
                )}
              >
                <span className="flex min-w-0 items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Toggle favorite ${i.base}/${i.quote}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(i.pair);
                    }}
                    className={cn('shrink-0 text-txt-muted hover:text-accent', favorites.includes(i.pair) && 'text-accent')}
                  >
                    <Star size={11} fill={favorites.includes(i.pair) ? 'currentColor' : 'none'} />
                  </button>
                  <span className={cn('truncate text-[12px]', active ? 'font-semibold text-accent' : 'text-txt-primary')}>
                    {i.base}
                    <span className="text-txt-muted">/{i.quote}</span>
                  </span>
                </span>
                <span className="num truncate text-right text-[12px] text-txt-primary">
                  {price ? formatNumber(price) : '—'}
                  {!venue && price ? <sup className="ml-0.5 text-[8px] text-txt-muted">ref</sup> : null}
                </span>
                <span className={cn('num truncate text-right text-[12px]', chg >= 0 ? 'text-up' : 'text-down')}>
                  {price ? formatPct(chg) : '—'}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
