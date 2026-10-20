import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useInstruments } from '../../hooks/useInstruments';
import { pairMarketStore, mkKey } from '../../services/marketDataService';
import { useTopMarkets } from '../../hooks/useTopMarkets';
import type { ExchangeId, MarketType } from '../../types/marketDataTypes';
import { cn, formatNumber, formatPct } from '../../utils/format';

/** Venue-catalog market selector: search + quote filter + trading-rule hints. */
export function PairSelectorModal({
  open,
  activePair,
  exchange,
  marketType,
  onClose,
}: {
  open: boolean;
  activePair: string;
  exchange: ExchangeId;
  marketType: MarketType;
  onClose: () => void;
}): React.ReactElement {
  const navigate = useNavigate();
  const { bySymbol } = useTopMarkets();
  const { instruments, loading } = useInstruments(exchange, marketType);
  const [query, setQuery] = useState('');
  const [quote, setQuote] = useState('ALL');

  const quotes = useMemo(() => ['ALL', ...new Set(instruments.map((i) => i.quote))].slice(0, 8), [instruments]);

  const rows = useMemo(() => {
    const needle = query.trim().toUpperCase();
    return instruments
      .filter((i) => (quote === 'ALL' || i.quote === quote) && (!needle || `${i.base}/${i.quote}`.includes(needle)))
      .slice(0, 120);
  }, [instruments, query, quote]);

  const priceOf = (pair: string, base: string) => {
    const cached = pairMarketStore.getState(mkKey(exchange, marketType, pair)).ticker;
    if (cached?.last) return { price: cached.last, chg: cached.change24hPct, venue: true };
    const g = bySymbol.get(base);
    return g ? { price: g.priceUsd, chg: g.change24hPct, venue: false } : { price: 0, chg: 0, venue: false };
  };

  return (
    <Modal open={open} onClose={onClose} title={`Select Market · ${exchange} ${marketType === 'swap' ? 'perpetual' : 'spot'}`} width={680} tone="dark">
      <div className="pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pair, e.g. XRP/USDT"
              aria-label="Search pairs"
              className="w-full rounded-lg bg-night-600 py-2 pl-9 pr-8 text-[12px] text-txt-primary outline-none focus:ring-1 focus:ring-accent"
            />
            {query && (
              <button type="button" aria-label="Clear" onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-txt-muted">
                <X size={13} />
              </button>
            )}
          </div>
          {quotes.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setQuote(q)}
              className={cn(
                'rounded px-2.5 py-1.5 text-[11px] font-semibold',
                quote === q ? 'bg-night-500 text-accent' : 'bg-night-600 text-txt-secondary hover:text-txt-primary',
              )}
            >
              {q}
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-[1.3fr_1fr_.8fr_1.1fr] px-2 py-1 text-[10px] text-txt-muted">
          <span>Pair</span>
          <span className="text-right">Last</span>
          <span className="text-right">24h</span>
          <span className="text-right">Min order</span>
        </div>
        <div className="max-h-[340px] overflow-y-auto scroll-thin">
          {loading ? (
            <div className="space-y-1.5 px-2 py-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton h-5 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="py-8 text-center text-[12px] text-txt-muted">No instruments match “{query}”.</div>
          ) : (
            rows.map((i) => {
              const { price, chg, venue } = priceOf(i.pair, i.base);
              const active = i.pair === activePair;
              return (
                <button
                  key={i.symbol}
                  type="button"
                  onClick={() => {
                    navigate(`/trade/${i.pair}?ex=${exchange}${marketType === 'swap' ? '&m=swap' : ''}`);
                    onClose();
                  }}
                  className={cn(
                    'grid w-full grid-cols-[1.3fr_1fr_.8fr_1.1fr] items-center px-2 py-2 text-left hover:bg-night-600 active:bg-night-500',
                    active && 'bg-night-600',
                  )}
                >
                  <span className={cn('truncate text-[12px] font-semibold', active ? 'text-accent' : 'text-txt-primary')}>
                    {i.base}/{i.quote}
                    {i.settle && i.settle !== i.quote && <span className="ml-1 text-[9px] text-txt-muted">{i.settle}-M</span>}
                  </span>
                  <span className="num truncate text-right text-[12px] text-txt-primary">
                    {price ? formatNumber(price) : '—'}
                    {!venue && price ? <sup className="ml-0.5 text-[8px] text-txt-muted">ref</sup> : null}
                  </span>
                  <span className={cn('num truncate text-right text-[12px]', chg >= 0 ? 'text-up' : 'text-down')}>
                    {price ? formatPct(chg) : '—'}
                  </span>
                  <span className="num truncate text-right text-[10px] text-txt-secondary">
                    {i.minAmount ? `${i.minAmount} ${i.base}` : i.minCost ? `${i.minCost} ${i.quote}` : '—'}
                  </span>
                </button>
              );
            })
          )}
        </div>
        <p className="mt-2 text-[10px] text-txt-muted">
          Catalog loaded live from {exchange}. Tick/step sizes and minimums are enforced by the order form.
        </p>
      </div>
    </Modal>
  );
}
