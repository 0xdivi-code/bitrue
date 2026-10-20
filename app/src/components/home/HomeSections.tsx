import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, Coins, Landmark, PiggyBank, ShieldCheck, Smartphone, Timer, Users, Zap } from 'lucide-react';
import { CoinIcon } from '../market/CoinIcon';
import { useTopMarkets } from '../../hooks/useTopMarkets';
import { STRATEGY_CARDS } from '../../data/constants';
import { cn, formatCompact, formatPct } from '../../utils/format';

/* ---------------- Top trader / copy trading teaser ---------------- */

export function TopTraderSection(): React.ReactElement {
  const navigate = useNavigate();
  return (
    <section className="mx-auto max-w-shell px-4 pt-14">
      <div className="flex items-end justify-between">
        <h2 className="text-[22px] font-bold text-txt-dark">Top Trader</h2>
        <button type="button" onClick={() => navigate('/placeholder/copy-trading')} className="flex items-center gap-1 text-[13px] font-medium text-txt-darksec hover:text-txt-dark">
          All <ArrowRight size={13} />
        </button>
      </div>
      <p className="mt-1 text-[13px] text-txt-darksec">One-click copy trading, long-term profits.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {STRATEGY_CARDS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => navigate('/placeholder/ai-strategy')}
            className="rounded-2xl border border-bd-light bg-white p-5 text-left shadow-card transition-shadow hover:shadow-pop"
          >
            <div className="flex items-center gap-2">
              <Zap size={15} className="text-accent-deep" />
              <span className="text-[14px] font-bold text-txt-dark">{s.pair}</span>
              <span
                className={cn(
                  'rounded px-1.5 py-0.5 text-[10px] font-bold',
                  s.tone === 'blue' && 'bg-[#e8f1ff] text-[#274bdb]',
                  s.tone === 'gold' && 'bg-[#fff6dd] text-[#b07d00]',
                  s.tone === 'red' && 'bg-[#ffe9ec] text-[#d3304a]',
                )}
              >
                {s.label}
              </span>
              <span className="ml-auto text-[11px] font-medium text-[#274bdb]">AI analysis →</span>
            </div>
            <div className="mt-3 text-[12px] text-txt-darksec">
              30D backtested APY: <span className="text-[16px] font-extrabold text-up">{s.apy}</span>
            </div>
            <dl className="mt-3 space-y-2 text-[12px]">
              <div className="flex justify-between">
                <dt className="text-txt-darksec">Price range (USDT)</dt>
                <dd className="num font-semibold text-txt-dark">{s.priceRange}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-txt-darksec">Min capital (USDT)</dt>
                <dd className="num font-semibold text-txt-dark">{s.minCapital}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-txt-darksec">Drawdown</dt>
                <dd className="num font-semibold text-txt-dark">{s.drawdown}</dd>
              </div>
            </dl>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Hot sectors ---------------- */

export function HotSectorsSection(): React.ReactElement {
  const navigate = useNavigate();
  const { assets } = useTopMarkets();
  const sectors = [
    { name: 'AI', picks: ['WLD', 'TAO', 'RNDR', 'GRT', 'VIRTUAL'] },
    { name: 'MEME', picks: ['DOGE', 'SHIB', 'PEPE', 'POP CAT'.replace(' ', ''), 'FLOKI'] },
    { name: 'RWA', picks: ['XAU', 'XAG', 'ONDO', 'POLY', 'CFG'] },
  ];
  return (
    <section className="mx-auto max-w-shell px-4 pt-14">
      <h2 className="text-[22px] font-bold text-txt-dark">Hot Sectors</h2>
      <p className="mt-1 text-[13px] text-txt-darksec">The most active themes across crypto, right now.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {sectors.map((s) => (
          <div key={s.name} className="rounded-2xl border border-bd-light bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-black/[.05] px-2 py-1 text-[12px] font-bold text-txt-dark">{s.name}</span>
              <button type="button" onClick={() => navigate('/trade/xrp_usdt')} className="text-[11px] font-medium text-txt-darksec hover:text-txt-dark">
                All →
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {s.picks.slice(0, 4).map((sym) => {
                const a = assets.find((x) => x.symbol === sym);
                const chg = a?.change24hPct ?? ((sym.charCodeAt(0) % 7) - 3) * 1.4;
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => navigate(`/trade/${sym.toLowerCase()}_usdt`)}
                    className="flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left hover:bg-black/[.04]"
                  >
                    <CoinIcon symbol={sym} size={18} logoUrl={a?.logoUrl} />
                    <span className="text-[12px] font-semibold text-txt-dark">{sym}/USDT</span>
                    <span className="num ml-auto text-[12px] text-txt-darksec">{a ? `$${formatCompact(a.priceUsd)}` : '—'}</span>
                    <span className={cn('num w-14 text-right text-[12px] font-semibold', chg >= 0 ? 'text-up' : 'text-down')}>
                      {formatPct(chg)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Leveraged ETFs ---------------- */

export function EtfSection(): React.ReactElement {
  const navigate = useNavigate();
  const rows = [
    { sym: 'SUI3L', chg: 12.83, vol: '15.19 M' },
    { sym: 'XAU3L', chg: 2.08, vol: '14.12 M' },
    { sym: 'ZEC3L', chg: 32.17, vol: '11.64 M' },
    { sym: 'CL3L', chg: 4.96, vol: '11.58 M' },
    { sym: 'WLD3L', chg: 31.31, vol: '11.39 M' },
    { sym: 'HYPE3L', chg: 4.86, vol: '11.03 M' },
  ];
  return (
    <section className="mx-auto max-w-shell px-4 pt-14">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-txt-dark">Leveraged ETFs</h2>
          <p className="mt-1 text-[13px] text-txt-darksec">Safe &amp; easy trading, without risk of liquidation.</p>
        </div>
        <div className="flex gap-2">
          <span className="rounded-lg bg-[#ffe9ec] px-2.5 py-1 text-[11px] font-bold text-[#d3304a]">HOT LONG</span>
          <span className="rounded-lg bg-[#e6f9f1] px-2.5 py-1 text-[11px] font-bold text-[#0e9f6e]">HOT SHORT</span>
        </div>
      </div>
      <div className="mt-5 overflow-hidden rounded-2xl border border-bd-light bg-white shadow-card">
        <div className="overflow-x-auto scroll-light">
          <div className="min-w-[640px]">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_.8fr] px-5 py-3 text-[12px] text-txt-darksec">
          <span>Top Traded Pairs</span>
          <span className="text-right">Price</span>
          <span className="text-right">24h Chg</span>
          <span className="text-right">24h Volume</span>
        </div>
        {rows.map((r) => (
          <div key={r.sym} className="grid grid-cols-[1.4fr_1fr_1fr_.8fr] items-center border-t border-bd-light/60 px-5 py-3">
            <span className="flex items-center gap-2">
              <CoinIcon symbol={r.sym.replace(/[0-9][LS]$/, '')} size={20} />
              <span className="text-[13px] font-semibold text-txt-dark">{r.sym}</span>
            </span>
            <span className="num text-right text-[13px] text-txt-darksec">—</span>
            <span className={cn('num text-right text-[13px] font-semibold', r.chg >= 0 ? 'text-up' : 'text-down')}>
              {formatPct(r.chg)}
            </span>
            <span className="flex items-center justify-end gap-3">
              <span className="num text-[13px] text-txt-darksec">${r.vol}</span>
              <button
                type="button"
                onClick={() => navigate('/placeholder/leveraged-etf')}
                className="rounded-lg bg-accent px-3 py-1 text-[11px] font-bold text-night-900 hover:bg-accent-hover"
              >
                Trade
              </button>
            </span>
          </div>
        ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Earn + Loans ---------------- */

export function EarnLoansSection(): React.ReactElement {
  const navigate = useNavigate();
  return (
    <section className="mx-auto grid max-w-shell gap-5 px-4 pt-14 md:grid-cols-2">
      <div className="rounded-2xl bg-gradient-to-br from-[#fff8e6] to-[#ffedd2] p-6">
        <div className="flex items-center gap-2">
          <PiggyBank size={18} className="text-accent-deep" />
          <h2 className="text-[18px] font-bold text-txt-dark">Bityaris Earn</h2>
        </div>
        <p className="mt-2 text-[13px] text-txt-darksec">Flexible staking, locked products and daily reward payouts.</p>
        <ul className="mt-4 space-y-2 text-[13px] text-txt-dark">
          <li className="flex justify-between"><span>Flexible USDT</span><span className="num font-bold text-up">10.0% APR</span></li>
          <li className="flex justify-between"><span>XRP Power Piggy</span><span className="num font-bold text-up">6.8% APR</span></li>
          <li className="flex justify-between"><span>ETH Staking</span><span className="num font-bold text-up">4.5% APR</span></li>
        </ul>
        <button type="button" onClick={() => navigate('/placeholder/staking')} className="mt-5 rounded-lg bg-txt-dark px-4 py-2 text-[12px] font-semibold text-white hover:opacity-90">
          Start earning
        </button>
      </div>
      <div className="rounded-2xl bg-gradient-to-br from-[#eef3ff] to-[#dfe9ff] p-6">
        <div className="flex items-center gap-2">
          <Landmark size={18} className="text-[#274bdb]" />
          <h2 className="text-[18px] font-bold text-txt-dark">Bityaris Loans</h2>
        </div>
        <p className="mt-2 text-[13px] text-txt-darksec">Borrow a wide range of cryptocurrencies against your collateral.</p>
        <ul className="mt-4 space-y-2 text-[13px] text-txt-dark">
          <li className="flex justify-between"><span>USDT borrow rate</span><span className="num font-bold">8.8% APR</span></li>
          <li className="flex justify-between"><span>BTC borrow rate</span><span className="num font-bold">0.9% APR</span></li>
          <li className="flex justify-between"><span>Collateral assets</span><span className="num font-bold">30+</span></li>
        </ul>
        <button type="button" onClick={() => navigate('/placeholder/loans')} className="mt-5 rounded-lg bg-[#274bdb] px-4 py-2 text-[12px] font-semibold text-white hover:opacity-90">
          Borrow now
        </button>
      </div>
    </section>
  );
}

/* ---------------- Platform stats + trust ---------------- */

export function PlatformStatsSection(): React.ReactElement {
  const { snapshot } = useTopMarkets();
  const totalVolume = snapshot.assets.reduce((s, a) => s + a.volume24hUsd, 0);
  const features = [
    { icon: ShieldCheck, title: 'Reliable security', desc: 'Cold storage, proof-of-reserves audits and 2FA by default.' },
    { icon: Timer, title: 'Quick deposits & withdrawals', desc: 'Automated pipelines across 40+ networks.' },
    { icon: BarChart3, title: 'Technical stability', desc: 'Matching engine tested beyond 1.4M orders per second.' },
    { icon: Coins, title: 'XRP focused', desc: 'Deep XRP liquidity with dedicated XRP quote markets.' },
  ];
  return (
    <section className="mt-16 bg-night-900 py-14 text-white">
      <div className="mx-auto max-w-shell px-4">
        <h2 className="text-[24px] font-bold">One-stop trading platform</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-night-700 p-6">
            <div className="text-[12px] text-txt-secondary">24-hour volume (USD)</div>
            <div className="num mt-2 text-[30px] font-extrabold text-accent">${formatCompact(totalVolume || 0)}</div>
            <div className="mt-1 text-[11px] text-txt-muted">Aggregated from the top-50 market dataset</div>
          </div>
          <div className="rounded-2xl bg-night-700 p-6">
            <div className="text-[12px] text-txt-secondary">Listed assets</div>
            <div className="num mt-2 text-[30px] font-extrabold">1,200+</div>
            <div className="mt-1 text-[11px] text-txt-muted">Across spot, futures and ETF markets</div>
          </div>
          <div className="rounded-2xl bg-night-700 p-6">
            <div className="text-[12px] text-txt-secondary">Registered users</div>
            <div className="num mt-2 text-[30px] font-extrabold">40M+</div>
            <div className="mt-1 text-[11px] text-txt-muted">In 180+ countries and regions</div>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-night-500 p-5">
              <f.icon size={20} className="text-accent" />
              <h3 className="mt-3 text-[14px] font-semibold">{f.title}</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-txt-secondary">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- App download + community ---------------- */

export function DownloadBand(): React.ReactElement {
  const navigate = useNavigate();
  return (
    <section className="mx-auto flex max-w-shell flex-col items-center gap-6 px-4 py-14 md:flex-row md:justify-between">
      <div>
        <h2 className="text-[24px] font-bold text-txt-dark">Trade anywhere</h2>
        <p className="mt-2 max-w-[420px] text-[13px] text-txt-darksec">
          Full portfolios, price alerts and strategy bots in your pocket. Scan the QR code or pick your store.
        </p>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => navigate('/download')} className="rounded-lg bg-txt-dark px-4 py-2 text-[12px] font-semibold text-white hover:opacity-90">
            iOS Download
          </button>
          <button type="button" onClick={() => navigate('/download')} className="rounded-lg bg-txt-dark px-4 py-2 text-[12px] font-semibold text-white hover:opacity-90">
            Android Download
          </button>
          <button type="button" onClick={() => navigate('/download')} className="rounded-lg border border-bd-light px-4 py-2 text-[12px] font-semibold text-txt-dark hover:bg-black/5">
            More Download Options
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Smartphone size={64} className="text-txt-darksec" />
        <div className="rounded-xl border border-bd-light bg-white p-3 shadow-card">
          <QrMini />
        </div>
      </div>
    </section>
  );
}

function QrMini(): React.ReactElement {
  const cells: React.ReactElement[] = [];
  let seed = 21;
  const rnd = () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };
  for (let y = 0; y < 15; y++)
    for (let x = 0; x < 15; x++) {
      const finder = (x < 5 && y < 5) || (x >= 10 && y < 5) || (x < 5 && y >= 10);
      let on = false;
      if (finder) {
        const lx = x < 5 ? x : x - 10;
        const ly = y < 5 ? y : y - 10;
        on = lx === 0 || ly === 0 || lx === 4 || ly === 4 || (lx === 2 && ly === 2);
      } else on = rnd() > 0.5;
      if (on) cells.push(<rect key={`${x}-${y}`} x={x * 6} y={y * 6} width={6} height={6} fill="#1e2329" />);
    }
  return (
    <svg width={96} height={96} viewBox="0 0 90 90" aria-label="Demo download QR">
      {cells}
    </svg>
  );
}

export function CommunitySection(): React.ReactElement {
  const navigate = useNavigate();
  const groups = ['English', 'Spanish', 'Vietnamese', 'CIS'];
  return (
    <section className="border-t border-bd-light bg-[#f7f8fa] py-12">
      <div className="mx-auto max-w-shell px-4">
        <h2 className="text-[22px] font-bold text-txt-dark">Join the Bityaris Community</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow-card">
            <Users size={18} className="text-txt-darksec" />
            <h3 className="mt-2 text-[14px] font-semibold text-txt-dark">Telegram</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {groups.map((g) => (
                <button key={g} type="button" onClick={() => navigate('/placeholder/telegram')} className="rounded-lg border border-bd-light px-3 py-1.5 text-[12px] text-txt-dark hover:bg-black/5">
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-card">
            <Users size={18} className="text-txt-darksec" />
            <h3 className="mt-2 text-[14px] font-semibold text-txt-dark">Social</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {['X / Twitter', 'Discord', 'YouTube', 'Blog'].map((g) => (
                <button key={g} type="button" onClick={() => navigate('/placeholder/social')} className="rounded-lg border border-bd-light px-3 py-1.5 text-[12px] text-txt-dark hover:bg-black/5">
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
