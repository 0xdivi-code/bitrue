# Orbitex — Crypto Exchange Frontend (demo)

A complete, multi-page cryptocurrency-exchange frontend built with **React + TypeScript + Vite**, **Tailwind CSS**, **React Router**, **Lucide icons**, **Framer-motion-ready styling** and **TradingView Lightweight Charts**, wired to **live public market data** with a clearly-labelled simulated fallback.

> **Scope & honesty notes**
>
> - This repository contains an **original implementation** of a crypto-exchange UI in the style of the supplied reference screenshots: original code, original brand mark ("Orbitex"), original generative SVG artwork and original copy. The supplied HTML/CSS/logo/promotional assets of the reference site are proprietary, so they were used only as a *functional & layout reference* — nothing was copied verbatim.
> - **No real exchange backend exists here.** Accounts, balances, orders, fills, support chat and campaigns are simulated in the browser. Nothing is transmitted, stored server-side, or financially real.
> - **No API keys** are used or required. All live data comes from public, key-less endpoints (CoinGecko market rankings; Binance/OKX public market data). If those are unreachable (offline, geo-blocked, rate-limited) the UI falls back to a deterministic simulated engine and **labels it as simulated** — live indicators are never shown for fabricated data.

---

## 1. Quick start

```bash
cd app
npm install
npm run dev        # http://localhost:5173  (host 0.0.0.0, port 5173)
```

Other scripts:

```bash
npm run build      # type-check + production bundle (app/dist)
npm run preview    # serve the production bundle
npm run typecheck  # tsc --noEmit
node .smoke/smoke.cjs   # optional jsdom render smoke test (see §7)
```

Requirements: Node 18+ (Node 22 tested). No environment variables, no secrets.

## 2. Routes

| Path | Page | Notes |
| --- | --- | --- |
| `/` | Homepage | Hero + registration, sentiment/popular/gainers card, announcement bar, promo carousel, market tabs table, sectors, ETFs, earn/loans, stats band, download & community |
| `/trade/:pair` | Spot trading terminal | e.g. `/trade/xrp_usdt`, `/trade/btc_usdt`; pair-driven URL config |
| `/futures` | Futures terminal | Ticker strips, perpetual header, chart + book + form, positions tabs, AI strategy cards |
| `/buy-usdt` | Quick buy / sell | Widget with fiat & coin selects, payment methods, 3-step guide, FAQ accordion |
| `/login`, `/signup`, `/forgot` | Auth pages | Simulated credentials (shape-validated only) |
| `/placeholder/:slug` | Mock destinations | Keeps every nav/footer link alive (Earn, Rewards, Partners, Fees, …) |
| `/download` | App download mock | QR art + store buttons |
| `*` | 404 | |

## 3. Project structure (`app/`)

```
src/
  components/
    layout/      Header (mega-menu nav, account, language, download), Footer, Toasts, SupportWidget
    modals/      ModalHost, AuthModal, DownloadModal, PromoModal, ConfirmModal
    ui/          Modal, Dropdown, Tooltip, primitives (Tabs, buttons, badges, skeletons, empty states)
    market/      CoinIcon, Sparkline, SentimentGauge, PromoArt
    home/        HeroSection, MarketShowcase, PromoCarousel, MarketTabsTable, HomeSections
    trading/     TickerHeader, PairSidebar, RecentTradesPanel, ChartPanel, TradingChart,
                 OrderBookPanel, OrderFormPanel, OrdersBottomPanel, PairSelectorModal
  data/          constants (nav, pairs, promos, FAQ, footer), mock content
  hooks/         useTopMarkets, useTradingPair (+usePairCandles), useMarketStream
  pages/         HomePage, SpotTradingPage, FuturesPage, BuyCryptoPage, AuthPages, PlaceholderPage, NotFoundPage
  services/      marketDataService (pair store + stream fan-out + provider failover)
                 globalMarketProvider (CoinGecko top-50 + cache + stale handling)
                 exchangeAdapters (Binance & OKX REST + WebSocket)
                 simulatedMarket (deterministic fallback engine)
                 marketDataCache (TTL + localStorage)
                 tradingViewDatafeed (TradingView Charting-Library-shaped datafeed)
  state/         UiContext (modals/toasts), AuthContext (simulated session), OrdersContext (simulated matching)
  types/         marketDataTypes, domain
  utils/         format/cn/seeded-random helpers
scripts/smoke.tsx  jsdom render smoke test (dev aid)
```

## 4. Market data architecture

Two independent sources, one normalized store per scope:

1. **Global rankings (homepage, footer, pair lists)** — CoinGecko `GET /coins/markets?per_page=50&sparkline=true&price_change_percentage=24h,7d`, polled every **60 s** (free-tier friendly), cached in memory + `localStorage`, outage → last snapshot labelled **stale**, cold-start outage → **simulated** dataset.
2. **Exchange-specific pair data (spot & futures terminals)** — Binance public REST/WS (`ticker/24hr`, `klines`, `depth`, `trades`, `@miniTicker/@depth20/@trade`) with OKX (`tickers`, `candles`, `books`, `trades`) as failover. Unknown symbols (400/404) are remembered per pair; rate limits (429) and outages cool the adapter down; when nothing is reachable the simulated engine takes over and the badge says so.

Every surface shows a **data-source badge**: `live · binance`, `stale`, `simulated`, plus a last-updated timestamp. One WebSocket per pair is shared by all panels via `pairMarketStore.retain()` reference counting.

### TradingView integration

`services/tradingViewDatafeed.ts` implements the official **Charting Library `IDatafeedChartApi` contract** (`onReady`, `resolveSymbol`, `getBars`, `subscribeBars`, `unsubscribeBars`) including resolutions `1,5,15,30,60,240,1D,1W`. The bundled renderer is **TradingView Lightweight Charts v4** (the officially supported open-source fallback), because the licensed *Advanced Charts* package requires an authorized download that this project does not have. If access is granted later, pass the same `tradingViewDatafeed` instance to `new TradingView.widget({ datafeed, … })` — no UI changes needed. The library never provides prices itself; candles/stream updates come from the exchange adapters above.

## 5. Simulated trading & accounts

- Sign-in/registration validate email + password shape locally, keep a `sessionStorage` flag, and grant demo balances (USDT/XRP/BTC/ETH/…).
- **Limit** orders reserve funds and fill when the pair price crosses; **market** orders fill immediately with ±0.04 % simulated slippage; **trigger** orders activate at the trigger price. Fills update balances, open orders, 24 h history and assets. Cancels release reservations. Every toast states the action is simulated.
- Logged-out visitors see the reference behaviour: order forms gated behind **Log In / Sign Up**.

## 6. Source-inspection checklist (what the supplied material defined)

| Supplied file | Purpose discovered | Implemented as |
| --- | --- | --- |
| `homepage/index.html` + screenshot | Marketing homepage: dark nav, hero + email capture + stats, sentiment/popular card, announcements, promo cards, market tabs table, sectors/ETF/earn sections, stats band, footer | `/` |
| `spot/index.html` + screenshot | Spot terminal: pair sidebar w/ quote filters, trades tape, ticker strip, chart toolbar + candles + volume, order book w/ depth & B/S ratio, Limit/Market/Trigger forms w/ BBO + % slider + TP/SL, open orders/history/assets | `/trade/:pair` |
| `futures/index.html` + screenshot | Futures terminal shell (content client-rendered): ticker strips, perpetual header, chart, book, cross/leverage form, positions tabs, AI grid cards, popular-events toast | `/futures` |
| `buy-USDT/index.html` | Quick-buy landing: buy/sell widget, payment methods, 3 steps, FAQ | `/buy-usdt` |
| `login/`, `signup/` | Centered auth card: email, password, forgot, social buttons | `/login`, `/signup`, `/forgot` + global auth modal |
| `footer.png` | Footer link taxonomy | `Footer.tsx` columns + crypto-price links |

## 7. Verification performed

- `npm run typecheck` — clean under `strict`.
- `npm run build` — production bundle builds (≈154 kB gzip JS).
- `scripts/smoke.tsx` (jsdom) — renders all nine routes with zero runtime errors (`SMOKE PASS`).
- Data layer unit smoke — candle monotonicity/validity, book sorting, trade ordering, top-50 ranking, datafeed symbol/resolution mapping.
- Dev server serves `/`, `/trade/xrp_usdt`, `/futures` with HTTP 200 and SPA fallback.

## 8. Replacing providers / going to production

- Swap the global provider by editing `globalMarketProvider.ts` (single fetch + normalization point).
- Add an exchange by implementing `ExchangeAdapter` in `exchangeAdapters.ts` and appending it to `exchangeAdapters`.
- Licensed TradingView Advanced Charts: drop the package in, feed it `tradingViewDatafeed`, replace `TradingChart`'s renderer only.
- If a provider ever requires a secret key, proxy it server-side; **never** embed secrets in this frontend.

---

Demo build for interface study and prototyping. Not financial infrastructure, not affiliated with any exchange, and not investment advice.
