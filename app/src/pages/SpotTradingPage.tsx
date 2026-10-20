import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { DEFAULT_PAIR, TRADING_PAIRS } from '../data/constants';
import { useTradingPair } from '../hooks/useTradingPair';
import { mkKey, splitKey, type ExchangeId, type MarketType } from '../types/marketDataTypes';
import { pairMarketStore } from '../services/marketDataService';
import { TickerHeader } from '../components/trading/TickerHeader';
import { PairSidebar } from '../components/trading/PairSidebar';
import { RecentTradesPanel } from '../components/trading/RecentTradesPanel';
import { ChartPanel } from '../components/trading/ChartPanel';
import { OrderBookPanel } from '../components/trading/OrderBookPanel';
import { OrderFormPanel } from '../components/trading/OrderFormPanel';
import { OrdersBottomPanel } from '../components/trading/OrdersBottomPanel';
import { PairSelectorModal } from '../components/trading/PairSelectorModal';
import { Tabs } from '../components/ui/primitives';
import { formatNumber } from '../utils/format';

type MobilePanel = 'chart' | 'book' | 'trades' | 'form';

export default function SpotTradingPage(): React.ReactElement {
  const { pair: rawPair } = useParams<{ pair: string }>();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const pair = (rawPair ?? DEFAULT_PAIR).toLowerCase();
  const exchange = (params.get('ex') as ExchangeId) || 'binance';
  const marketType: MarketType = params.get('m') === 'swap' ? 'swap' : 'spot';
  const storeKey = mkKey(exchange, marketType, pair);

  const meta = useMemo(
    () => TRADING_PAIRS.find((p) => p.pair === pair) ?? TRADING_PAIRS.find((p) => p.pair === DEFAULT_PAIR)!,
    [pair],
  );

  const { state, sourceLabel, sourceState, refresh } = useTradingPair(storeKey);
  const [pickedPrice, setPickedPrice] = useState<number | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('chart');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(window.localStorage.getItem('bityaris.favs') ?? '["xrp_usdt","btc_usdt","eth_usdt"]') as string[];
    } catch {
      return ['xrp_usdt'];
    }
  });

  useEffect(() => {
    pairMarketStore.setPreferredExchange(exchange);
  }, [exchange]);

  useEffect(() => {
    if (rawPair && rawPair !== pair) navigate(`/trade/${pair}`, { replace: true });
  }, [rawPair, pair, navigate]);

  useEffect(() => {
    setPickedPrice(null);
  }, [storeKey]);

  const setExchange = (ex: ExchangeId) => {
    const next = new URLSearchParams(params);
    next.set('ex', ex);
    setParams(next, { replace: false });
  };
  const setMarketType = (m: MarketType) => {
    const next = new URLSearchParams(params);
    if (m === 'swap') next.set('m', 'swap');
    else next.delete('m');
    setParams(next);
  };

  const toggleFavorite = (p: string) =>
    setFavorites((f) => {
      const next = f.includes(p) ? f.filter((x) => x !== p) : [...f, p];
      try {
        window.localStorage.setItem('bityaris.favs', JSON.stringify(next));
      } catch {
        /* noop */
      }
      return next;
    });

  const ticker = state.ticker;
  const precision = state.instrument?.tickSize
    ? Math.max(0, Math.ceil(-Math.log10(state.instrument.tickSize)))
    : meta.pricePrecision;
  const amountPrecision = state.instrument?.stepSize
    ? Math.max(0, Math.ceil(-Math.log10(state.instrument.stepSize)))
    : meta.amountPrecision;
  const symbolLabel = `${meta.base}/${meta.quote} · ${exchange} ${marketType === 'swap' ? 'perp' : 'spot'}`;

  const sidebar = (
    <PairSidebar
      activePair={pair}
      exchange={exchange}
      marketType={marketType}
      favorites={favorites}
      toggleFavorite={toggleFavorite}
    />
  );
  const trades = (
    <RecentTradesPanel
      trades={state.trades}
      pricePrecision={precision}
      amountPrecision={amountPrecision}
      base={meta.base}
      quote={meta.quote}
      loading={!state.trades.length}
    />
  );
  const chart = (
    <ChartPanel
      storeKey={storeKey}
      symbolLabel={symbolLabel}
      pricePrecision={precision}
      lastLabel={
        ticker
          ? `${formatNumber(ticker.last, precision)} (${ticker.change24hPct >= 0 ? '+' : ''}${ticker.change24hPct.toFixed(2)}%)`
          : '--'
      }
    />
  );
  const form = (
    <OrderFormPanel
      storeKey={storeKey}
      pair={pair}
      base={meta.base}
      quote={meta.quote}
      lastPrice={ticker?.last ?? 0}
      bestBid={state.orderBook?.bids[0]?.price}
      bestAsk={state.orderBook?.asks[0]?.price}
      pricePrecision={precision}
      amountPrecision={amountPrecision}
      minAmount={state.instrument?.minAmount}
      minCost={state.instrument?.minCost}
      venueLabel={`${exchange} ${marketType === 'swap' ? 'perpetual' : 'spot'}`}
      pickedPrice={pickedPrice}
      market={marketType === 'swap' ? 'futures' : 'spot'}
    />
  );
  const book = (
    <OrderBookPanel
      book={state.orderBook}
      pricePrecision={precision}
      amountPrecision={amountPrecision}
      base={meta.base}
      quote={meta.quote}
      onPickPrice={(v) => {
        setPickedPrice(v);
        setMobilePanel('form');
      }}
      loading={!state.orderBook}
    />
  );

  return (
    <div className="bg-night-900 text-txt-primary">
      <TickerHeader
        pair={pair}
        base={meta.base}
        quote={meta.quote}
        exchange={exchange}
        marketType={marketType}
        onExchange={setExchange}
        onMarketType={setMarketType}
        ticker={ticker}
        funding={state.funding}
        sourceLabel={sourceLabel}
        sourceState={sourceState}
        onRefresh={refresh}
        onOpenSelector={() => setSelectorOpen(true)}
        pricePrecision={precision}
        instrumentRules={
          state.instrument
            ? `${state.instrument.symbol} — tick ${state.instrument.tickSize ?? '—'}, step ${state.instrument.stepSize ?? '—'}, min amount ${state.instrument.minAmount ?? '—'}, min cost ${state.instrument.minCost ?? '—'} (${exchange}).`
            : undefined
        }
      />

      {/* mobile panel switcher */}
      <div className="border-b border-night-600 bg-night-800 px-2 lg:hidden">
        <Tabs
          tone="dark"
          tabs={[
            { id: 'chart', label: 'Chart' },
            { id: 'book', label: 'Order Book' },
            { id: 'trades', label: 'Trades' },
            { id: 'form', label: 'Place Order' },
          ]}
          active={mobilePanel}
          onChange={(id) => setMobilePanel(id as MobilePanel)}
        />
      </div>

      {/* mobile: single panel */}
      <div className="lg:hidden">
        {mobilePanel === 'chart' && <div className="h-[62vh]">{chart}</div>}
        {mobilePanel === 'book' && <div className="h-[62vh]">{book}</div>}
        {mobilePanel === 'trades' && <div className="h-[62vh]">{trades}</div>}
        {mobilePanel === 'form' && form}
        <div className="h-[38vh] border-t border-night-600">{mobilePanel === 'trades' ? sidebar : sidebar}</div>
      </div>

      {/* desktop grid */}
      <div className="mx-auto hidden max-w-[1800px] grid-cols-1 gap-px bg-night-600 lg:grid lg:grid-cols-[240px_1fr_290px]">
        <div className="flex h-[calc(100vh-140px)] min-h-[560px] flex-col">
          <div className="min-h-0 flex-1">{sidebar}</div>
          <div className="h-[240px] shrink-0 border-t border-night-600">{trades}</div>
        </div>
        <div className="flex flex-col bg-night-800">
          <div className="h-[46vh] min-h-[360px]">{chart}</div>
          {form}
        </div>
        <div className="h-[calc(100vh-140px)] min-h-[560px]">{book}</div>
      </div>

      <div className="mx-auto max-w-[1800px] px-0 pb-8 pt-px">
        <OrdersBottomPanel />
      </div>

      <PairSelectorModal
        open={selectorOpen}
        activePair={pair}
        exchange={exchange}
        marketType={marketType}
        onClose={() => setSelectorOpen(false)}
      />
    </div>
  );
}

void splitKey;
