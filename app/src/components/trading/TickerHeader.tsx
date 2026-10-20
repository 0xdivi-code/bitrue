import React from 'react';
import { ChevronDown, RefreshCw, Settings2 } from 'lucide-react';
import type { ExchangeId, FundingInfo, MarketType, PairTicker } from '../../types/marketDataTypes';
import { CoinIcon } from '../market/CoinIcon';
import { DataSourceBadge } from '../ui/primitives';
import { Dropdown, MenuItem } from '../ui/Dropdown';
import { cn, formatCompact, formatNumber, formatPct } from '../../utils/format';
import { useUi } from '../../state/UiContext';

export const EXCHANGES: Array<{ id: ExchangeId; label: string }> = [
  { id: 'binance', label: 'Binance' },
  { id: 'bybit', label: 'Bybit' },
  { id: 'okx', label: 'OKX' },
];

export interface TickerHeaderProps {
  pair: string;
  base: string;
  quote: string;
  exchange: ExchangeId;
  marketType: MarketType;
  onExchange: (ex: ExchangeId) => void;
  onMarketType: (m: MarketType) => void;
  ticker: PairTicker | null;
  funding: FundingInfo | null;
  sourceLabel: string;
  sourceState: 'live' | 'cached' | 'stale' | 'simulated' | 'loading' | 'error';
  onRefresh: () => void;
  onOpenSelector: () => void;
  pricePrecision: number;
  instrumentRules?: string;
}

/** Instrument header: venue + market-type switch, 24h stats, perp funding info. */
export function TickerHeader(p: TickerHeaderProps): React.ReactElement {
  const { openModal } = useUi();
  const t = p.ticker;
  const up = (t?.change24hPct ?? 0) >= 0;
  const exLabel = EXCHANGES.find((e) => e.id === p.exchange)?.label ?? p.exchange;

  const Cell = ({ label, value, cls }: { label: string; value: React.ReactNode; cls?: string }) => (
    <div className="min-w-[76px]">
      <div className="truncate text-[10px] text-txt-muted">{label}</div>
      <div className={cn('num mt-0.5 truncate text-[13px] font-semibold', cls ?? 'text-txt-primary')}>{value}</div>
    </div>
  );

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-night-600 bg-night-800 px-3 py-2.5 md:px-4">
      <button
        type="button"
        onClick={p.onOpenSelector}
        className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1 hover:bg-night-600 active:bg-night-500"
        aria-label="Open market selector"
      >
        <CoinIcon symbol={p.base} size={22} />
        <span className="min-w-0 text-left">
          <span className="block truncate text-[15px] font-bold text-txt-primary">
            {p.base}/{p.quote}
          </span>
          <span className="block truncate text-[10px] capitalize text-txt-muted">
            {p.marketType === 'swap' ? 'Perpetual' : 'Spot'}
          </span>
        </span>
        <ChevronDown size={14} className="shrink-0 text-txt-muted" />
      </button>

      {/* venue switch */}
      <Dropdown
        width={150}
        trigger={(open) => (
          <span
            className={cn(
              'flex items-center gap-1 rounded-lg border border-night-500 px-2.5 py-1.5 text-[11px] font-bold',
              open ? 'bg-night-500 text-accent' : 'text-txt-secondary hover:text-txt-primary',
            )}
          >
            {exLabel}
            <ChevronDown size={12} />
          </span>
        )}
      >
        {(close) => (
          <div className="py-1">
            {EXCHANGES.map((e) => (
              <MenuItem
                key={e.id}
                active={e.id === p.exchange}
                onClick={() => {
                  p.onExchange(e.id);
                  close();
                }}
              >
                {e.label}
              </MenuItem>
            ))}
          </div>
        )}
      </Dropdown>

      {/* spot / perpetual switch */}
      <div className="flex overflow-hidden rounded-lg border border-night-500" role="group" aria-label="Market type">
        {(['spot', 'swap'] as MarketType[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => p.onMarketType(m)}
            className={cn(
              'px-2.5 py-1.5 text-[11px] font-bold transition-colors active:scale-[.97]',
              p.marketType === m ? 'bg-night-500 text-accent' : 'text-txt-secondary hover:text-txt-primary',
            )}
          >
            {m === 'spot' ? 'Spot' : 'Perpetual'}
          </button>
        ))}
      </div>

      <Cell label="Price" value={t ? formatNumber(t.last, p.pricePrecision) : '--'} cls={up ? 'text-up' : 'text-down'} />
      <Cell label="24h Chg" value={t ? formatPct(t.change24hPct) : '--'} cls={up ? 'text-up' : 'text-down'} />
      <Cell label="24h High" value={t ? formatNumber(t.high24h, p.pricePrecision) : '--'} />
      <Cell label="24h Low" value={t ? formatNumber(t.low24h, p.pricePrecision) : '--'} />
      <Cell label={`24h Vol(${p.base})`} value={t ? formatCompact(t.baseVolume24h) : '--'} />
      <Cell label={`24h Vol(${p.quote})`} value={t ? formatCompact(t.quoteVolume24h) : '--'} />
      {p.marketType === 'swap' && (
        <>
          <Cell label="Mark Price" value={p.funding?.markPrice ? formatNumber(p.funding.markPrice, p.pricePrecision) : '--'} />
          <Cell label="Index Price" value={p.funding?.indexPrice ? formatNumber(p.funding.indexPrice, p.pricePrecision) : '--'} />
          <Cell
            label="Funding / Next"
            value={
              p.funding?.fundingRate != null ? (
                <span className={p.funding.fundingRate >= 0 ? 'text-up' : 'text-down'}>
                  {(p.funding.fundingRate * 100).toFixed(4)}%
                </span>
              ) : (
                '--'
              )
            }
          />
        </>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        <DataSourceBadge state={p.sourceState} label={p.sourceLabel} />
        <button
          type="button"
          aria-label="Refresh market data"
          onClick={p.onRefresh}
          className="rounded p-1.5 text-txt-secondary transition-colors hover:bg-night-600 hover:text-txt-primary active:bg-night-500"
        >
          <RefreshCw size={14} />
        </button>
        <button
          type="button"
          aria-label="Instrument settings"
          onClick={() =>
            openModal('confirm', {
              title: 'Instrument rules',
              body: p.instrumentRules ?? 'Tick size, step size and minimum order sizes come from the selected venue catalog and are enforced by the demo order form.',
              confirmLabel: 'Got it',
              action: () => undefined,
            })
          }
          className="rounded p-1.5 text-txt-secondary transition-colors hover:bg-night-600 hover:text-txt-primary active:bg-night-500"
        >
          <Settings2 size={14} />
        </button>
      </div>
    </div>
  );
}
