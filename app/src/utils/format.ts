/** Small formatting helpers used across every market UI. */

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function formatNumber(value: number, decimals?: number): string {
  if (!Number.isFinite(value)) return '--';
  const d = decimals ?? defaultDecimals(value);
  return value.toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

export function defaultDecimals(value: number): number {
  const v = Math.abs(value);
  if (v === 0) return 2;
  if (v >= 1000) return 2;
  if (v >= 1) return 2;
  if (v >= 0.01) return 4;
  if (v >= 0.0001) return 6;
  return 8;
}

/** Price formatting with adaptive precision, no currency symbol. */
export function formatPrice(value: number | null | undefined, precision?: number): string {
  if (value == null || !Number.isFinite(value)) return '--';
  return formatNumber(value, precision ?? defaultDecimals(value));
}

export function formatUsd(value: number | null | undefined, precision?: number): string {
  if (value == null || !Number.isFinite(value)) return '--';
  return `$${formatNumber(value, precision ?? defaultDecimals(value))}`;
}

export function formatCompact(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '--';
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${trim(value / 1e12)}T`;
  if (abs >= 1e9) return `${trim(value / 1e9)}B`;
  if (abs >= 1e6) return `${trim(value / 1e6)}M`;
  if (abs >= 1e3) return `${trim(value / 1e3)}K`;
  return formatNumber(value, abs >= 100 ? 0 : 2);
}

function trim(v: number): string {
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatPct(value: number | null | undefined, signed = true): string {
  if (value == null || !Number.isFinite(value)) return '--';
  const s = signed && value > 0 ? '+' : '';
  return `${s}${value.toFixed(2)}%`;
}

export function formatTime(ts: number, withSeconds = true): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (!withSeconds) return `${hh}:${mm}`;
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function formatDateTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${formatTime(ts, false)}`;
}

export function formatClock(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false });
}

export function timeAgo(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Stable pseudo-random generator (mulberry32) for reproducible simulated data. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
