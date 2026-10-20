import React, { useMemo, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { STRATEGY_CARDS } from '../data/constants';
import { useTradingPair } from '../hooks/useTradingPair';
import { useTopMarkets } from '../hooks/useTopMarkets';
import { mkKey, type ExchangeId } from '../types/marketDataTypes';
import { ChartPanel } from '../components/trading/ChartPanel';
import { OrderBookPanel } from '../components/trading/OrderBookPanel';
import { OrderFormPanel } from '../components/trading/OrderFormPanel';
import { OrdersBottomPanel } from '../components/trading/OrdersBottomPanel';
import { CoinIcon } from '../components/market/CoinIcon';
import { DataSourceBadge, Tabs } from '../components/ui/primitives';
import { EXCHANGES } from '../components/trading/TickerHeader';
import { cn, formatCompact, formatNumber, formatPct, formatTime } from '../utils/format';

const STRIP = ['BTC', 'ETH', 'XRP', 'SOL', 'DOGE', 'SUI', 'WLD', 'LTC', 'LINK', 'AVAX', 'PEPE', 'TON'];

/** Perpetual-futures terminal driven by live venue data (default: Binance USDS-M). */
export default function FuturesPage(): React.ReactElement {
  const pair = 'btc_usdt';
  const [exchange, setExchange] = useState<ExchangeId>('binance');
  const storeKey = mkKey(exchange, 'swap', pair);
  const { state, sourceLabel, sourceState } = useTradingPair(storeKey);
  const { bySymbol } = useTopMarkets();
  const [tab, setTab] = useState('positions');
  const [bannerOpen, setBannerOpen] = useState(true);
  const [picked, setPicked] = useState<number | null>(null);
  const t = state.ticker;
  const f = state.funding;
  const btc = bySymbol.get('BTC');

  const strip = (reverse = false) => (
    <div className={cn('overflow-hidden border-b border-night-600 bg-night-800', reverse && 'border-b-0 border-t')}>
      <div className="ticker-track flex w-max gap-6 px-4 py-1.5">
        {[...STRIP, ...STRIP].map((sym, i) => {
          const a = bySymbol.get(sym);
          const up = (a?.change24hPct ?? 1) >= 0;
          return (
            <span key={`${sym}-${i}`} className="flex items-center gap-1.5 whitespace-nowrap text-[11px]">
              <CoinIcon symbol={sym} size={14} logoUrl={a?.logoUrl} />
              <span className="font-semibold text-txt-primary">{sym}/USDT</span>
              <span className={cn('num font-semibold', up ? 'text-up' : 'text-down')}>{a ? formatPct(a.change24hPct) : '--'}</span>
              <span className="num text-txt-muted">{a ? formatCompact(a.priceUsd) : '--'}</span>
            </span>
          );
        })}
      </div>
    </div>
  );

  const countdown = useMemo(() => {
    if (!f?.nextFundingTime) return '--';
    const ms = f.nextFundingTime - Date.now();
    if (ms <= 0) return '0:00:00';
    const h = Math.floor(ms / 3600_000);
    const m = Math.floor((ms % 3600_000) / 60_000);
    const s = Math.floor((ms % 60_000) / 1000);
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [f?.nextFundingTime]);

  return (
    <div className="bg-night-900 text-txt-primary">
      {strip()}

      {/* pair header */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-night-600 bg-night-800 px-3 py-2.5 md:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <CoinIcon symbol="BTC" size={24} logoUrl={btc?.logoUrl} />
          <span className="truncate text-[15px] font-bold">BTC/USDT Perpetual</span>
          <select
            value={exchange}
            onChange={(e) => setExchange(e.target.value as ExchangeId)}
            aria-label="Futures venue"
            className="rounded-lg border border-night-500 bg-night-700 px-2 py-1 text-[11px] font-bold text-txt-secondary outline-none"
          >
            {EXCHANGES.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
        <span className={cn('num text-[18px] font-extrabold', (t?.change24hPct ?? 0) >= 0 ? 'text-up' : 'text-down')}>
          {t ? formatNumber(t.last, 1) : '--'}
        </span>
        {[
          ['Mark Price', f?.markPrice ? formatNumber(f.markPrice, 1) : '--'],
          ['Index Price', f?.indexPrice ? formatNumber(f.indexPrice, 1) : '--'],
          ['Funding/Countdown', f?.fundingRate != null ? `${(f.fundingRate * 100).toFixed(4)}% / ${countdown}` : '--'],
          ['24h Chg', t ? formatPct(t.change24hPct) : '--'],
          ['24h High', t ? formatNumber(t.high24h, 1) : '--'],
          ['24h Low', t ? formatNumber(t.low24h, 1) : '--'],
          ['24h Vol(BTC)', t ? formatCompact(t.baseVolume24h) : '--'],
          ['24h Vol(USDT)', t ? formatCompact(t.quoteVolume24h) : '--'],
        ].map(([label, value]) => (
          <div key={label} className="min-w-[84px]">
            <div className="truncate text-[10px] text-txt-muted">{label}</div>
            <div className="num truncate text-[12px] font-semibold text-txt-primary">{value}</div>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {f && <span className="hidden text-[10px] text-txt-muted md:inline">next funding {f.nextFundingTime ? formatTime(f.nextFundingTime, false) : '--'}</span>}
          <DataSourceBadge state={sourceState} label={sourceLabel} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-px bg-night-600 xl:grid-cols-[1fr_300px_290px]">
        {/* chart + bottom tabs */}
        <div className="flex flex-col bg-night-800">
          <div className="flex items-center gap-4 border-b border-night-600 px-3">
            <Tabs
              tone="dark"
              tabs={[
                { id: 'chart', label: 'Chart' },
                { id: 'info', label: 'Contract Information' },
              ]}
              active="chart"
              onChange={() => undefined}
            />
          </div>
          <div className="h-[420px]">
            <ChartPanel
              storeKey={storeKey}
              symbolLabel={`BTC/USDT · ${exchange} perp`}
              pricePrecision={1}
              lastLabel={t ? formatNumber(t.last, 1) : '--'}
            />
          </div>

          <div className="border-t border-night-600 px-2">
            <Tabs
              tone="dark"
              tabs={[
                { id: 'positions', label: 'Positions(0)' },
                { id: 'copy', label: 'Copy Trade(0)' },
                { id: 'open', label: 'Open Orders(0)' },
                { id: 'history', label: 'Order History' },
                { id: 'trades', label: 'Trade History' },
                { id: 'position-history', label: 'Position History' },
                { id: 'transaction', label: 'Transaction' },
              ]}
              active={tab}
              onChange={setTab}
            />
          </div>
          <div className="px-4 py-6 text-center text-[12px] text-txt-muted">
            {tab === 'positions'
              ? 'No open positions — demo futures positions appear here once simulated orders fill.'
              : `The ${tab} table stays empty until simulated activity exists on this venue.`}
          </div>

          <div className="grid gap-4 border-t border-night-600 p-4 md:grid-cols-3">
            {STRATEGY_CARDS.map((s) => (
              <div key={s.id} className="rounded-xl border border-night-500 p-4">
                <div className="flex items-center gap-2">
                  <CoinIcon symbol="BTC" size={18} logoUrl={btc?.logoUrl} />
                  <Sparkles size={14} className="text-accent" />
                  <span className="text-[13px] font-bold">{s.pair}</span>
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[9px] font-bold',
                      s.tone === 'blue' && 'bg-[#274bdb]/20 text-[#8fb0ff]',
                      s.tone === 'gold' && 'bg-accent/20 text-accent',
                      s.tone === 'red' && 'bg-down/20 text-down',
                    )}
                  >
                    {s.label}
                  </span>
                  <span className="ml-auto text-[10px] text-[#8fb0ff]">AI analysis →</span>
                </div>
                <div className="mt-2 text-[11px] text-txt-secondary">
                  30D backtested APY: <span className="text-[15px] font-extrabold text-up">{s.apy}</span>
                </div>
                <dl className="mt-2 space-y-1 text-[11px] text-txt-secondary">
                  <div className="flex justify-between"><dt>Price range (USDT)</dt><dd className="num">{s.priceRange}</dd></div>
                  <div className="flex justify-between"><dt>Min capital (USDT)</dt><dd className="num">{s.minCapital}</dd></div>
                  <div className="flex justify-between"><dt>Drawdown</dt><dd className="num">{s.drawdown}</dd></div>
                </dl>
                <button type="button" className="mt-3 w-full rounded-lg bg-accent py-1.5 text-[11px] font-bold text-night-900 transition-transform hover:bg-accent-hover active:scale-[.98]">
                  Run strategy (demo)
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* order book */}
        <div className="h-[560px] bg-night-800">
          <div className="border-b border-night-600 px-3 py-2 text-[13px] font-semibold">Order Book</div>
          <div className="h-[calc(100%-41px)]">
            <OrderBookPanel
              book={state.orderBook}
              pricePrecision={1}
              amountPrecision={3}
              base="BTC"
              quote="USDT"
              onPickPrice={setPicked}
              loading={!state.orderBook}
            />
          </div>
        </div>

        {/* order form */}
        <div className="flex flex-col bg-night-800">
          <div className="border-b border-night-600 px-3">
            <Tabs
              tone="dark"
              tabs={[
                { id: 'futures', label: 'Futures Trading' },
                { id: 'ai', label: <span className="inline-flex items-center gap-1">Bityaris AI <span className="rounded bg-accent px-1 text-[9px] font-bold text-night-900">New</span></span> },
                { id: 'copy', label: 'Copy' },
              ]}
              active="futures"
              onChange={() => undefined}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 px-3 py-2">
            <button type="button" className="rounded-lg bg-night-500 py-1.5 text-[12px] font-bold text-accent active:scale-[.98]">Cross</button>
            <button type="button" className="rounded-lg bg-night-600 py-1.5 text-[12px] font-bold text-txt-secondary hover:text-txt-primary active:scale-[.98]">5x</button>
          </div>
          <OrderFormPanel
            storeKey={storeKey}
            pair={pair}
            base="BTC"
            quote="USDT"
            lastPrice={t?.last ?? 0}
            bestBid={state.orderBook?.bids[0]?.price}
            bestAsk={state.orderBook?.asks[0]?.price}
            pricePrecision={1}
            amountPrecision={4}
            minAmount={state.instrument?.minAmount}
            minCost={state.instrument?.minCost}
            venueLabel={`${exchange} perpetual`}
            pickedPrice={picked}
            market="futures"
          />
          <div className="grid grid-cols-2 gap-2 border-t border-night-600 px-3 py-3 text-[11px] text-txt-secondary">
            <span>Liquidation Price: <span className="num text-txt-primary">--</span></span>
            <span className="text-right">Margin: <span className="num text-txt-primary">0 USDT</span></span>
          </div>
          <button type="button" className="mx-3 mb-3 rounded-lg bg-night-600 py-2 text-[12px] font-bold text-accent hover:bg-night-500 active:scale-[.98]">
            Transfer
          </button>
        </div>
      </div>

      <div className="pb-2">
        <OrdersBottomPanel />
      </div>

      {strip(true)}

      {bannerOpen && (
        <div className="fixed bottom-24 right-6 z-[120] w-[300px] rounded-xl border border-night-500 bg-night-800 p-4 shadow-pop">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[12px] font-bold text-accent">
              <Sparkles size={13} /> Popular Events
            </span>
            <button type="button" aria-label="Close banner" onClick={() => setBannerOpen(false)} className="p-0.5 text-txt-muted hover:text-txt-primary">
              <X size={14} />
            </button>
          </div>
          <p className="mt-2 text-[12px] font-semibold text-txt-primary">Get up to 750 USDT — trade smarter with AI</p>
          <p className="mt-1 text-[11px] text-txt-secondary">Simulated campaign — no real rewards are issued.</p>
        </div>
      )}
    </div>
  );
}
