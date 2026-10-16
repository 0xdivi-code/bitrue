/**
 * Global market-cap rankings (top 50 assets, USD statistics).
 *
 * Primary provider: CoinGecko public `/coins/markets` endpoint — free tier,
 * no API key, browser CORS enabled. Polled at a rate-limit-friendly interval
 * (60 s) and cached (memory + localStorage) so a temporary outage degrades to
 * a clearly-labelled stale snapshot, then to the simulated dataset.
 */
import type { GlobalAsset, GlobalMarketSnapshot } from '../types/marketDataTypes';
import { cacheGet, cacheSet } from './marketDataCache';
import { simulatedGlobalAssets } from './simulatedMarket';

const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h%2C7d';

const REFRESH_MS = 60_000;
const STALE_MS = 5 * 60_000;
const CACHE_KEY = 'global.top50.v1';

type Listener = (snap: GlobalMarketSnapshot) => void;

class GlobalMarketStore {
  private snapshot: GlobalMarketSnapshot = {
    assets: [],
    source: '—',
    state: 'loading',
    fetchedAt: 0,
    lastSuccessAt: null,
  };
  private listeners = new Set<Listener>();
  private timer: number | null = null;
  private inflight: Promise<void> | null = null;

  getSnapshot(): GlobalMarketSnapshot {
    return this.snapshot;
  }

  subscribe(cb: Listener): () => void {
    this.listeners.add(cb);
    cb(this.snapshot);
    this.ensureStarted();
    return () => this.listeners.delete(cb);
  }

  private set(patch: Partial<GlobalMarketSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((cb) => cb(this.snapshot));
  }

  private ensureStarted(): void {
    if (this.timer != null) return;
    void this.refresh();
    this.timer = window.setInterval(() => void this.refresh(), REFRESH_MS);
  }

  async refresh(force = false): Promise<void> {
    if (this.inflight) return this.inflight;
    this.inflight = this.doRefresh(force).finally(() => {
      this.inflight = null;
    });
    return this.inflight;
  }

  private async doRefresh(force: boolean): Promise<void> {
    const cached = cacheGet<GlobalAsset[]>(CACHE_KEY, STALE_MS);
    if (!force && cached && !cached.stale && cached.entry.value.length) {
      this.set({
        assets: cached.entry.value,
        source: cached.entry.source,
        state: 'cached',
        fetchedAt: cached.entry.fetchedAt,
        lastSuccessAt: cached.entry.fetchedAt,
      });
      return;
    }
    try {
      const ctrl = new AbortController();
      const t = window.setTimeout(() => ctrl.abort(), 10_000);
      const res = await fetch(COINGECKO_URL, { signal: ctrl.signal });
      window.clearTimeout(t);
      if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
      const raw = (await res.json()) as Array<Record<string, unknown>>;
      const assets: GlobalAsset[] = raw
        .map((c, i) => ({
          providerId: String(c.id),
          symbol: String(c.symbol ?? '').toUpperCase(),
          name: String(c.name ?? ''),
          priceUsd: Number(c.current_price ?? 0),
          marketCapUsd: Number(c.market_cap ?? 0),
          volume24hUsd: Number(c.total_volume ?? 0),
          change24hPct: Number(c.price_change_percentage_24h_in_currency ?? c.price_change_percentage_24h ?? 0),
          change7dPct: Number(c.price_change_percentage_7d_in_currency ?? 0),
          rank: Number(c.market_cap_rank ?? i + 1),
          logoUrl: typeof c.image === 'string' ? c.image : undefined,
          sparkline7d: (c.sparkline_in_7d as { price?: number[] } | undefined)?.price,
          updatedAt: Date.now(),
        }))
        .filter((a) => Number.isFinite(a.priceUsd) && a.priceUsd > 0)
        .slice(0, 50);
      if (!assets.length) throw new Error('CoinGecko returned no rows');
      cacheSet(CACHE_KEY, assets, 'coingecko');
      this.set({
        assets,
        source: 'coingecko',
        state: 'live',
        fetchedAt: Date.now(),
        lastSuccessAt: Date.now(),
        error: undefined,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'network error';
      if (cached?.entry.value.length) {
        // outage → keep last successful snapshot, labelled stale
        this.set({
          assets: cached.entry.value,
          source: cached.entry.source,
          state: 'stale',
          fetchedAt: cached.entry.fetchedAt,
          error: message,
        });
      } else {
        this.set({
          assets: simulatedGlobalAssets(50),
          source: 'simulated',
          state: 'simulated',
          fetchedAt: Date.now(),
          error: message,
        });
      }
    }
  }
}

export const globalMarketStore = new GlobalMarketStore();
