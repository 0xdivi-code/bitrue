import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { QUOTE_FILTERS, TRADING_PAIRS } from '../../data/constants';
import { useTopMarkets } from '../../hooks/useTopMarkets';
import { cn, formatNumber, formatPct } from '../../utils/format';

/** Full-screen-capable market pair selector with search + quote filters. */
export function PairSelectorModal({
  open,
  activePair,
  onClose,
}: {
  open: boolean;
  activePair: string;
  onClose: () => void;
}): React.ReactElement {
  const navigate = useNavigate();
  const { bySymbol } = useTopMarkets();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>('ALL');

  const rows = useMemo(() => {
    const needle = query.trim().toUpperCase();
    return TRADING_PAIRS.filter((p) => {
      if (filter !== 'ALL' && p.category !== filter) return false;
      if (needle && !`${p.base}/${p.quote}`.includes(needle)) return false;
      return true;
    });
  }, [query, filter]);

  return (
    <Modal open={open} onClose={onClose} title="Select Market" width={640} tone="dark">
      <div className="pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pair, e.g. XRP/USDT"
              aria-label="Search pairs"
              className="w-full rounded-lg bg-night-600 py-2 pl-9 pr-8 text-[12px] text-txt-primary outline-none"
            />
            {query && (
              <button type="button" aria-label="Clear" onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-txt-muted">
                <X size={13} />
              </button>
            )}
          </div>
          {['ALL', ...QUOTE_FILTERS].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setFilter(q)}
              className={cn(
                'rounded px-2.5 py-1.5 text-[11px] font-semibold',
                filter === q ? 'bg-night-500 text-accent' : 'bg-night-600 text-txt-secondary hover:text-txt-primary',
              )}
            >
              {q}
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-[1.4fr_1fr_1fr] px-2 py-1 text-[10px] text-txt-muted">
          <span>Pair</span>
          <span className="text-right">Last price</span>
          <span className="text-right">24h change</span>
        </div>
        <div className="max-h-[340px] overflow-y-auto scroll-thin">
          {rows.length === 0 ? (
            <div className="py-8 text-center text-[12px] text-txt-muted">No pairs match “{query}”.</div>
          ) : (
            rows.map((p) => {
              const a = bySymbol.get(p.base);
              const active = p.pair === activePair;
              return (
                <button
                  key={p.pair}
                  type="button"
                  onClick={() => {
                    navigate(`/trade/${p.pair}`);
                    onClose();
                  }}
                  className={cn(
                    'grid w-full grid-cols-[1.4fr_1fr_1fr] items-center px-2 py-2 text-left hover:bg-night-600',
                    active && 'bg-night-600',
                  )}
                >
                  <span className={cn('text-[12px] font-semibold', active ? 'text-accent' : 'text-txt-primary')}>
                    {p.base}/{p.quote}
                    <span className="ml-2 rounded bg-night-600 px-1.5 py-0.5 text-[9px] font-medium text-txt-muted">{p.category}</span>
                  </span>
                  <span className="num text-right text-[12px] text-txt-primary">{a ? formatNumber(a.priceUsd) : '—'}</span>
                  <span className={cn('num text-right text-[12px]', (a?.change24hPct ?? 0) >= 0 ? 'text-up' : 'text-down')}>
                    {a ? formatPct(a.change24hPct) : '—'}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
