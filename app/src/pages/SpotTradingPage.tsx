import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DEFAULT_PAIR, TRADING_PAIRS } from '../data/constants';
import { useTradingPair } from '../hooks/useTradingPair';
import { TickerHeader } from '../components/trading/TickerHeader';
import { PairSidebar } from '../components/trading/PairSidebar';
import { RecentTradesPanel } from '../components/trading/RecentTradesPanel';
import { ChartPanel } from '../components/trading/ChartPanel';
import { OrderBookPanel } from '../components/trading/OrderBookPanel';
import { OrderFormPanel } from '../components/trading/OrderFormPanel';
import { OrdersBottomPanel } from '../components/trading/OrdersBottomPanel';
import { PairSelectorModal } from '../components/trading/PairSelectorModal';
import { formatNumber } from '../utils/format';

export default function SpotTradingPage(): React.ReactElement {
  const { pair: rawPair } = useParams<{ pair: string }>();
  const navigate = useNavigate();
  const pair = (rawPair ?? DEFAULT_PAIR).toLowerCase();
  const meta = useMemo(
    () => TRADING_PAIRS.find((p) => p.pair === pair) ?? TRADING_PAIRS.find((p) => p.pair === DEFAULT_PAIR)!,
    [pair],
  );

  const { state, sourceLabel, sourceState, refresh } = useTradingPair(pair);
  const [pickedPrice, setPickedPrice] = useState<number | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(window.localStorage.getItem('orbitex.favs') ?? '["xrp_usdt","btc_usdt","eth_usdt"]') as string[];
    } catch {
      return ['xrp_usdt'];
    }
  });

  useEffect(() => {
    if (rawPair && rawPair !== pair) navigate(`/trade/${pair}`, { replace: true });
  }, [rawPair, pair, navigate]);

  useEffect(() => {
    setPickedPrice(null);
  }, [pair]);

  const toggleFavorite = (p: string) =>
    setFavorites((f) => {
      const next = f.includes(p) ? f.filter((x) => x !== p) : [...f, p];
      try {
        window.localStorage.setItem('orbitex.favs', JSON.stringify(next));
      } catch {
        /* noop */
      }
      return next;
    });

  const ticker = state.ticker;

  return (
    <div className="bg-night-900 text-txt-primary">
      <TickerHeader
        pair={pair}
        base={meta.base}
        quote={meta.quote}
        ticker={ticker}
        sourceLabel={sourceLabel}
        sourceState={sourceState}
        onRefresh={refresh}
        onOpenSelector={() => setSelectorOpen(true)}
        pricePrecision={meta.pricePrecision}
      />

      <div className="mx-auto grid max-w-[1800px] grid-cols-1 gap-px bg-night-600 lg:grid-cols-[240px_1fr_290px]">
        {/* left column */}
        <div className="flex h-[560px] flex-col lg:h-[calc(100vh-120px)]">
          <div className="min-h-0 flex-1">
            <PairSidebar activePair={pair} favorites={favorites} toggleFavorite={toggleFavorite} />
          </div>
          <div className="h-[240px] shrink-0 border-t border-night-600">
            <RecentTradesPanel
              trades={state.trades}
              pricePrecision={meta.pricePrecision}
              amountPrecision={meta.amountPrecision}
              base={meta.base}
              quote={meta.quote}
              loading={!state.trades.length}
            />
          </div>
        </div>

        {/* center column */}
        <div className="flex flex-col bg-night-800">
          <div className="h-[420px] lg:h-[46vh]">
            <ChartPanel
              pair={pair}
              pricePrecision={meta.pricePrecision}
              lastLabel={ticker ? `${formatNumber(ticker.last, meta.pricePrecision)} (${ticker.change24hPct >= 0 ? '+' : ''}${ticker.change24hPct.toFixed(2)}%)` : '--'}
            />
          </div>
          <OrderFormPanel
            pair={pair}
            base={meta.base}
            quote={meta.quote}
            lastPrice={ticker?.last ?? 0}
            bestBid={state.orderBook?.bids[0]?.price}
            bestAsk={state.orderBook?.asks[0]?.price}
            pricePrecision={meta.pricePrecision}
            amountPrecision={meta.amountPrecision}
            pickedPrice={pickedPrice}
            market="spot"
          />
        </div>

        {/* right column */}
        <div className="h-[560px] lg:h-[calc(100vh-120px)]">
          <OrderBookPanel
            book={state.orderBook}
            pricePrecision={meta.pricePrecision}
            amountPrecision={meta.amountPrecision}
            base={meta.base}
            quote={meta.quote}
            onPickPrice={setPickedPrice}
            loading={!state.orderBook}
          />
        </div>
      </div>

      <div className="mx-auto max-w-[1800px] px-0 pb-8 pt-px">
        <OrdersBottomPanel />
      </div>

      <PairSelectorModal open={selectorOpen} activePair={pair} onClose={() => setSelectorOpen(false)} />
    </div>
  );
}
