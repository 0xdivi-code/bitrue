import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Tabs, EmptyState, DataSourceBadge } from '../ui/primitives';
import { useOrders } from '../../state/OrdersContext';
import { useAuth } from '../../state/AuthContext';
import { useUi } from '../../state/UiContext';
import { CoinIcon } from '../market/CoinIcon';
import { cn, formatDateTime, formatNumber } from '../../utils/format';
import type { Order } from '../../types/domain';

type TabId = 'open' | 'history' | 'assets';

/** Open Orders / 24h Order History / Assets tables with simulated data. */
export function OrdersBottomPanel(): React.ReactElement {
  const { openOrders, history, cancelOrder } = useOrders();
  const { account } = useAuth();
  const { openModal } = useUi();
  const [tab, setTab] = useState<TabId>('open');
  const [assetQuery, setAssetQuery] = useState('');

  const recentHistory = useMemo(() => history.filter((o) => Date.now() - o.createdAt < 24 * 3600_000).slice(0, 50), [history]);
  const assets = useMemo(() => {
    const q = assetQuery.trim().toUpperCase();
    return account.balances.filter((b) => !q || b.symbol.includes(q));
  }, [account.balances, assetQuery]);

  const cols =
    'grid min-w-[980px] grid-cols-[1.3fr_1fr_.8fr_.6fr_1fr_1fr_.8fr_.8fr_.8fr_1fr_.8fr] gap-2 px-4 py-2 text-[11px]';

  const OrderRow = ({ o, withAction }: { o: Order; withAction?: boolean }) => {
    const [base, quote] = o.pair.toUpperCase().split('_');
    return (
      <div className={cn(cols, 'items-center border-t border-night-600/60 text-[11px]')}>
        <span className="num text-txt-secondary">{formatDateTime(o.createdAt)}</span>
        <span className="font-semibold text-txt-primary">{base}/{quote}</span>
        <span className="capitalize text-txt-secondary">{o.type}</span>
        <span className={cn('font-semibold capitalize', o.side === 'buy' ? 'text-up' : 'text-down')}>{o.side}</span>
        <span className="num text-txt-primary">{o.price ? formatNumber(o.price) : 'market'}</span>
        <span className="num text-txt-primary">{formatNumber(o.amount)}</span>
        <span className="num text-txt-secondary">{formatNumber(o.filledAmount)}</span>
        <span className="num text-txt-secondary">{o.amount ? Math.round((o.filledAmount / o.amount) * 100) : 0}%</span>
        <span className="text-txt-secondary">{o.tpSl?.tp || o.tpSl?.sl ? `${o.tpSl.tp ?? '-'} / ${o.tpSl.sl ?? '-'}` : '--'}</span>
        <span className="num text-txt-secondary">{formatNumber((o.price ?? o.filledAvgPrice ?? 0) * o.amount, 2)}</span>
        <span>
          {withAction && o.status === 'open' ? (
            <button
              type="button"
              onClick={() =>
                openModal('confirm', {
                  title: 'Cancel order?',
                  body: `This removes the simulated ${o.side} order for ${o.amount} ${base}. No real order exists.`,
                  confirmLabel: 'Cancel order',
                  action: () => cancelOrder(o.id),
                })
              }
              className="rounded bg-night-600 px-2 py-1 text-[10px] font-semibold text-down hover:bg-night-500"
            >
              Cancel
            </button>
          ) : (
            <span
              className={cn(
                'rounded px-1.5 py-0.5 text-[10px] font-semibold capitalize',
                o.status === 'filled' && 'bg-up/15 text-up',
                o.status === 'canceled' && 'bg-night-600 text-txt-secondary',
                o.status === 'open' && 'bg-accent/15 text-accent',
                o.status === 'triggered' && 'bg-purple/15 text-purple',
              )}
            >
              {o.status}
            </span>
          )}
        </span>
      </div>
    );
  };

  const Header = () => (
    <div className={cn(cols, 'text-txt-muted')}>
      <span>Date</span>
      <span>Pair</span>
      <span>Type</span>
      <span>Side</span>
      <span>Price</span>
      <span>Amount</span>
      <span>Filled</span>
      <span>Filled %</span>
      <span>TP/SL</span>
      <span>Total</span>
      <span>Action</span>
    </div>
  );

  const gate = (
    <EmptyState
      tone="dark"
      title={
        <span>
          <button type="button" className="font-bold text-accent hover:underline" onClick={() => openModal('auth', { mode: 'login' })}>
            Log In
          </button>{' '}
          or{' '}
          <button type="button" className="font-bold text-accent hover:underline" onClick={() => openModal('auth', { mode: 'signup' })}>
            Register Now
          </button>{' '}
          to trade
        </span>
      }
    />
  );

  return (
    <div className="bg-night-800">
      <div className="flex items-center gap-2 border-b border-night-600 px-2">
        <Tabs
          tone="dark"
          tabs={[
            { id: 'open', label: 'Open Orders', count: openOrders.length },
            { id: 'history', label: '24h Order History(Last 50)' },
            { id: 'assets', label: 'Assets' },
          ]}
          active={tab}
          onChange={(id) => setTab(id as TabId)}
        />
        {tab === 'assets' && account.loggedIn && (
          <div className="relative ml-auto my-1.5">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-txt-muted" />
            <input
              value={assetQuery}
              onChange={(e) => setAssetQuery(e.target.value)}
              placeholder="Search coin"
              aria-label="Search assets"
              className="w-[150px] rounded-lg bg-night-600 py-1 pl-7 pr-2 text-[11px] text-txt-primary outline-none"
            />
          </div>
        )}
      </div>

      {!account.loggedIn ? (
        gate
      ) : tab === 'open' ? (
        openOrders.length === 0 ? (
          <EmptyState tone="dark" title="No open orders — simulated limit and trigger orders appear here." />
        ) : (
          <div className="overflow-x-auto scroll-thin">
            <div>
              <Header />
              {openOrders.map((o) => (
                <OrderRow key={o.id} o={o} withAction />
              ))}
            </div>
          </div>
        )
      ) : tab === 'history' ? (
        recentHistory.length === 0 ? (
          <EmptyState tone="dark" title="No orders in the last 24 hours." />
        ) : (
          <div className="overflow-x-auto scroll-thin">
            <div>
              <Header />
              {recentHistory.map((o) => (
                <OrderRow key={o.id} o={o} />
              ))}
            </div>
          </div>
        )
      ) : (
        <div>
          <div className="grid grid-cols-4 gap-2 px-4 py-2 text-[11px] text-txt-muted">
            <span>Coin</span>
            <span className="text-right">Available</span>
            <span className="text-right">Locked</span>
            <span className="text-right">Total</span>
          </div>
          {assets.map((b) => (
            <div key={b.symbol} className="grid grid-cols-4 items-center gap-2 border-t border-night-600/60 px-4 py-2.5">
              <span className="flex items-center gap-2">
                <CoinIcon symbol={b.symbol} size={20} />
                <span className="text-[12px] font-semibold text-txt-primary">{b.symbol}</span>
              </span>
              <span className="num text-right text-[12px] text-txt-primary">{formatNumber(b.available, 4)}</span>
              <span className="num text-right text-[12px] text-txt-secondary">{formatNumber(b.locked, 4)}</span>
              <span className="num text-right text-[12px] text-txt-secondary">{formatNumber(b.available + b.locked, 4)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-2">
            <DataSourceBadge state="simulated" label="Simulated balances" />
            <span className="text-[10px] text-txt-muted">Demo account · no deposits or withdrawals</span>
          </div>
        </div>
      )}
    </div>
  );
}
