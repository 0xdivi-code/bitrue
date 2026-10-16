import React from 'react';
import { cn, hashString } from '../../utils/format';

/** Deterministic hue per symbol for the generated coin medallions. */
const HUES: Record<string, [string, string]> = {
  BTC: ['#f7931a', '#e2820f'],
  ETH: ['#627eea', '#4c66d4'],
  XRP: ['#23292f', '#0f1418'],
  USDT: ['#26a17b', '#1d8465'],
  BNB: ['#f3ba2f', '#d9a21b'],
  SOL: ['#14f195', '#9945ff'],
  DOGE: ['#c2a633', '#a68b25'],
  ADA: ['#0033ad', '#002a8f'],
  TRX: ['#ef0027', '#c40020'],
  LINK: ['#2a5ada', '#1f47b5'],
};

function hueFor(symbol: string): [string, string] {
  const h = hashString(symbol) % 360;
  return [`hsl(${h} 62% 52%)`, `hsl(${h} 62% 40%)`];
}

export interface CoinIconProps {
  symbol: string;
  size?: number;
  logoUrl?: string;
  className?: string;
}

/**
 * Coin medallion: provider logo when available, otherwise an original
 * generated SVG mark (gradient disc + letter) that keeps the same footprint.
 */
export function CoinIcon({ symbol, size = 22, logoUrl, className }: CoinIconProps): React.ReactElement {
  const [from, to] = HUES[symbol.toUpperCase()] ?? hueFor(symbol.toUpperCase());
  const letter = symbol.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
  const [bg, fg] = logoUrl ? ['transparent', 'transparent'] : [from, to];
  void bg;
  void fg;
  return (
    <span
      className={cn('relative inline-flex shrink-0 items-center justify-center rounded-full', className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          className="rounded-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
            const sib = e.currentTarget.nextElementSibling as HTMLElement | null;
            if (sib) sib.style.display = 'flex';
          }}
        />
      ) : null}
      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        style={logoUrl ? { display: 'none' } : undefined}
        className="rounded-full"
      >
        <defs>
          <linearGradient id={`g-${symbol}-${size}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="16" fill={`url(#g-${symbol}-${size})`} />
        <text
          x="16"
          y="21"
          textAnchor="middle"
          fontSize={letter.length > 3 ? 11 : 14}
          fontWeight="700"
          fill="#fff"
          fontFamily="Inter, Arial, sans-serif"
        >
          {letter.slice(0, 3)}
        </text>
      </svg>
    </span>
  );
}
