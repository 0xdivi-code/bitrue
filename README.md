# Bityaris — Crypto Exchange Frontend (demo)

A complete, multi-page cryptocurrency-exchange frontend: **React + TypeScript + Vite**, **Tailwind CSS**, **React Router**, **Lucide icons**, **TradingView Lightweight Charts**, **CCXT** (unified REST + Pro WebSockets) and **HarmonyOS Sans** typography, wired to live public market data for **spot and perpetual futures** with a clearly-labelled simulated fallback.

> **Protected baseline:** tag `protected-v1` (commit `2cccd39`) preserves the previous stable build (pre-rebrand). Roll back or diff against it any time: `git diff protected-v1..HEAD`.
>
> **Honesty notes**
> - All accounts, balances, orders and fills are **simulated in the browser** and always labelled as such. Real order routing is architected (`src/services/executionAdapter.ts`) but deliberately unwired: it requires a backend proxy holding exchange API keys server-side and testnet credentials — never secrets in frontend code.
> - Live market data uses **free, key-less public endpoints** via CCXT (Binance, Bybit, OKX). Where a venue is unreachable (offline, geo-block, rate limit) the UI falls back to a deterministic simulated engine and **badges the state** (`live / stale / simulated`) — fabricated data is never shown as live.
> - Brand assets: the Bityaris logo is loaded from the supplied URL with an inline SVG fallback; HarmonyOS Sans is bundled locally under its free licence (`app/public/fonts/HARMONYOS-SANS-LICENSE.txt`).

---

## 1. Quick start

```bash
cd app
npm install
npm run dev        # http://localhost:5173 (0.0.0.0:5173)
npm run build      # type-check + production bundle
npm run preview
node .smoke/smoke.cjs   # optional jsdom render smoke test (rebuild first, see §7)
```

Node 18+ (22 tested). **No environment variables, no API keys, no secrets.**

## 2. Routes

| Path | Page |
| --- | --- |
| `/` | Homepage: hero + registration, sentiment/popular/gainers card, announcements, promo carousel, market tabs table, sectors, ETFs, earn/loans, stats band, download & community |
| `/trade/:pair?ex=binance&m=swap` | Unified trading terminal — spot or perpetual, per-venue catalog, live book/trades/candles, Limit/Market/Trigger forms |
| `/futures` | Perpetual terminal preset (funding/mark/index, strategy cards, positions tabs) |
| `/buy-usdt` | Quick buy/sell widget, payment methods, 3-step guide, FAQ |
| `/login` `/signup` `/forgot` | Simulated auth pages (+ global auth modal) |
| `/placeholder/:slug`, `/download` | Mock destinations so no link is dead |
| `*` | 404 |

## 3. Market-data architecture (CCXT)

`src/services/`

| Module | Role |
| --- | --- |
| `ccxtAdapters.ts` | CCXT adapters for **Binance / Bybit / OKX**: `loadMarkets` catalog (spot + linear perps with tick/step/min sizes), `fetchTicker/fetchOrderBook/fetchTrades/fetchOHLCV`, `fetchFundingRate` (mark/index/funding/next-funding), and CCXT **Pro** `watchTicker/watchOrderBook/watchTrades` streams with auto-reconnect + exchange-documented book sync |
| `adapterTypes.ts` | Venue-agnostic `ExchangeAdapter` contract + interval map |
| `exchangeAdapters.ts` | Registry / failover order |
| `marketDataService.ts` | Store keyed `<exchange>|<marketType>|<pair>`; ref-counted single stream per key; per-venue health, per-symbol unsupported memory, 429/451 cooldowns; stale snapshot retention; simulated fallback |
| `globalMarketProvider.ts` | CoinGecko top-50 rankings (60 s poll, cache, stale labelling) for homepage/footer |
| `tradingViewDatafeed.ts` | TradingView Charting-Library-shaped datafeed (`onReady/resolveSymbol/getBars/subscribeBars`) feeding the bundled **Lightweight Charts** renderer; swap-in point for licensed Advanced Charts |
| `simulatedMarket.ts` | Deterministic fallback engine (labelled `simulated`) |
| `executionAdapter.ts` | Execution contract + `UnwiredExecutionAdapter` stub — **fails loudly, never fakes fills** |

Venue-scoped bundling: only the three shipped exchanges are imported (`ccxtBundle.ts` + Vite aliases), keeping the lazy vendor chunk ≈1.1 MB instead of 8.4 MB; it loads only on trading pages.

**Never mixed:** exchange-specific prices (ticker/book/trades/funding) always come from the selected venue; global USD rankings are marked `ref` where shown beside venue prices.

## 4. UI features

- **Venue + market-type switch** in the trading header (Binance/Bybit/OKX × Spot/Perpetual), persisted in the URL (`?ex=&m=swap`).
- **Catalog-driven market selector & sidebar**: search, quote filters, favorites, min-order hints, live venue prices where cached.
- **Order book** with depth bars, grouping, spread, B/S ratio; click-to-fill price; **trades tape**; **funding/mark/index/countdown** on perps.
- **Order forms**: Limit / Market / Trigger, BBO, % allocation, TP/SL, venue min-size/min-cost validation; logged-out gating; simulated matching engine with cancels, fills, history and balance updates.
- **Responsive**: mobile panel tabs (Chart / Order Book / Trades / Place Order), independently scrollable panels, horizontal-scroll tables, stable tabular numerals (no layout shift while streaming), 44 px-class touch targets, press feedback + focus-visible rings on all buttons.
- **Modals/tooltips/dropdowns** with Escape, backdrop dismissal and focus restore; floating support chat; data-source badges everywhere.

## 5. Branding & typography

- Platform name **Bityaris**; logo from `https://i.postimg.cc/6QzR8npH/log0.png` with SVG fallback (`components/layout/Logo.tsx`).
- **HarmonyOS Sans** (400/500/700) subset to Latin, bundled as woff2 in `app/public/fonts/` with Huawei's licence notice; falls back to Inter/system stack if fonts fail.

## 6. Source-inspection checklist (supplied reference material → routes)

`homepage/` → `/`; `spot/` → `/trade/:pair`; `futures/` → `/futures`; `buy-USDT/` → `/buy-usdt`; `login/`, `signup/` → auth pages + modal; `footer.png` → footer taxonomy. The reference site's proprietary HTML/CSS/logo/artwork were used only as a functional/layout reference — the implementation, brand mark, artwork and copy in this repo are original.

## 7. Verification

- `npm run typecheck` clean (strict); `npm run build` green.
- jsdom smoke test renders all 9 routes error-free (`SMOKE PASS`); rebuild bundle with the `esbuild … --alias:ccxt-venue/…` command in `scripts/README-smoke.md`-style (see commit history) or simply run:
  ```bash
  npx esbuild scripts/smoke.tsx --bundle --platform=node --format=cjs --outfile=.smoke/smoke.cjs \
    --jsx=automatic --loader:.css=empty --external:jsdom \
    --alias:ccxt-venue/pro/binance=./node_modules/ccxt/js/src/pro/binance.js \
    --alias:ccxt-venue/pro/bybit=./node_modules/ccxt/js/src/pro/bybit.js \
    --alias:ccxt-venue/pro/okx=./node_modules/ccxt/js/src/pro/okx.js \
    --alias:ccxt-venue/binance=./node_modules/ccxt/js/src/binance.js \
    --alias:ccxt-venue/bybit=./node_modules/ccxt/js/src/bybit.js \
    --alias:ccxt-venue/okx=./node_modules/ccxt/js/src/okx.js && node .smoke/smoke.cjs
  ```
- Data-layer unit smoke: candle monotonicity, book sorting, trade ordering, top-50 ranking, datafeed symbol/resolution mapping.

## 8. Going live with execution (future work)

1. Deploy a small backend proxy storing exchange API keys server-side (testnet first: Binance testnet, Bybit testnet, OKX demo).
2. Implement `ExecutionAdapter` with CCXT unified private calls (`createOrder/cancelOrder/fetchOrders/fetchBalance/fetchPositions`), confirming fills only from venue acknowledgements.
3. Swap `UnwiredExecutionAdapter` in `executionAdapters` and remove the simulated engine for live mode.

**Paid/licensed items:** none required today. TradingView *Advanced Charts* needs a licensed download (Lightweight Charts used instead, free); CCXT Pro streams are included in free CCXT; all exchange market-data endpoints used are public.

---

Demo build for interface study and prototyping. Not financial infrastructure, not affiliated with any exchange, not investment advice.
