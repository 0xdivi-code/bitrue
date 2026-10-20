import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '../../data/constants';

/**
 * Platform logo — image mark only (no wordmark, no tagline), with an inline
 * geometric SVG fallback so the shell never breaks if the CDN is blocked.
 */
export function Logo({ size = 34 }: { size?: number }): React.ReactElement {
  const [failed, setFailed] = useState(false);
  return (
    <Link to="/" className="flex shrink-0 items-center" aria-label={`${BRAND.name} home`}>
      {failed ? (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
          <path d="M32 6 L54 18 V46 L32 58 L10 46 V18 Z" fill="none" stroke="#f0b90b" strokeWidth="5" strokeLinejoin="round" />
          <path d="M32 21 L42 26.5 V37.5 L32 43 L22 37.5 V26.5 Z" fill="#f0b90b" />
        </svg>
      ) : (
        <img
          src={BRAND.logoUrl}
          alt={`${BRAND.name} logo`}
          width={size}
          height={size}
          style={{ width: size, height: size }}
          className="object-contain"
          onError={() => setFailed(true)}
        />
      )}
    </Link>
  );
}
