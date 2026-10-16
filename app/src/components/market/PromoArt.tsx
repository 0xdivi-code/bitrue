import React from 'react';
import type { PromoCard } from '../../types/domain';

/**
 * Original generative banner artwork (SVG gradients + geometry) standing in
 * for promotional artwork. Keeps the same footprint as the reference cards.
 */
export function PromoArt({
  art,
  from,
  to,
  height = 120,
}: {
  art: PromoCard['art'];
  from: string;
  to: string;
  height?: number;
}): React.ReactElement {
  const id = `art-${art}`;
  return (
    <svg viewBox="0 0 320 140" style={{ height, width: '100%' }} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.7" cy="0.3" r="0.8">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="140" fill={`url(#${id})`} />
      <rect width="320" height="140" fill={`url(#${id}-glow)`} />
      {art === 'anniversary' && (
        <g>
          <circle cx="248" cy="70" r="34" fill="#fff" opacity="0.16" />
          <circle cx="248" cy="70" r="22" fill="#fff" opacity="0.22" />
          <text x="248" y="78" textAnchor="middle" fontSize="26" fontWeight="800" fill="#fff">
            8
          </text>
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={26 + i * 14} y={96 - (i % 3) * 10} width="8" height="34" rx="3" fill="#fff" opacity={0.25 + i * 0.08} />
          ))}
        </g>
      )}
      {art === 'usdc' && (
        <g>
          <circle cx="236" cy="70" r="30" fill="#2775ca" />
          <text x="236" y="80" textAnchor="middle" fontSize="30" fontWeight="800" fill="#fff">
            $
          </text>
          <circle cx="278" cy="52" r="16" fill="#0b1e3a" opacity="0.85" />
          <text x="278" y="58" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff">
            X
          </text>
        </g>
      )}
      {art === 'ai' && (
        <g stroke="#fff" strokeWidth="2" fill="none" opacity="0.8">
          <circle cx="230" cy="60" r="10" />
          <circle cx="270" cy="44" r="7" />
          <circle cx="282" cy="86" r="9" />
          <circle cx="238" cy="102" r="6" />
          <path d="M238 66 L266 48 M236 68 L276 82 M232 68 L238 96" />
        </g>
      )}
      {art === 'migration' && (
        <g fill="#fff" opacity="0.85">
          <path d="M210 78 L258 78 L258 62 L286 84 L258 106 L258 92 L210 92 Z" />
          <circle cx="188" cy="85" r="14" opacity="0.5" />
        </g>
      )}
      {art === 'staking' && (
        <g fill="#fff" opacity="0.9">
          <rect x="216" y="84" width="12" height="26" rx="3" />
          <rect x="234" y="68" width="12" height="42" rx="3" />
          <rect x="252" y="52" width="12" height="58" rx="3" />
          <rect x="270" y="36" width="12" height="74" rx="3" />
        </g>
      )}
      {art === 'referral' && (
        <g fill="#fff" opacity="0.9">
          <circle cx="238" cy="58" r="14" />
          <circle cx="272" cy="70" r="10" />
          <path d="M216 104 a22 22 0 0 1 44 0 Z" />
          <path d="M258 104 a15 15 0 0 1 30 0 Z" opacity="0.7" />
        </g>
      )}
    </svg>
  );
}
