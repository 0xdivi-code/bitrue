import React, { useMemo, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { STRATEGY_CARDS, TRADING_PAIRS } from '../data/constants';
import { useTradingPair } from '../hooks/useTradingPair';
import { useTopMarkets } from '../hooks/useTopMarkets';
import { ChartPanel } from '../components/trading/ChartPanel';
import { OrderBookPanel } from '../components/trading/OrderBookPanel';
import { OrderFormPanel } from '../components/trading/OrderFormPanel';
import { OrdersBottomPanel } from '../components/trading/OrdersBottomPanel';
import { DataSourceBadge, Tabs } from '../components/ui/primitives';
import { cn, formatCompact, formatNumber, formatPct } from '../utils/format';

const TICKER_STRIP = ['BTC', 'ETH', 'XRP', 'SOL', 'DOGE', 'SUI', 'WLD', 'ZEC', 'XAU', 'XAG', 'PEPE', 'HYPE'];

/** Futures terminal: ticker strips, pair header, chart, book, order form, positions tabs, AI strategy cards. */
export default function FuturesPage(): React.ReactElement {
  const pair = 'btc_usdt';
  const meta = useMemo(() => TRADING_PAIRS.find((p) => p.pair === pair)!, []);
  const { state, sourceLabel, sourceState } = useTradingPair(pair);
  const { bySymbol } = useTopMarkets();
  const [tab, setTab] = useState('positions');
  const [bannerOpen, setBannerOpen] = useState(true);
  const [picked, setPicked] = useState<number | null>(null);
  const t = state.ticker;

  const strip = (reverse = false) => (
    <div className={cn('overflow-hidden border-b border-night-600 bg-night-800', reverse && 'border-t border-b-0')}>
      <div className="ticker-track flex w-max gap-6 px-4 py-1.5">
        {[...TICKER_STRIP, ...TICKER_STRIP].map((sym, i) => {
          const a = bySymbol.get(sym);
          const up = (a?.change24hPct ?? 1) >= 0;
          return (
            <span key={`${sym}-${i}`} className="flex items-center gap-1.5 whitespace-nowrap text-[11px]">
              <span className="font-semibold text-txt-primary">{sym}/USDT</span>
              <span className={cn('num font-semibold', up ? 'text-up' : 'text-down')}>{a ? formatPct(a.change24hPct) : '--'}</span>
              <span className="num text-txt-muted">{a ? formatCompact(a.priceUsd) : '--'}</span>
            </span>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="bg-night-900 text-txt-primary">
      {strip()}

      {/* pair header */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-night-600 bg-night-800 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f7931a] text-[11px] font-black text-white">₿</span>
          <span className="text-[15px] font-bold">BTC/USDT Perpetual</span>
        </div>
        <span className={cn('num text-[18px] font-extrabold', (t?.change24hPct ?? 0) >= 0 ? 'text-up' : 'text-down')}>
          {t ? formatNumber(t.last, 2) : '--'}
        </span>
        {[
          ['Mark Price', t ? formatNumber(t.last * 0.9999, 1) : '--'],
          ['Index Price', t ? formatNumber(t.last * 0.9998, 1) : '--'],
          ['Funding/Countdown', '0.0061% / 6:46:16'],
          ['24h Chg', t ? formatPct(t.change24hPct) : '--'],
          ['24h High', t ? formatNumber(t.high24h, 1) : '--'],
          ['24h Low', t ? formatNumber(t.low24h, 1) : '--'],
          ['24h Vol(BTC)', t ? formatCompact(t.baseVolume24h) : '--'],
          ['24h Vol(USDT)', t ? formatCompact(t.quoteVolume24h) : '--'],
        ].map(([label, value]) => (
          <div key={label}>
            <div className="text-[10px] text-txt-muted">{label}</div>
            <div className="num text-[12px] font-semibold text-txt-primary">{value}</div>
          </div>
        ))}
        <div className="ml-auto">
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
                { id: 'info', label: 'Currency Information' },
              ]}
              active="chart"
              onChange={() => undefined}
            />
          </div>
          <div className="h-[420px]">
            <ChartPanel pair={pair} pricePrecision={1} lastLabel={t ? formatNumber(t.last, 1) : '--'} />
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
              ? 'No open positions — simulated futures positions will appear here once you place demo orders.'
              : `The ${tab} table is part of the demo terminal and stays empty until simulated activity exists.`}
          </div>

          <div className="grid gap-4 border-t border-night-600 p-4 md:grid-cols-3">
            {STRATEGY_CARDS.map((s) => (
              <div key={s.id} className="rounded-xl border border-night-500 p-4">
                <div className="flex items-center gap-2">
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
                <button type="button" className="mt-3 w-full rounded-lg bg-accent py-1.5 text-[11px] font-bold text-night-900 hover:bg-accent-hover">
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
                { id: 'ai', label: <span className="inline-flex items-center gap-1">Orbitex AI <span className="rounded bg-accent px-1 text-[9px] font-bold text-night-900">New</span></span> },
                { id: 'copy', label: 'Copy' },
              ]}
              active="futures"
              onChange={() => undefined}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 px-3 py-2">
            <button type="button" className="rounded-lg bg-night-500 py-1.5 text-[12px] font-bold text-accent">Cross</button>
            <button type="button" className="rounded-lg bg-night-600 py-1.5 text-[12px] font-bold text-txt-secondary hover:text-txt-primary">5x</button>
          </div>
          <OrderFormPanel
            pair={pair}
            base="BTC"
            quote="USDT"
            lastPrice={t?.last ?? 0}
            bestBid={state.orderBook?.bids[0]?.price}
            bestAsk={state.orderBook?.asks[0]?.price}
            pricePrecision={1}
            amountPrecision={4}
            pickedPrice={picked}
            market="futures"
          />
          <div className="grid grid-cols-2 gap-2 border-t border-night-600 px-3 py-3 text-[11px] text-txt-secondary">
            <span>Liquidation Price: <span className="num text-txt-primary">--</span></span>
            <span className="text-right">Margin: <span className="num text-txt-primary">0 USDT</span></span>
          </div>
          <button type="button" className="mx-3 mb-3 rounded-lg bg-night-600 py-2 text-[12px] font-bold text-accent hover:bg-night-500">
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
            <button type="button" aria-label="Close banner" onClick={() => setBannerOpen(false)} className="text-txt-muted hover:text-txt-primary">
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
