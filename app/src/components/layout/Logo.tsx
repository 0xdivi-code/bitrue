import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '../../data/constants';

/**
 * Platform logo: the supplied Bityaris mark (remote asset) with an inline
 * geometric SVG fallback so the header never breaks if the CDN is blocked.
 */
export function Logo({ compact = false, tone = 'dark' }: { compact?: boolean; tone?: 'dark' | 'light' }): React.ReactElement {
  const [failed, setFailed] = useState(false);
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label={`${BRAND.name} home`}>
      {failed ? (
        <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M32 6 L54 18 V46 L32 58 L10 46 V18 Z" fill="none" stroke="#f0b90b" strokeWidth="5" strokeLinejoin="round" />
          <path d="M32 21 L42 26.5 V37.5 L32 43 L22 37.5 V26.5 Z" fill="#f0b90b" />
        </svg>
      ) : (
        <img
          src={BRAND.logoUrl}
          alt={`${BRAND.name} logo`}
          width="32"
          height="32"
          className="h-8 w-8 object-contain"
          onError={() => setFailed(true)}
        />
      )}
      {!compact && (
        <span className="leading-none">
          <span className={`block text-[19px] font-bold tracking-tight ${tone === 'dark' ? 'text-white' : 'text-txt-dark'}`}>
            {BRAND.name}
          </span>
          <span className="mt-0.5 block text-[9px] font-medium uppercase tracking-[0.14em] text-txt-secondary">
            {BRAND.tagline}
          </span>
        </span>
      )}
    </Link>
  );
}
