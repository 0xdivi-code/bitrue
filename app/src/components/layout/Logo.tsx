import React from 'react';
import { Link } from 'react-router-dom';

/** Original Orbitex wordmark (geometric orbit mark + wordmark). */
export function Logo({ compact = false }: { compact?: boolean }): React.ReactElement {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Orbitex home">
      <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true">
        <path
          d="M32 6 L54 18 V46 L32 58 L10 46 V18 Z"
          fill="none"
          stroke="#f0b90b"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <path d="M32 21 L42 26.5 V37.5 L32 43 L22 37.5 V26.5 Z" fill="#f0b90b" />
      </svg>
      {!compact && (
        <span className="leading-none">
          <span className="block text-[19px] font-bold tracking-tight text-white">
            orbitex
          </span>
          <span className="mt-0.5 block text-[9px] font-medium uppercase tracking-[0.14em] text-txt-secondary">
            Built for what&apos;s next
          </span>
        </span>
      )}
    </Link>
  );
}
