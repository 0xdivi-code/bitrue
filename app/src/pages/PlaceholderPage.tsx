import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';

const TITLES: Record<string, string> = {
  announcements: 'Announcements',
  'rewards-center': 'Rewards Center',
  anniversary: '8th Anniversary Celebration',
  staking: 'Staking & Earn',
  loans: 'Crypto Loans',
  'copy-trading': 'Copy Trading',
  'ai-bot': 'AI Trading Bot',
  'ai-strategy': 'AI Strategy Hub',
  affiliates: 'Partner & Affiliate Program',
  referral: 'Referral Program',
  'leveraged-etf': 'Leveraged ETFs',
  alpha: 'Alpha Markets',
  fees: 'Fee Schedule',
  'help-center': 'Help Center',
};

function titleFrom(slug: string): string {
  if (TITLES[slug]) return TITLES[slug];
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Lightweight mock destination so no internal link is ever dead. */
export default function PlaceholderPage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>();
  const { pathname } = useLocation();
  const key = slug || pathname.split('/').filter(Boolean)[0] || 'page';
  const title = titleFrom(key);
  return (
    <div className="bg-[#f7f8fa] py-16">
      <div className="mx-auto max-w-[720px] px-4 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent-deep">
          <Compass size={26} />
        </span>
        <h1 className="mt-5 text-[26px] font-extrabold text-txt-dark">{title}</h1>
        <p className="mt-3 text-[13px] leading-relaxed text-txt-darksec">
          This destination is part of the frontend demo. The full {title.toLowerCase()} experience is not included in
          this build, but the route exists so navigation stays intact. Market data, trading and account flows remain
          fully simulated.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/" className="rounded-lg border border-bd-light bg-white px-4 py-2 text-[13px] font-semibold text-txt-dark hover:bg-black/5">
            <span className="inline-flex items-center gap-1.5">
              <ArrowLeft size={14} /> Back to home
            </span>
          </Link>
          <Link to="/trade/xrp_usdt" className="rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-night-900 hover:bg-accent-hover">
            Open Spot Trading
          </Link>
        </div>
      </div>
    </div>
  );
}
