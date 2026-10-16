import React from 'react';
import { ChevronDown, RefreshCw, Settings2 } from 'lucide-react';
import type { PairTicker } from '../../types/marketDataTypes';
import { CoinIcon } from '../market/CoinIcon';
import { DataSourceBadge } from '../ui/primitives';
import { cn, formatCompact, formatNumber, formatPct } from '../../utils/format';
import { useUi } from '../../state/UiContext';

export interface TickerHeaderProps {
  pair: string;
  base: string;
  quote: string;
  ticker: PairTicker | null;
  sourceLabel: string;
  sourceState: 'live' | 'cached' | 'stale' | 'simulated' | 'loading' | 'error';
  onRefresh: () => void;
  onOpenSelector: () => void;
  pricePrecision: number;
}

/** Pair + 24h statistics strip shown above the trading grid. */
export function TickerHeader(p: TickerHeaderProps): React.ReactElement {
  const { openModal } = useUi();
  const t = p.ticker;
  const up = (t?.change24hPct ?? 0) >= 0;

  const Cell = ({ label, value, cls }: { label: string; value: React.ReactNode; cls?: string }) => (
    <div className="min-w-[86px]">
      <div className="text-[10px] text-txt-muted">{label}</div>
      <div className={cn('num mt-0.5 text-[13px] font-semibold', cls ?? 'text-txt-primary')}>{value}</div>
    </div>
  );

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-night-600 bg-night-800 px-4 py-2.5">
      <button
        type="button"
        onClick={p.onOpenSelector}
        className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-night-600"
        aria-label="Open pair selector"
      >
        <CoinIcon symbol={p.base} size={22} />
        <span className="text-left">
          <span className="block text-[15px] font-bold text-txt-primary">
            {p.base}/{p.quote}
          </span>
          <span className="block text-[10px] text-txt-muted">Spot</span>
        </span>
        <ChevronDown size={14} className="text-txt-muted" />
      </button>

      <Cell label="Price" value={t ? formatNumber(t.last, p.pricePrecision) : '--'} cls={up ? 'text-up' : 'text-down'} />
      <Cell label="24h Chg" value={t ? formatPct(t.change24hPct) : '--'} cls={up ? 'text-up' : 'text-down'} />
      <Cell label="24h High" value={t ? formatNumber(t.high24h, p.pricePrecision) : '--'} />
      <Cell label="24h Low" value={t ? formatNumber(t.low24h, p.pricePrecision) : '--'} />
      <Cell label={`24h Vol(${p.base})`} value={t ? formatCompact(t.baseVolume24h) : '--'} />
      <Cell label={`24h Vol(${p.quote})`} value={t ? formatCompact(t.quoteVolume24h) : '--'} />

      <div className="ml-auto flex items-center gap-2">
        <DataSourceBadge state={p.sourceState} label={p.sourceLabel} />
        <button type="button" aria-label="Refresh market data" onClick={p.onRefresh} className="rounded p-1.5 text-txt-secondary hover:bg-night-600 hover:text-txt-primary">
          <RefreshCw size={14} />
        </button>
        <button
          type="button"
          aria-label="Chart settings"
          onClick={() => openModal('confirm', { title: 'Display settings', body: 'Chart theme, precision and layout preferences are stored locally in this demo.', confirmLabel: 'Got it', action: () => undefined })}
          className="rounded p-1.5 text-txt-secondary hover:bg-night-600 hover:text-txt-primary"
        >
          <Settings2 size={14} />
        </button>
      </div>
    </div>
  );
}
