import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, X } from 'lucide-react';
import { QUOTE_FILTERS, TRADING_PAIRS } from '../../data/constants';
import { useTopMarkets } from '../../hooks/useTopMarkets';
import { cn, formatNumber, formatPct } from '../../utils/format';
import type { TradingPairMeta } from '../../types/marketDataTypes';

export interface PairSidebarProps {
  activePair: string;
  favorites: string[];
  toggleFavorite: (pair: string) => void;
}

/** Searchable pair list with quote-currency filters and selected-row state. */
export function PairSidebar({ activePair, favorites, toggleFavorite }: PairSidebarProps): React.ReactElement {
  const navigate = useNavigate();
  const { bySymbol } = useTopMarkets();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>('USDT');
  const [favOnly, setFavOnly] = useState(false);

  const rows = useMemo(() => {
    const needle = query.trim().toUpperCase();
    return TRADING_PAIRS.filter((p) => {
      if (favOnly && !favorites.includes(p.pair)) return false;
      if (filter !== 'ALL' && p.category !== filter) return false;
      if (needle && !`${p.base}/${p.quote}`.includes(needle) && !p.base.includes(needle)) return false;
      return true;
    }).slice(0, 60);
  }, [query, filter, favOnly, favorites]);

  const priceOf = (p: TradingPairMeta): { price: number; chg: number } => {
    const a = bySymbol.get(p.base);
    if (a) return { price: a.priceUsd, chg: a.change24hPct };
    return { price: 0, chg: 0 };
  };

  return (
    <div className="flex h-full flex-col bg-night-800">
      <div className="p-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-txt-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search trading pairs"
            className="w-full rounded-lg bg-night-600 py-1.5 pl-8 pr-7 text-[12px] text-txt-primary outline-none placeholder:text-txt-muted"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-txt-muted hover:text-txt-primary"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="no-scrollbar flex items-center gap-1 overflow-x-auto px-2 pb-2">
        <button
          type="button"
          onClick={() => setFavOnly((f) => !f)}
          className={cn('rounded p-1.5', favOnly ? 'text-accent' : 'text-txt-secondary hover:text-txt-primary')}
          aria-label="Show favorites only"
        >
          <Star size={13} fill={favOnly ? 'currentColor' : 'none'} />
        </button>
        {QUOTE_FILTERS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setFilter(q)}
            className={cn(
              'whitespace-nowrap rounded px-2 py-1 text-[11px] font-semibold',
              filter === q ? 'bg-night-500 text-accent' : 'text-txt-secondary hover:text-txt-primary',
            )}
          >
            {q}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[1.6fr_1fr_.8fr] px-3 py-1 text-[10px] text-txt-muted">
        <span>Pair</span>
        <span className="text-right">Price</span>
        <span className="text-right">Change</span>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin">
        {rows.length === 0 ? (
          <div className="px-3 py-6 text-center text-[11px] text-txt-muted">No matching pairs</div>
        ) : (
          rows.map((p) => {
            const { price, chg } = priceOf(p);
            const active = p.pair === activePair;
            return (
              <div
                key={p.pair}
                className={cn(
                  'group grid cursor-pointer grid-cols-[1.6fr_1fr_.8fr] items-center px-3 py-[5px] hover:bg-night-600',
                  active && 'bg-night-600',
                )}
                onClick={() => navigate(`/trade/${p.pair}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/trade/${p.pair}`)}
              >
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Toggle favorite ${p.base}/${p.quote}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(p.pair);
                    }}
                    className={cn('text-txt-muted hover:text-accent', favorites.includes(p.pair) && 'text-accent')}
                  >
                    <Star size={11} fill={favorites.includes(p.pair) ? 'currentColor' : 'none'} />
                  </button>
                  <span className={cn('text-[12px]', active ? 'font-semibold text-accent' : 'text-txt-primary')}>
                    {p.base}
                    <span className="text-txt-muted">/{p.quote}</span>
                  </span>
                </span>
                <span className="num text-right text-[12px] text-txt-primary">
                  {price ? formatNumber(price) : '—'}
                </span>
                <span className={cn('num text-right text-[12px]', chg >= 0 ? 'text-up' : 'text-down')}>
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
