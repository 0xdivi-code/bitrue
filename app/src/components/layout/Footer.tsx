import React from 'react';
import { Link } from 'react-router-dom';
import { FOOTER_COLUMNS, BRAND } from '../../data/constants';
import { Logo } from './Logo';
import { useTopMarkets } from '../../hooks/useTopMarkets';
import { formatUsd } from '../../utils/format';

export function Footer(): React.ReactElement {
  const { assets } = useTopMarkets();
  const priceLinks = assets.slice(0, 10);

  return (
    <footer className="bg-night-900 text-txt-secondary">
      <div className="mx-auto max-w-shell px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Logo />
            <p className="mt-4 text-[12px] leading-relaxed">
              {BRAND.name} is a frontend demo. Market data is shown for information only; every account action is
              simulated.
            </p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-[13px] font-semibold text-white">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-[12px] transition-colors hover:text-accent">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {priceLinks.length > 0 && (
          <div className="mt-10 border-t border-night-600 pt-6">
            <h4 className="mb-3 text-[13px] font-semibold text-white">Crypto prices</h4>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {priceLinks.map((a) => (
                <Link
                  key={a.providerId}
                  to={`/trade/${a.symbol.toLowerCase()}_usdt`}
                  className="text-[12px] transition-colors hover:text-accent"
                >
                  {a.symbol} Price <span className="num text-txt-muted">{formatUsd(a.priceUsd)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 border-t border-night-600 pt-6 text-[11px] md:flex-row md:items-center md:justify-between">
          <p>© 2026 {BRAND.name} Demo. Frontend study project — not a real exchange.</p>
          <p className="text-txt-muted">
            Simulated environment: no deposits, withdrawals or real orders are possible.
          </p>
        </div>
      </div>
    </footer>
  );
}
