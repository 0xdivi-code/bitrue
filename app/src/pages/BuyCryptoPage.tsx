import React, { useState } from 'react';
import { ArrowDown, ChevronDown, CreditCard } from 'lucide-react';
import { BUY_FAQ, PAYMENT_METHODS } from '../data/constants';
import { useTopMarkets } from '../hooks/useTopMarkets';
import { useAuth } from '../state/AuthContext';
import { useUi } from '../state/UiContext';
import { CoinIcon } from '../components/market/CoinIcon';
import { GoldButton, Tabs } from '../components/ui/primitives';
import { cn, formatNumber } from '../utils/format';

const FIAT = ['USD', 'EUR', 'GBP', 'NGN', 'BRL', 'TRY'];

/** Quick-buy page: buy/sell widget, payment methods, 3 steps, FAQ. */
export default function BuyCryptoPage(): React.ReactElement {
  const { assets, bySymbol } = useTopMarkets();
  const { account } = useAuth();
  const { openModal, pushToast } = useUi();
  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [coin, setCoin] = useState('USDT');
  const [fiat, setFiat] = useState('USD');
  const [amount, setAmount] = useState('100');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const coinAsset = bySymbol.get(coin);
  const rate = coin === 'USDT' ? 1 : coinAsset?.priceUsd ?? 1;
  const receive = mode === 'buy' ? (parseFloat(amount) || 0) / rate : (parseFloat(amount) || 0) * rate;

  const submit = () => {
    if (!account.loggedIn) {
      openModal('auth', { mode: 'login' });
      return;
    }
    pushToast({
      tone: 'success',
      title: `${mode === 'buy' ? 'Purchase' : 'Sale'} simulated`,
      body: `${amount} ${mode === 'buy' ? fiat : coin} → ${formatNumber(receive, 4)} ${mode === 'buy' ? coin : fiat}. No payment was processed.`,
    });
  };

  return (
    <div className="bg-[#f7f8fa] pb-16">
      <section className="bg-night-900 py-12 text-white">
        <div className="mx-auto max-w-shell px-4">
          <h1 className="text-[30px] font-extrabold">Buy Tether USDt (USDT) instantly with a card</h1>
          <p className="mt-3 max-w-[720px] text-[13px] leading-relaxed text-txt-secondary">
            Buy USDT and many other cryptocurrencies with over 50 payment methods — cards, bank transfers, fiat
            deposits and more. In this demo every quote and purchase is simulated.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px] text-txt-secondary">
            <CreditCard size={14} /> Accepted payment methods:
            {PAYMENT_METHODS.map((m) => (
              <span key={m} className="rounded-md bg-night-700 px-2 py-1 font-semibold text-txt-primary">
                {m}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-6 max-w-shell px-4">
        <div className="rounded-2xl bg-white p-6 shadow-pop">
          <Tabs
            tone="light"
            tabs={[
              { id: 'buy', label: 'Buy' },
              { id: 'sell', label: 'Sell' },
            ]}
            active={mode}
            onChange={(id) => setMode(id as 'buy' | 'sell')}
          />

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_1fr]">
            <label className="block rounded-xl border border-bd-light p-4">
              <span className="text-[11px] text-txt-darksec">{mode === 'buy' ? 'You pay' : 'You sell'}</span>
              <div className="mt-2 flex items-center gap-2">
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
                  inputMode="decimal"
                  aria-label="Amount"
                  className="num min-w-0 flex-1 text-[22px] font-bold text-txt-dark outline-none"
                />
                {mode === 'buy' ? (
                  <select value={fiat} onChange={(e) => setFiat(e.target.value)} aria-label="Fiat currency" className="rounded-lg bg-black/[.04] px-2 py-1.5 text-[13px] font-semibold text-txt-dark outline-none">
                    {FIAT.map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                ) : (
                  <CoinSelect value={coin} onChange={setCoin} assets={assets.map((a) => a.symbol)} />
                )}
                <button type="button" onClick={() => setAmount('1000')} className="text-[11px] font-bold text-accent-deep">
                  MAX
                </button>
              </div>
              <span className="mt-1 block text-[11px] text-txt-darksec">
                Available: <span className="num">{account.loggedIn ? '12,500.00 USDT (demo)' : '--'}</span>
              </span>
            </label>

            <div className="flex items-center justify-center">
              <span className="rounded-full border border-bd-light bg-white p-2 text-txt-darksec">
                <ArrowDown size={16} />
              </span>
            </div>

            <label className="block rounded-xl border border-bd-light p-4">
              <span className="text-[11px] text-txt-darksec">{mode === 'buy' ? 'You receive' : 'You receive'}</span>
              <div className="mt-2 flex items-center gap-2">
                <span className="num min-w-0 flex-1 truncate text-[22px] font-bold text-txt-dark">
                  {formatNumber(receive, 4)}
                </span>
                {mode === 'buy' ? (
                  <CoinSelect value={coin} onChange={setCoin} assets={assets.map((a) => a.symbol)} />
                ) : (
                  <select value={fiat} onChange={(e) => setFiat(e.target.value)} aria-label="Fiat currency" className="rounded-lg bg-black/[.04] px-2 py-1.5 text-[13px] font-semibold text-txt-dark outline-none">
                    {FIAT.map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                )}
              </div>
              <span className="mt-1 block text-[11px] text-txt-darksec">Simulated quote · refreshes with market data</span>
            </label>
          </div>

          <GoldButton size="lg" className="mt-4 w-full" onClick={submit}>
            {account.loggedIn ? `Confirm ${mode}` : 'Login / Join Us'}
          </GoldButton>
          <p className="mt-2 text-center text-[11px] text-txt-darksec">
            Quotes are indicative. This demo never moves real funds or card data.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-shell px-4">
        <h2 className="text-[20px] font-bold text-txt-dark">Buy USDT in 3 steps</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            'Select the cryptocurrency you want to buy, e.g. Tether USDt.',
            'Choose the best offer and pay with your preferred fiat method.',
            'Wait for the assets to arrive in your account wallet.',
          ].map((s, i) => (
            <div key={i} className="rounded-2xl border border-bd-light bg-white p-5 shadow-card">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[14px] font-black text-night-900">
                {i + 1}
              </span>
              <p className="mt-3 text-[13px] leading-relaxed text-txt-darksec">{s}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-shell px-4">
        <h2 className="text-[20px] font-bold text-txt-dark">FAQ</h2>
        <div className="mt-4 space-y-2">
          {BUY_FAQ.map((f, i) => (
            <div key={f.q} className="overflow-hidden rounded-xl border border-bd-light bg-white">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left text-[14px] font-semibold text-txt-dark"
                aria-expanded={openFaq === i}
              >
                {f.q}
                <ChevronDown size={16} className={cn('transition-transform', openFaq === i && 'rotate-180')} />
              </button>
              {openFaq === i && <p className="border-t border-bd-light px-5 py-4 text-[13px] leading-relaxed text-txt-darksec">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function CoinSelect({ value, onChange, assets }: { value: string; onChange: (v: string) => void; assets: string[] }): React.ReactElement {
  return (
    <span className="relative inline-flex items-center">
      <CoinIcon symbol={value} size={20} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Coin"
        className="appearance-none rounded-lg bg-black/[.04] py-1.5 pl-2 pr-6 text-[13px] font-semibold text-txt-dark outline-none"
      >
        {(assets.length ? assets.slice(0, 30) : ['USDT']).map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-1.5 text-txt-darksec" />
    </span>
  );
}
