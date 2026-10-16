import React, { useState } from 'react';
import {
  BarChart3,
  Brush,
  Camera,
  CandlestickChart,
  ChevronDown,
  Crosshair,
  Expand,
  IndentIncrease,
  LineChart,
  Maximize2,
  Ruler,
  Settings,
  Shapes,
} from 'lucide-react';
import { TradingChart } from './TradingChart';
import { cn } from '../../utils/format';
import type { CandleInterval } from '../../types/marketDataTypes';
import { useUi } from '../../state/UiContext';

const INTERVALS: CandleInterval[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];

export interface ChartPanelProps {
  pair: string;
  pricePrecision: number;
  lastLabel: string;
}

/** Chart region: interval/tool toolbar, chart-type + depth toggle, chart body. */
export function ChartPanel({ pair, pricePrecision, lastLabel }: ChartPanelProps): React.ReactElement {
  const [interval, setInterval_] = useState<CandleInterval>('1d');
  const [chartType, setChartType] = useState<'candles' | 'line' | 'area'>('candles');
  const [view, setView] = useState<'chart' | 'depth'>('chart');
  const [fullscreen, setFullscreen] = useState(false);
  const { pushToast } = useUi();

  const tool = (label: string) =>
    pushToast({ tone: 'info', title: `${label} (demo)`, body: 'Drawing tools are illustrative in this frontend demo.' });

  return (
    <div className={cn('flex flex-col bg-night-800', fullscreen ? 'fixed inset-0 z-[160]' : 'h-full')}>
      <div className="flex flex-wrap items-center gap-1 border-b border-night-600 px-2 py-1.5">
        {INTERVALS.map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setInterval_(i)}
            className={cn(
              'rounded px-2 py-1 text-[11px] font-semibold',
              interval === i ? 'bg-night-500 text-accent' : 'text-txt-secondary hover:text-txt-primary',
            )}
          >
            {i}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-night-500" />
        <button type="button" aria-label="Candlestick chart" onClick={() => setChartType('candles')} className={cn('rounded p-1.5', chartType === 'candles' ? 'bg-night-500 text-accent' : 'text-txt-secondary hover:text-txt-primary')}>
          <CandlestickChart size={14} />
        </button>
        <button type="button" aria-label="Line chart" onClick={() => setChartType('line')} className={cn('rounded p-1.5', chartType === 'line' ? 'bg-night-500 text-accent' : 'text-txt-secondary hover:text-txt-primary')}>
          <LineChart size={14} />
        </button>
        <button type="button" aria-label="Area chart" onClick={() => setChartType('area')} className={cn('rounded p-1.5', chartType === 'area' ? 'bg-night-500 text-accent' : 'text-txt-secondary hover:text-txt-primary')}>
          <BarChart3 size={14} />
        </button>
        <span className="mx-1 h-4 w-px bg-night-500" />
        <button type="button" aria-label="Drawing tools" onClick={() => tool('Drawing tools')} className="rounded p-1.5 text-txt-secondary hover:text-txt-primary">
          <Brush size={14} />
        </button>
        <button type="button" aria-label="Trend line" onClick={() => tool('Trend line')} className="rounded p-1.5 text-txt-secondary hover:text-txt-primary">
          <Ruler size={14} />
        </button>
        <button type="button" aria-label="Shapes" onClick={() => tool('Shapes')} className="rounded p-1.5 text-txt-secondary hover:text-txt-primary">
          <Shapes size={14} />
        </button>
        <button type="button" aria-label="Crosshair" onClick={() => tool('Crosshair')} className="rounded p-1.5 text-txt-secondary hover:text-txt-primary">
          <Crosshair size={14} />
        </button>
        <button
          type="button"
          aria-label="Indicators"
          onClick={() => pushToast({ tone: 'info', title: 'Indicators', body: 'MA(5/25/60) overlays are enabled by default; RSI & MACD panes ship with the licensed charting build.' })}
          className="rounded p-1.5 text-txt-secondary hover:text-txt-primary"
        >
          <IndentIncrease size={14} />
        </button>
        <button type="button" aria-label="Chart settings" onClick={() => tool('Chart settings')} className="rounded p-1.5 text-txt-secondary hover:text-txt-primary">
          <Settings size={14} />
        </button>
        <button type="button" aria-label="Save chart layout" onClick={() => pushToast({ tone: 'success', title: 'Layout saved', body: 'Chart layout stored locally for this demo session.' })} className="rounded p-1.5 text-txt-secondary hover:text-txt-primary">
          <Camera size={14} />
        </button>

        <div className="ml-auto flex items-center gap-1">
          <div className="flex overflow-hidden rounded-lg border border-night-500">
            <button
              type="button"
              onClick={() => setView('chart')}
              className={cn('px-2.5 py-1 text-[11px] font-semibold', view === 'chart' ? 'bg-night-500 text-accent' : 'text-txt-secondary')}
            >
              Chart
            </button>
            <button
              type="button"
              onClick={() => setView('depth')}
              className={cn('px-2.5 py-1 text-[11px] font-semibold', view === 'depth' ? 'bg-night-500 text-accent' : 'text-txt-secondary')}
            >
              Depth
            </button>
          </div>
          <button
            type="button"
            aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            onClick={() => setFullscreen((f) => !f)}
            className="rounded p-1.5 text-txt-secondary hover:text-txt-primary"
          >
            {fullscreen ? <Maximize2 size={14} /> : <Expand size={14} />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 px-3 py-1.5 text-[11px] text-txt-secondary">
        <span className="font-semibold text-txt-primary">
          {pair.toUpperCase().replace('_', '/')} · {interval}
        </span>
        <span className="num text-up">{lastLabel}</span>
        <span className="ml-auto flex items-center gap-1 text-txt-muted">
          Chart type: {chartType}
          <ChevronDown size={11} />
        </span>
      </div>

      <div className="min-h-[320px] flex-1">
        {view === 'chart' ? (
          <TradingChart pair={pair} interval={interval} pricePrecision={pricePrecision} />
        ) : (
          <DepthPlaceholder />
        )}
      </div>
    </div>
  );
}

function DepthPlaceholder(): React.ReactElement {
  const bars = Array.from({ length: 40 }, (_, i) => ({
    x: i,
    bid: 40 + Math.sin(i / 5) * 18 + i * 1.2,
    ask: 40 + Math.cos(i / 6) * 16 + i * 1.25,
  }));
  const max = Math.max(...bars.map((b) => Math.max(b.bid, b.ask)));
  return (
    <div className="flex h-full flex-col justify-end p-4">
      <svg viewBox="0 0 400 160" className="h-full w-full" preserveAspectRatio="none" aria-label="Depth chart">
        <path
          d={`M0,160 ${bars.map((b) => `L${(b.x / 39) * 200},${160 - (b.bid / max) * 150}`).join(' ')} L200,160 Z`}
          fill="rgba(14,203,129,.35)"
        />
        <path
          d={`M400,160 ${bars.map((b) => `L${200 + (b.x / 39) * 200},${160 - (b.ask / max) * 150}`).join(' ')} L200,160 Z`}
          fill="rgba(246,70,93,.35)"
        />
      </svg>
      <p className="mt-2 text-center text-[11px] text-txt-muted">Cumulative depth (bid vs ask) — simulated aggregation</p>
    </div>
  );
}
