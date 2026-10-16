import React, { useEffect, useMemo, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Tabs } from '../ui/primitives';
import { Tooltip } from '../ui/Tooltip';
import { useAuth } from '../../state/AuthContext';
import { useOrders } from '../../state/OrdersContext';
import { useUi } from '../../state/UiContext';
import { cn, formatNumber } from '../../utils/format';
import type { OrderSide, OrderType } from '../../types/domain';

export interface OrderFormPanelProps {
  pair: string;
  base: string;
  quote: string;
  lastPrice: number;
  bestBid?: number;
  bestAsk?: number;
  pricePrecision: number;
  amountPrecision: number;
  /** price injected by order-book clicks */
  pickedPrice: number | null;
  market: 'spot' | 'futures';
}

const PERCENTS = [0, 25, 50, 75, 100];

const MARKET_PROTECTION_TEXT =
  'To prevent significant price moves from hurting your execution, market orders only match within ±10% of the current market price (buys up to 110%, sells down to 90%). Beyond that range the system halts the order.';
const TRIGGER_TEXT =
  'When the latest market price reaches the trigger price, the order is automatically placed using the pre-set limit price and quantity.';
const BBO_TEXT =
  'BBO quickly sets a limit price matching the best bid/offer. With BBO enabled the system selects the matching market quote to fulfil the order.';
const LOANS_TEXT =
  'Borrow instantly with no handling fees: pledge 30+ currencies as collateral to receive mainstream coins you can trade or invest right away.';
const TPSL_TEXT =
  'Set take-profit and stop-loss prices in advance. TP/SL orders execute automatically to help lock in profits and control risk.';

/** Buy + sell order forms with Limit / Market / Trigger order types. */
export function OrderFormPanel(props: OrderFormPanelProps): React.ReactElement {
  const { pair, base, quote, lastPrice, bestBid, bestAsk, pricePrecision, amountPrecision, pickedPrice, market } = props;
  const { account } = useAuth();
  const { placeOrder } = useOrders();
  const { openModal } = useUi();
  const [type, setType] = useState<OrderType>('limit');

  const available = (sym: string): number =>
    account.balances.find((b) => b.symbol === sym)?.available ?? 0;

  return (
    <div className="bg-night-800">
      <div className="flex items-center gap-4 border-b border-night-600 px-4">
        <Tabs
          tone="dark"
          tabs={[
            { id: 'limit', label: 'Limit' },
            { id: 'market', label: <span className="inline-flex items-center">Market <Tooltip content={MARKET_PROTECTION_TEXT} /></span> },
            { id: 'trigger', label: <span className="inline-flex items-center">Trigger Order <Tooltip content={TRIGGER_TEXT} /></span> },
          ]}
          active={type}
          onChange={(id) => setType(id as OrderType)}
        />
        <div className="ml-auto flex items-center gap-3 pb-1">
          <button type="button" className="rounded bg-night-600 px-2 py-1 text-[11px] font-semibold text-accent" onClick={() => openModal('promo', { promo: { id: 'futures', title: 'Futures Trading', tag: 'Demo', art: 'ai', accentFrom: '#7ab8ff', accentTo: '#274bdb' } })}>
            Futures Trading
          </button>
          <Tooltip content={LOANS_TEXT}>
            <span className="text-[11px] font-semibold text-txt-secondary underline decoration-dotted">Loans</span>
          </Tooltip>
        </div>
      </div>

      <div className="grid gap-6 p-4 lg:grid-cols-2">
        <SideForm
          side="buy"
          type={type}
          pair={pair}
          base={base}
          quote={quote}
          lastPrice={lastPrice}
          bboPrice={bestAsk ?? lastPrice}
          pricePrecision={pricePrecision}
          amountPrecision={amountPrecision}
          pickedPrice={pickedPrice}
          availableQuote={available(quote)}
          availableBase={available(base)}
          placeOrder={placeOrder}
          loggedIn={account.loggedIn}
          market={market}
        />
        <SideForm
          side="sell"
          type={type}
          pair={pair}
          base={base}
          quote={quote}
          lastPrice={lastPrice}
          bboPrice={bestBid ?? lastPrice}
          pricePrecision={pricePrecision}
          amountPrecision={amountPrecision}
          pickedPrice={pickedPrice}
          availableQuote={available(quote)}
          availableBase={available(base)}
          placeOrder={placeOrder}
          loggedIn={account.loggedIn}
          market={market}
        />
      </div>
    </div>
  );
}

interface SideFormProps {
  side: OrderSide;
  type: OrderType;
  pair: string;
  base: string;
  quote: string;
  lastPrice: number;
  bboPrice: number;
  pricePrecision: number;
  amountPrecision: number;
  pickedPrice: number | null;
  availableQuote: number;
  availableBase: number;
  loggedIn: boolean;
  market: 'spot' | 'futures';
  placeOrder: ReturnType<typeof useOrders>['placeOrder'];
}

function SideForm(p: SideFormProps): React.ReactElement {
  const { openModal, pushToast } = useUi();
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [trigger, setTrigger] = useState('');
  const [percent, setPercent] = useState(0);
  const [bbo, setBbo] = useState(false);
  const [tpsl, setTpsl] = useState(false);
  const [tp, setTp] = useState('');
  const [sl, setSl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isBuy = p.side === 'buy';
  const accent = isBuy ? 'text-up' : 'text-down';

  useEffect(() => {
    if (p.pickedPrice != null) setPrice(p.pickedPrice.toFixed(p.pricePrecision));
  }, [p.pickedPrice, p.pricePrecision]);

  useEffect(() => {
    setPrice('');
    setAmount('');
    setTrigger('');
    setPercent(0);
    setError(null);
  }, [p.pair, p.type]);

  const priceNum = bbo ? p.bboPrice : parseFloat(price) || 0;
  const amountNum = parseFloat(amount) || 0;
  const total = p.type === 'market' ? amountNum * p.lastPrice : priceNum * amountNum;

  const applyPercent = (pct: number) => {
    setPercent(pct);
    const avail = isBuy ? p.availableQuote : p.availableBase;
    if (!p.loggedIn) return;
    if (isBuy) {
      const ref = p.type === 'market' ? p.lastPrice : priceNum || p.lastPrice;
      setAmount(ref > 0 ? (((avail * pct) / 100) / ref).toFixed(p.amountPrecision) : '');
    } else {
      setAmount(((avail * pct) / 100).toFixed(p.amountPrecision));
    }
  };

  const submit = () => {
    setError(null);
    if (!p.loggedIn) {
      openModal('auth', { mode: 'login' });
      return;
    }
    const res = p.placeOrder({
      pair: p.pair,
      side: p.side,
      type: p.type,
      price: p.type === 'market' ? undefined : priceNum || undefined,
      triggerPrice: p.type === 'trigger' ? parseFloat(trigger) || undefined : undefined,
      amount: amountNum,
      total,
      tpSl: tpsl ? { tp: parseFloat(tp) || undefined, sl: parseFloat(sl) || undefined } : undefined,
      market: p.market,
    });
    if (!res.ok) {
      if (res.error === 'auth-required') openModal('auth', { mode: 'login' });
      else setError(res.error ?? 'Order rejected');
    }
  };

  const inputCls =
    'num w-full rounded-lg bg-night-600 px-3 py-2.5 text-right text-[13px] text-txt-primary outline-none placeholder:text-txt-muted focus:ring-1 focus:ring-accent';

  return (
    <div>
      <div className="space-y-3">
        {p.type !== 'market' && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-txt-muted">Price</span>
              <input
                value={bbo ? formatNumber(p.bboPrice, p.pricePrecision) : price}
                onChange={(e) => {
                  setBbo(false);
                  setPrice(e.target.value.replace(/[^\d.]/g, ''));
                }}
                disabled={bbo}
                placeholder="0.00"
                aria-label="Order price"
                className={cn(inputCls, 'pl-14', bbo && 'opacity-60')}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-txt-muted">{p.quote}</span>
            </div>
            <button
              type="button"
              onClick={() => setBbo((b) => !b)}
              className={cn(
                'rounded-lg px-3 py-2.5 text-[12px] font-bold',
                bbo ? 'bg-accent text-night-900' : 'bg-night-600 text-txt-primary hover:bg-night-500',
              )}
              aria-pressed={bbo}
            >
              <Tooltip content={BBO_TEXT} icon={false}>
                BBO
              </Tooltip>
            </button>
          </div>
        )}

        {p.type === 'trigger' && (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-txt-muted">Trigger</span>
            <input
              value={trigger}
              onChange={(e) => setTrigger(e.target.value.replace(/[^\d.]/g, ''))}
              placeholder="0.00"
              aria-label="Trigger price"
              className={cn(inputCls, 'pl-16')}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-txt-muted">{p.quote}</span>
          </div>
        )}

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-txt-muted">
            {p.type === 'market' && p.side === 'buy' ? 'Total' : 'Amount'}
          </span>
          <input
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value.replace(/[^\d.]/g, ''));
              setPercent(0);
            }}
            placeholder={p.type === 'market' ? 'Enter total' : '0.00'}
            aria-label="Order amount"
            className={cn(inputCls, 'pl-16')}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-txt-muted">
            {p.type === 'market' && p.side === 'buy' ? p.quote : p.base}
          </span>
        </div>

        {p.type === 'market' && (
          <p className="text-[11px] leading-relaxed text-txt-muted">
            When placing a market order, the execution quantity and price depend on the actual trading outcome.
          </p>
        )}

        <div>
          <input
            type="range"
            min={0}
            max={100}
            step={25}
            value={percent}
            onChange={(e) => applyPercent(Number(e.target.value))}
            className="alloc w-full"
            style={{ ['--thumb' as string]: isBuy ? '#0ecb81' : '#f6465d' }}
            aria-label="Percentage of available balance"
          />
          <div className="mt-1 flex justify-between">
            {PERCENTS.map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => applyPercent(pct)}
                className={cn('text-[10px]', percent === pct ? 'font-bold text-txt-primary' : 'text-txt-muted hover:text-txt-secondary')}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-[12px]">
          <span className="text-txt-muted">
            Total <span className="num text-txt-secondary">{total ? `${formatNumber(total, 2)} ${p.quote}` : '--'}</span>
          </span>
          <label className="flex cursor-pointer items-center gap-1.5 text-txt-secondary">
            <input type="checkbox" checked={tpsl} onChange={(e) => setTpsl(e.target.checked)} className="accent-[#f0b90b]" />
            TP/SL
            <Tooltip content={TPSL_TEXT} />
          </label>
        </div>

        {tpsl && (
          <div className="grid grid-cols-2 gap-2">
            <input value={tp} onChange={(e) => setTp(e.target.value.replace(/[^\d.]/g, ''))} placeholder="Take profit" aria-label="Take profit price" className={inputCls} />
            <input value={sl} onChange={(e) => setSl(e.target.value.replace(/[^\d.]/g, ''))} placeholder="Stop loss" aria-label="Stop loss price" className={inputCls} />
          </div>
        )}

        {error && <p className="text-[11px] font-medium text-down">{error}</p>}

        <div className="flex items-center justify-between text-[11px] text-txt-muted">
          <span className={accent}>
            {isBuy ? `Buy ${p.base}` : `Sell ${p.base}`}
          </span>
          <span className="flex items-center gap-1">
            {p.base} Available:{' '}
            <span className="num text-txt-secondary">
              {p.loggedIn ? formatNumber(isBuy ? p.availableQuote : p.availableBase, 2) : '--'}
            </span>
            <HelpCircle size={11} />
          </span>
        </div>

        {p.loggedIn ? (
          <button
            type="button"
            onClick={submit}
            className={cn(
              'w-full rounded-lg py-2.5 text-[13px] font-bold text-night-900 transition-opacity hover:opacity-90',
              isBuy ? 'bg-up' : 'bg-down',
            )}
          >
            {isBuy ? `Buy ${p.base}` : `Sell ${p.base}`}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => openModal('auth', { mode: 'login' })}
            className="w-full rounded-lg bg-night-600 py-2.5 text-[13px] font-semibold text-txt-secondary hover:bg-night-500"
          >
            <span className="font-bold text-accent">Log In</span> or <span className="font-bold text-accent">Sign Up</span>
          </button>
        )}
        {!p.loggedIn && (
          <p className="text-center text-[10px] text-txt-muted">
            Demo notice: signing in creates a simulated account; orders never touch real funds.{' '}
            <button type="button" className="underline decoration-dotted" onClick={() => pushToast({ tone: 'info', title: 'Simulated environment', body: 'All balances, orders and fills on this page are generated locally in your browser.' })}>
              Why?
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
