import React from 'react';
import type { TradeTick } from '../../types/marketDataTypes';
import { cn, formatNumber, formatTime } from '../../utils/format';

export interface RecentTradesPanelProps {
  trades: TradeTick[];
  pricePrecision: number;
  amountPrecision: number;
  base: string;
  quote: string;
  loading?: boolean;
}

/** Market trades tape (price / amount / time) with taker-side coloring. */
export function RecentTradesPanel({ trades, pricePrecision, amountPrecision, base, quote, loading }: RecentTradesPanelProps): React.ReactElement {
  return (
    <div className="flex h-full flex-col bg-night-800">
      <div className="border-b border-night-600 px-3 py-2 text-[13px] font-semibold text-txt-primary">Trades</div>
      <div className="grid grid-cols-3 px-3 py-1.5 text-[10px] text-txt-muted">
        <span>Price({quote})</span>
        <span className="text-right">Vol({base})</span>
        <span className="text-right">Time</span>
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin">
        {loading ? (
          <div className="space-y-1 px-3 py-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="skeleton h-3 w-full" />
            ))}
          </div>
        ) : trades.length === 0 ? (
          <div className="px-3 py-6 text-center text-[11px] text-txt-muted">No trades yet</div>
        ) : (
          trades.slice(0, 40).map((t) => (
            <div key={t.id} className="grid grid-cols-3 px-3 py-[3px] text-right text-[11px]">
              <span className={cn('num text-left font-medium', t.side === 'buy' ? 'text-up' : 'text-down')}>
                {formatNumber(t.price, pricePrecision)}
              </span>
              <span className="num text-txt-primary">{formatNumber(t.amount, amountPrecision)}</span>
              <span className="num text-txt-secondary">{formatTime(t.time)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
