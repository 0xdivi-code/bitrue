import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Apple, ArrowRight, Chrome, Megaphone, QrCode } from 'lucide-react';
import { GoldButton } from '../ui/primitives';
import { MarketShowcase } from './MarketShowcase';
import { useUi } from '../../state/UiContext';
import { useAuth } from '../../state/AuthContext';
import { ANNOUNCEMENTS } from '../../data/constants';

const STATS = [
  { value: '8 Year +', caption: 'Operating since 2018' },
  { value: '40M +', caption: 'Registered users' },
  { value: '1200 +', caption: 'Cryptocurrencies' },
];

export function HeroSection(): React.ReactElement {
  const navigate = useNavigate();
  const { openModal, pushToast } = useUi();
  const { account } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);

  const submit = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setError(null);
    if (account.loggedIn) {
      pushToast({ tone: 'info', title: 'You are already signed in', body: 'This demo registration is simulated.' });
      return;
    }
    openModal('auth', { mode: 'signup' });
    pushToast({ tone: 'success', title: 'Registration started (simulated)', body: `${email} will be used for the demo account.` });
  };

  const announce = ANNOUNCEMENTS[idx];

  return (
    <section className="mx-auto grid max-w-shell gap-10 px-4 pt-12 lg:grid-cols-[1fr_460px]">
      {/* left: headline + registration */}
      <div>
        <h1 className="text-[40px] font-extrabold leading-[1.15] tracking-tight text-txt-dark md:text-[46px]">
          Join Orbitex, become the
          <br />
          Next <span className="text-[#ff9f43]">Crypto Legend</span>
        </h1>

        <div className="mt-7 flex flex-wrap gap-10">
          {STATS.map((s) => (
            <div key={s.value}>
              <div className="text-[19px] font-bold text-txt-dark">{s.value}</div>
              <div className="mt-1 text-[12px] text-txt-darksec">{s.caption}</div>
            </div>
          ))}
        </div>

        <div className="mt-7 flex items-center gap-2 text-[13px] text-txt-darksec">
          <span className="text-[16px]">🎁</span>
          New User Exclusive Event! Get <span className="font-semibold text-txt-dark">6752</span> USDT!
        </div>

        <div className="mt-4 flex w-full max-w-[430px] items-center rounded-xl border border-bd-light bg-white p-1.5 shadow-card">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="E-mail address"
            aria-label="E-mail address"
            className="input-light min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[14px] text-txt-dark outline-none"
          />
          <GoldButton size="lg" onClick={submit}>
            Sign Up <ArrowRight size={15} />
          </GoldButton>
        </div>
        {error && <p className="mt-2 text-[12px] font-medium text-down">{error}</p>}

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            aria-label="Continue with Google"
            onClick={() => pushToast({ tone: 'info', title: 'Google sign-up simulated', body: 'No OAuth handshake occurs in this demo.' })}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-bd-light bg-white text-txt-dark hover:bg-black/5"
          >
            <Chrome size={18} />
          </button>
          <button
            type="button"
            aria-label="Continue with Apple"
            onClick={() => pushToast({ tone: 'info', title: 'Apple sign-up simulated', body: 'No OAuth handshake occurs in this demo.' })}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-bd-light bg-white text-txt-dark hover:bg-black/5"
          >
            <Apple size={18} />
          </button>
          <span className="h-8 w-px bg-bd-light" />
          <button
            type="button"
            aria-label="Download app via QR code"
            onClick={() => openModal('download')}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-bd-light bg-white text-txt-dark hover:bg-black/5"
          >
            <QrCode size={18} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIdx((idx + 1) % ANNOUNCEMENTS.length)}
          className="mt-8 flex w-full max-w-[560px] items-center gap-3 rounded-lg px-1 py-2 text-left transition-colors hover:bg-black/[.03]"
        >
          <Megaphone size={17} className="shrink-0 text-txt-dark" />
          <span className="flex-1 truncate text-[13px] text-txt-dark">
            <span className="mr-2 rounded bg-black/[.06] px-1.5 py-0.5 text-[10px] font-semibold text-txt-darksec">
              {announce.tag}
            </span>
            {announce.title}
          </span>
          <span className="shrink-0 text-[12px] font-medium text-txt-darksec">All</span>
          <ArrowRight size={14} className="shrink-0 text-txt-darksec" />
        </button>
      </div>

      {/* right: market sentiment + popular + gainers card */}
      <MarketShowcase onTrade={() => navigate('/trade/xrp_usdt')} />
    </section>
  );
}
