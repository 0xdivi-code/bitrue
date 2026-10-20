import React, { useEffect, useRef, useState } from 'react';
import {
  ColorType,
  CrosshairMode,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts';
import type { CandleInterval } from '../../types/marketDataTypes';
import {
  createTradingViewDatafeed,
  intervalToResolution,
  symbolInfoForStoreKey,
  type ChartSymbolInfo,
} from '../../services/tradingViewDatafeed';
import { cn } from '../../utils/format';

export interface TradingChartProps {
  /** composite store key "<exchange>|<marketType>|<pair>" */
  storeKey: string;
  interval: CandleInterval;
  pricePrecision: number;
  onCrosshairPrice?: (price: number | null) => void;
  className?: string;
}

interface Bar {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * TradingView Lightweight Charts renderer driven by the TradingView-shaped
 * datafeed adapter (getBars + subscribeBars). Swap-in point for the licensed
 * Advanced Charts widget: the same datafeed satisfies its IDatafeedChartApi.
 */
export function TradingChart({ storeKey, interval, pricePrecision, onCrosshairPrice, className }: TradingChartProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const listenerRef = useRef<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: '#0b0e11' },
        textColor: '#848e9c',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#161b22' },
        horzLines: { color: '#161b22' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#3a4150', labelBackgroundColor: '#2a2f3a' },
        horzLine: { color: '#3a4150', labelBackgroundColor: '#2a2f3a' },
      },
      rightPriceScale: { borderColor: '#232a35' },
      timeScale: { borderColor: '#232a35', timeVisible: true, secondsVisible: false },
      autoSize: true,
    });
    chartRef.current = chart;

    const candles = chart.addCandlestickSeries({
      upColor: '#0ecb81',
      downColor: '#f6465d',
      borderUpColor: '#0ecb81',
      borderDownColor: '#f6465d',
      wickUpColor: '#0ecb81',
      wickDownColor: '#f6465d',
      priceFormat: { type: 'price', precision: pricePrecision, minMove: Math.pow(10, -pricePrecision) },
    });
    candleRef.current = candles;

    const volume = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'vol',
    });
    volumeRef.current = volume;
    chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

    chart.subscribeCrosshairMove((param) => {
      const p = param.seriesData.get(candles) as { close?: number } | undefined;
      onCrosshairPrice?.(p?.close ?? null);
    });

    const datafeed = createTradingViewDatafeed();
    const symbol: ChartSymbolInfo = symbolInfoForStoreKey(storeKey, pricePrecision);
    const resolution = intervalToResolution(interval);
    setStatus('loading');

    datafeed.getBars(
      symbol,
      resolution,
      { from: Math.floor(Date.now() / 1000) - 300 * 86400, to: Math.floor(Date.now() / 1000), firstDataRequest: true },
      (bars, meta) => {
        if (meta?.noData || bars.length === 0) {
          setStatus('empty');
          return;
        }
        // datafeed emits TradingView-style ms timestamps; Lightweight Charts
        // expects UTC seconds — convert once at the boundary.
        const sec = bars.map((b) => ({ ...b, time: Math.floor(b.time / 1000) as UTCTimestamp }));
        candles.setData(sec as Bar[]);
        volume.setData(
          sec.map((b) => ({
            time: b.time,
            value: b.volume,
            color: b.close >= b.open ? 'rgba(14,203,129,.45)' : 'rgba(246,70,93,.45)',
          })),
        );
        chart.timeScale().fitContent();
        setStatus('ready');

        listenerRef.current = `lis-${storeKey}-${interval}`;
        datafeed.subscribeBars(
          symbol,
          resolution,
          (bar) => {
            const b = { ...bar, time: Math.floor(bar.time / 1000) as UTCTimestamp };
            candles.update(b as Bar);
            volume.update({
              time: b.time,
              value: b.volume,
              color: b.close >= b.open ? 'rgba(14,203,129,.45)' : 'rgba(246,70,93,.45)',
            });
          },
          listenerRef.current!,
          () => undefined,
        );
      },
      () => setStatus('error'),
    );

    const ro = new ResizeObserver(() => chart.applyOptions({}));
    ro.observe(el);

    return () => {
      ro.disconnect();
      if (listenerRef.current) datafeed.unsubscribeBars(listenerRef.current);
      chart.remove();
      chartRef.current = null;
    };
  }, [storeKey, interval, pricePrecision, onCrosshairPrice]);

  return (
    <div className={cn('relative h-full w-full', className)}>
      <div ref={containerRef} className="chart-container h-full w-full" />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-night-900/70 text-[12px] text-txt-secondary">
          Loading chart data…
        </div>
      )}
      {status === 'empty' && (
        <div className="absolute inset-0 flex items-center justify-center bg-night-900/70 text-[12px] text-txt-secondary">
          No data for this interval yet.
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-night-900/70 text-[12px] text-down">
          Chart history unavailable — check the data source badge.
        </div>
      )}
    </div>
  );
}
