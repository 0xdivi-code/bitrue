import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SentimentGauge } from '../market/SentimentGauge';
import { CoinIcon } from '../market/CoinIcon';
import { Sparkline } from '../market/Sparkline';
import { Skeleton, DataSourceBadge } from '../ui/primitives';
import { useTopMarkets } from '../../hooks/useTopMarkets';
import { formatPct, formatUsd, timeAgo } from '../../utils/format';

const POPULAR = ['BTC', 'XRP', 'ETH'];

/** Right-hand hero card: sentiment gauge, popular coins, AI banner, top gainer. */
export function MarketShowcase({ onTrade }: { onTrade: () => void }): React.ReactElement {
  const navigate = useNavigate();
  const { snapshot, bySymbol, gainers } = useTopMarkets();
  const loading = snapshot.state === 'loading';
  const top = gainers[0];

  return (
    <div className="ring-gradient">
      <div className="relative overflow-hidden rounded-[18px] bg-white p-5">
        {/* decorative corner artwork */}
        <svg className="pointer-events-none absolute -right-6 -top-8 opacity-90" width="150" height="150" viewBox="0 0 150 150" aria-hidden="true">
          <circle cx="110" cy="40" r="46" fill="#ffd76a" opacity="0.35" />
          <circle cx="128" cy="66" r="26" fill="#ff9f43" opacity="0.35" />
        </svg>

        <div className="grid grid-cols-[150px_1fr] gap-4">
          <div>
            <h3 className="text-[12px] font-medium text-txt-darksec">Market Sentiment</h3>
            <SentimentGauge value={53} />
          </div>
          <div>
            <h3 className="text-[12px] font-medium text-txt-darksec">Popular</h3>
            <div className="mt-2 space-y-2.5">
              {loading
                ? POPULAR.map((p) => <Skeleton key={p} className="h-6 w-full" tone="light" />)
                : POPULAR.map((sym) => {
                    const a = bySymbol.get(sym);
                    if (!a) return null;
                    const up = a.change24hPct >= 0;
                    return (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => navigate(`/trade/${sym.toLowerCase()}_usdt`)}
                        className="flex w-full items-center gap-2 rounded-lg px-1 py-0.5 text-left hover:bg-black/[.04]"
                      >
                        <CoinIcon symbol={sym} size={20} logoUrl={a.logoUrl} />
                        <span className="w-10 text-[13px] font-semibold text-txt-dark">{sym}</span>
                        <span className="num ml-auto text-[13px] font-semibold text-txt-dark">
                          {formatUsd(a.priceUsd)}
                        </span>
                        <span className={`num w-16 text-right text-[12px] font-semibold ${up ? 'text-up' : 'text-down'}`}>
                          {formatPct(a.change24hPct)}
                        </span>
                      </button>
                    );
                  })}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onTrade}
          className="mt-4 flex w-full items-center gap-3 rounded-xl bg-[#f7f8fa] p-3 text-left transition-colors hover:bg-black/[.05]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-[#ff9f43] text-[11px] font-extrabold text-white">
            750
          </span>
          <span className="flex-1">
            <span className="block rounded bg-black/[.06] px-1.5 py-0.5 text-[10px] font-semibold text-txt-darksec w-fit">
              Hot event
            </span>
            <span className="mt-1 block text-[13px] font-semibold text-txt-dark">
              Get Up to 750 USDT — Trade Smarter with AI
            </span>
          </span>
          <ArrowRight size={16} className="text-txt-darksec" />
        </button>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[12px] font-medium text-txt-darksec">Top Gainers</h3>
            <span className="text-[11px] font-medium text-txt-darksec">More ↓</span>
          </div>
          <div className="mt-2 space-y-2">
            {loading
              ? [0, 1].map((i) => <Skeleton key={i} className="h-7 w-full" tone="light" />)
              : gainers.slice(0, 3).map((a) => (
                  <button
                    key={a.providerId}
                    type="button"
                    onClick={() => navigate(`/trade/${a.symbol.toLowerCase()}_usdt`)}
                    className="flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left hover:bg-black/[.04]"
                  >
                    <CoinIcon symbol={a.symbol} size={20} logoUrl={a.logoUrl} />
                    <span className="w-16 truncate text-[13px] font-semibold text-txt-dark">{a.symbol}</span>
                    <span className="num text-[13px] font-semibold text-txt-dark">{formatUsd(a.priceUsd)}</span>
                    <span className="num ml-auto text-[12px] font-semibold text-up">{formatPct(a.change24hPct)}</span>
                    {a.sparkline7d ? (
                      <Sparkline data={a.sparkline7d.slice(-24)} positive width={64} height={22} />
                    ) : (
                      <span className="w-16" />
                    )}
                  </button>
                ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-bd-light pt-3">
          <DataSourceBadge tone="light" state={snapshot.state} label={snapshot.source} />
          <span className="text-[10px] text-txt-darksec" title={new Date(snapshot.fetchedAt).toLocaleString()}>
            {snapshot.lastSuccessAt ? `updated ${timeAgo(snapshot.lastSuccessAt)}` : '—'}
          </span>
        </div>

        {top && (
          <p className="sr-only">Current top gainer: {top.symbol}</p>
        )}
      </div>
    </div>
  );
}
