import React, { useMemo, useState } from 'react';
import { AlignLeft, BarChart3, Rows3 } from 'lucide-react';
import type { OrderBook } from '../../types/marketDataTypes';
import { cn, formatNumber } from '../../utils/format';

export interface OrderBookPanelProps {
  book: OrderBook | null;
  pricePrecision: number;
  amountPrecision: number;
  base: string;
  quote: string;
  onPickPrice: (price: number) => void;
  loading?: boolean;
}

type ViewMode = 'combined' | 'bids' | 'asks';

/** Buy/sell depth ladder with depth bars, mid-price and buy/sell ratio. */
export function OrderBookPanel({
  book,
  pricePrecision,
  amountPrecision,
  base,
  quote,
  onPickPrice,
  loading,
}: OrderBookPanelProps): React.ReactElement {
  const [mode, setMode] = useState<ViewMode>('combined');
  const [grouping, setGrouping] = useState(0);

  const rows = useMemo(() => {
    if (!book) return { bids: [], asks: [] };
    const group = (levels: typeof book.bids) => {
      if (grouping === 0) return levels.slice(0, 14);
      const step = grouping;
      const map = new Map<number, number>();
      levels.forEach((l) => {
        const key = Math.floor(l.price / step) * step;
        map.set(key, (map.get(key) ?? 0) + l.amount);
      });
      let total = 0;
      return [...map.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([price, amount]) => {
          total += amount;
          return { price, amount, total };
        })
        .slice(0, 14);
    };
    return { bids: group(book.bids), asks: group(book.asks) };
  }, [book, grouping]);

  const maxTotal = Math.max(
    rows.bids[rows.bids.length - 1]?.total ?? 1,
    rows.asks[rows.asks.length - 1]?.total ?? 1,
  );
  const bidSum = rows.bids.reduce((s, r) => s + r.amount, 0);
  const askSum = rows.asks.reduce((s, r) => s + r.amount, 0);
  const bidPct = bidSum + askSum > 0 ? Math.round((bidSum / (bidSum + askSum)) * 100) : 50;

  const mid = book ? (book.bids[0]?.price ?? 0) + ((book.asks[0]?.price ?? 0) - (book.bids[0]?.price ?? 0)) / 2 : 0;

  const Row = ({ level, side }: { level: { price: number; amount: number; total: number }; side: 'bid' | 'ask' }) => (
    <button
      type="button"
      onClick={() => onPickPrice(level.price)}
      className="depth-cell grid w-full grid-cols-3 items-center px-3 py-[3px] text-right text-[11px] hover:bg-white/[.04]"
      title="Set order price"
    >
      <span
        className="depth-bar"
        style={{
          width: `${Math.min(100, (level.total / maxTotal) * 100)}%`,
          background: side === 'bid' ? 'rgba(14,203,129,.14)' : 'rgba(246,70,93,.14)',
        }}
      />
      <span className={cn('num relative text-left font-medium', side === 'bid' ? 'text-up' : 'text-down')}>
        {formatNumber(level.price, pricePrecision)}
      </span>
      <span className="num relative text-txt-primary">{formatNumber(level.amount, amountPrecision)}</span>
      <span className="num relative text-txt-secondary">{formatNumber(level.total, amountPrecision)}</span>
    </button>
  );

  return (
    <div className="flex h-full flex-col bg-night-800">
      <div className="flex items-center gap-1 border-b border-night-600 px-3 py-2">
        {(
          [
            ['combined', Rows3],
            ['bids', BarChart3],
            ['asks', AlignLeft],
          ] as const
        ).map(([m, Icon]) => (
          <button
            key={m}
            type="button"
            aria-label={`Order book view: ${m}`}
            onClick={() => setMode(m)}
            className={cn('rounded p-1.5', mode === m ? 'bg-night-600 text-accent' : 'text-txt-secondary hover:text-txt-primary')}
          >
            <Icon size={14} />
          </button>
        ))}
        <select
          value={grouping}
          onChange={(e) => setGrouping(Number(e.target.value))}
          aria-label="Price grouping"
          className="ml-auto rounded bg-night-600 px-1.5 py-1 text-[11px] text-txt-secondary outline-none"
        >
          <option value={0}>No grouping</option>
          <option value={0.0001}>0.0001</option>
          <option value={0.001}>0.001</option>
          <option value={0.01}>0.01</option>
        </select>
      </div>

      <div className="grid grid-cols-3 px-3 py-1.5 text-[10px] text-txt-muted">
        <span>Price({quote})</span>
        <span className="text-right">Amount({base})</span>
        <span className="text-right">Total</span>
      </div>

      <div className="flex-1 overflow-hidden">
        {loading || !book ? (
          <div className="space-y-1 px-3 py-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton h-3 w-full" />
            ))}
          </div>
        ) : (
          <div className="flex h-full flex-col">
            {mode !== 'bids' && (
              <div className="flex flex-col-reverse">
                {rows.asks.slice(0, mode === 'combined' ? 9 : 16).map((l) => (
                  <Row key={`a${l.price}`} level={l} side="ask" />
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 border-y border-night-600 px-3 py-1.5">
              <span className="num text-[14px] font-bold text-up">{formatNumber(mid, pricePrecision)}</span>
              <span className="text-[10px] text-txt-muted">≈ mid price</span>
            </div>
            {mode !== 'asks' && (
              <div>
                {rows.bids.slice(0, mode === 'combined' ? 9 : 16).map((l) => (
                  <Row key={`b${l.price}`} level={l} side="bid" />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-night-600 px-3 py-2">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-up">B {bidPct}%</span>
          <span className="text-down">{100 - bidPct}% S</span>
        </div>
        <div className="mt-1 flex h-1.5 overflow-hidden rounded-full">
          <span className="bg-up" style={{ width: `${bidPct}%` }} />
          <span className="bg-down" style={{ width: `${100 - bidPct}%` }} />
        </div>
      </div>
    </div>
  );
}
