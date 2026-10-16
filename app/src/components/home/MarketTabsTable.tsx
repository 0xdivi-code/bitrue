import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpDown, Search } from 'lucide-react';
import { CoinIcon } from '../market/CoinIcon';
import { Sparkline } from '../market/Sparkline';
import { DataSourceBadge, EmptyState, SkeletonRow } from '../ui/primitives';
import { useTopMarkets } from '../../hooks/useTopMarkets';
import { cn, formatCompact, formatPct, formatUsd, timeAgo } from '../../utils/format';
import type { GlobalAsset } from '../../types/marketDataTypes';

type TabId = 'gainers' | 'usdt-futures' | 'coinm-futures' | 'usdc-futures' | 'new' | 'losers' | 'alpha';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'gainers', label: 'TOP GAINERS' },
  { id: 'usdt-futures', label: 'USDT FUTURES' },
  { id: 'coinm-futures', label: 'COIN-M FUTURES' },
  { id: 'usdc-futures', label: 'USDC FUTURES' },
  { id: 'new', label: 'NEW LISTED' },
  { id: 'losers', label: 'TOP LOSERS' },
  { id: 'alpha', label: 'Alpha' },
];

type SortKey = 'rank' | 'price' | 'change' | 'volume' | 'mcap';

/** Market tabs + sortable/searchable table driven by the shared top-50 store. */
export function MarketTabsTable(): React.ReactElement {
  const navigate = useNavigate();
  const { snapshot, gainers, losers, search } = useTopMarkets();
  const [tab, setTab] = useState<TabId>('gainers');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'rank', dir: 1 });

  const rows = useMemo(() => {
    let base: GlobalAsset[];
    switch (tab) {
      case 'gainers':
        base = gainers;
        break;
      case 'losers':
        base = losers;
        break;
      case 'new':
        base = [...snapshot.assets].slice(-12).reverse();
        break;
      case 'alpha':
        base = snapshot.assets.filter((_, i) => i % 4 === 1).slice(0, 10);
        break;
      case 'usdt-futures':
        base = snapshot.assets.slice(0, 12);
        break;
      case 'coinm-futures':
        base = snapshot.assets.slice(4, 16);
        break;
      case 'usdc-futures':
        base = snapshot.assets.slice(8, 20);
        break;
      default:
        base = snapshot.assets;
    }
    const filtered = query.trim() ? search(query) : base;
    const set = query.trim() ? filtered : base;
    const sorted = [...set].sort((a, b) => {
      const dir = sort.dir;
      switch (sort.key) {
        case 'price':
          return (a.priceUsd - b.priceUsd) * dir;
        case 'change':
          return (a.change24hPct - b.change24hPct) * dir;
        case 'volume':
          return (a.volume24hUsd - b.volume24hUsd) * dir;
        case 'mcap':
          return (a.marketCapUsd - b.marketCapUsd) * dir;
        default:
          return ((a.rank ?? 0) - (b.rank ?? 0)) * dir;
      }
    });
    return sorted.slice(0, 10);
  }, [tab, query, sort, snapshot, gainers, losers, search]);

  const loading = snapshot.state === 'loading';

  const sortBtn = (key: SortKey, label: string) => (
    <button
      type="button"
      onClick={() => setSort((s) => ({ key, dir: s.key === key ? ((s.dir * -1) as 1 | -1) : 1 }))}
      className={cn('inline-flex items-center gap-1 hover:text-txt-dark', sort.key === key && 'text-txt-dark')}
    >
      {label}
      <ArrowUpDown size={11} />
    </button>
  );

  return (
    <section className="mx-auto max-w-shell px-4 pt-12">
      <div className="flex flex-wrap items-center gap-x-7 gap-y-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'relative pb-2 text-[14px] font-bold tracking-wide transition-colors',
              tab === t.id ? 'text-txt-dark' : 'text-txt-darksec hover:text-txt-dark',
            )}
          >
            {t.label}
            {tab === t.id && <span className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded bg-accent" />}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-txt-darksec" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or symbol"
            aria-label="Search markets"
            className="input-light w-[190px] rounded-lg border border-bd-light bg-white py-1.5 pl-8 pr-2 text-[12px] outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-bd-light bg-white shadow-card">
        <div className="grid grid-cols-[2fr_1.2fr_1fr_1.2fr_1.2fr_1fr] items-center gap-2 border-b border-bd-light px-5 py-3 text-[12px] text-txt-darksec">
          <span>{sortBtn('rank', 'Top Traded Pairs')}</span>
          <span className="text-right">{sortBtn('price', 'Price')}</span>
          <span className="text-right">{sortBtn('change', '24h Chg')}</span>
          <span className="text-right">{sortBtn('volume', '24h Volume')}</span>
          <span className="text-right">{sortBtn('mcap', 'Market Cap')}</span>
          <span className="text-right">7D Chart</span>
        </div>

        {loading ? (
          <div>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonRow key={i} cols={6} tone="light" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState tone="light" title="No assets match your search." />
        ) : (
          rows.map((a) => (
            <button
              key={a.providerId}
              type="button"
              onClick={() => navigate(`/trade/${a.symbol.toLowerCase()}_usdt`)}
              className="grid w-full grid-cols-[2fr_1.2fr_1fr_1.2fr_1.2fr_1fr] items-center gap-2 border-b border-bd-light/60 px-5 py-3 text-left transition-colors last:border-0 hover:bg-black/[.03]"
            >
              <span className="flex items-center gap-2">
                <CoinIcon symbol={a.symbol} size={24} logoUrl={a.logoUrl} />
                <span>
                  <span className="block text-[13px] font-semibold text-txt-dark">{a.symbol}</span>
                  <span className="block text-[11px] text-txt-darksec">{a.name}</span>
                </span>
                <span className="ml-1 rounded bg-black/[.05] px-1.5 py-0.5 text-[10px] font-medium text-txt-darksec">
                  Spot
                </span>
              </span>
              <span className="num text-right text-[13px] font-semibold text-txt-dark">{formatUsd(a.priceUsd)}</span>
              <span className={cn('num text-right text-[13px] font-semibold', a.change24hPct >= 0 ? 'text-up' : 'text-down')}>
                {formatPct(a.change24hPct)}
              </span>
              <span className="num text-right text-[13px] text-txt-darksec">${formatCompact(a.volume24hUsd)}</span>
              <span className="num text-right text-[13px] text-txt-darksec">${formatCompact(a.marketCapUsd)}</span>
              <span className="flex justify-end">
                {a.sparkline7d ? (
                  <Sparkline data={a.sparkline7d.slice(-28)} positive={a.change24hPct >= 0} width={90} height={26} />
                ) : (
                  <span className="h-6 w-[90px] rounded bg-black/[.04]" />
                )}
              </span>
            </button>
          ))
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-txt-darksec">
        <DataSourceBadge tone="light" state={snapshot.state} label={`${snapshot.source} · top 50 by market cap`} />
        <span>
          {snapshot.lastSuccessAt
            ? `Last updated ${timeAgo(snapshot.lastSuccessAt)} · auto-refresh 60s`
            : 'Waiting for first update…'}
        </span>
      </div>
    </section>
  );
}
