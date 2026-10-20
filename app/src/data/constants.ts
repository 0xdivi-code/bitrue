import type { TradingPairMeta } from '../types/marketDataTypes';
import type { Announcement, FaqItem, PromoCard, StrategyCard } from '../types/domain';

export const BRAND = {
  name: 'Bityaris',
  tagline: 'Built for what traders need next',
  logoUrl: 'https://i.postimg.cc/6QzR8npH/log0.png',
  demoNotice: 'Demo environment — all accounts, balances and orders are simulated.',
};

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh-hant', label: '繁體中文' },
  { code: 'es', label: 'Español' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'ar', label: 'العربية' },
  { code: 'pl', label: 'Polski' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'fr', label: 'Français' },
  { code: 'th', label: 'ไทย' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'sv', label: 'Svenska' },
];

/* ------------------------------- navigation ------------------------------- */

export interface NavChild {
  label: string;
  desc?: string;
  to: string;
  badge?: string;
}
export interface NavItem {
  label: string;
  to?: string;
  badge?: string;
  /** visibility / responsive helpers applied to the nav entry */
  className?: string;
  children?: NavChild[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Buy/Sell', to: '/buy-usdt' },
  {
    label: 'Trade',
    children: [
      { label: 'Spot', desc: 'Buy & sell digital currencies on 1,000+ pairs', to: '/trade/xrp_usdt' },
      { label: 'ETF', desc: 'Crypto trading at leveraged multiples', to: '/placeholder/leveraged-etf' },
      { label: 'Alpha', desc: 'Quick access to Web3 via Alpha trading', to: '/placeholder/alpha' },
    ],
  },
  {
    label: 'Futures',
    children: [
      { label: 'USDT Futures', desc: 'Futures using USDT as the collateral', to: '/futures' },
      { label: 'COIN-M Futures', desc: 'Cryptocurrency-margined futures', to: '/placeholder/coin-m-futures' },
      { label: 'TradFi', desc: 'Derivatives for stocks, forex, metals & commodities', to: '/placeholder/tradfi-futures' },
      { label: 'USDC Futures', desc: 'Futures using USDC as the collateral', to: '/placeholder/usdc-futures' },
      { label: 'Copy Trading', desc: 'Join forces with top traders', to: '/placeholder/copy-trading' },
    ],
  },
  {
    label: 'Earn',
    children: [
      { label: 'Power Piggy', desc: 'Earn competitive rewards daily', to: '/placeholder/power-piggy' },
      { label: 'Staking', desc: 'High returns & instant access', to: '/placeholder/staking' },
      { label: 'Launchpool', desc: 'Flexible staking to earn popular tokens', to: '/placeholder/launchpool' },
      { label: 'Lockups', desc: 'Exclusive investments for token holders', to: '/placeholder/lockups' },
      { label: 'Loans', desc: 'Crypto-backed borrowing service', to: '/placeholder/loans' },
      { label: 'Auto Invest', desc: 'Grab long-term profit and flexible interest', to: '/placeholder/auto-invest' },
    ],
  },
  { label: 'AI Bot', to: '/placeholder/ai-bot', badge: 'New' },
  {
    label: 'Partners',
    children: [
      { label: 'Affiliates', desc: 'Up to 65% commissions', to: '/placeholder/affiliates' },
      { label: 'Referral', desc: 'Invite a friend to receive cash rewards', to: '/placeholder/referral' },
    ],
  },
  {
    label: 'Trade with AI · 750 USDT Rewards',
    children: [
      { label: 'AI Strategy Hub', desc: 'Grid & DCA bots with backtested ranges', to: '/placeholder/ai-strategy' },
      { label: 'Rewards Center', desc: 'Check-in, tasks & prize pools', to: '/placeholder/rewards-center' },
    ],
  },
  { label: 'Rewards Center', to: '/placeholder/rewards-center' },
  { label: '8th Anniversary', to: '/placeholder/anniversary', badge: '🎉' },
];

/* --------------------------------- markets -------------------------------- */

export const QUOTE_FILTERS: TradingPairMeta['category'][] = ['USDT', 'XRP', 'TRADFI', 'ETF', 'RLUSD', 'USD'];

const PRECISION: Record<string, [number, number]> = {
  BTC: [2, 5],
  ETH: [2, 4],
  XRP: [4, 1],
  SOL: [3, 3],
  BNB: [2, 3],
  DOGE: [5, 0],
  SHIB: [8, 0],
  PEPE: [8, 0],
};

function meta(base: string, category: TradingPairMeta['category'], quote: string): TradingPairMeta {
  const [pp, ap] = PRECISION[base] ?? [4, 2];
  return {
    pair: `${base.toLowerCase()}_${quote.toLowerCase()}`,
    base,
    quote,
    category,
    pricePrecision: pp,
    amountPrecision: ap,
    listed: true,
  };
}

export const TRADING_PAIRS: TradingPairMeta[] = [
  ...['XRP', 'BTC', 'ETH', 'SOL', 'BNB', 'DOGE', 'ADA', 'TRX', 'LINK', 'AVAX', 'DOT', 'LTC', 'SHIB', 'TON', 'SUI', 'UNI', 'PEPE', 'ATOM', 'NEAR', 'APT', 'ARB', 'OP', 'INJ', 'TIA', 'SEI', 'WLD', 'FIL', 'ICP', 'HBAR', 'ALGO', 'VET', 'XLM', 'SAND', 'MANA', 'AAVE', 'CRV', 'LDO', 'GRT', 'RNDR', 'IMX', 'GALA', 'FTM', 'ETC', 'BCH', 'XMR', 'KAS', 'RUNE', 'STX', 'EGLD'].map((b) =>
    meta(b, 'USDT', 'USDT'),
  ),
  meta('STONK', 'TRADFI', 'USDT'),
  meta('XAU', 'TRADFI', 'USDT'),
  meta('XAG', 'TRADFI', 'USDT'),
  meta('XAU', 'TRADFI', 'XRP'),
  meta('FLR', 'XRP', 'XRP'),
  meta('SGB', 'XRP', 'USDT'),
  meta('ALGO', 'XRP', 'XRP'),
  meta('RLUSD', 'RLUSD', 'USDT'),
  meta('SUI3L', 'ETF', 'USDT'),
  meta('XAU3L', 'ETF', 'USDT'),
  meta('ZEC3L', 'ETF', 'USDT'),
  meta('WLD3L', 'ETF', 'USDT'),
  meta('HYPE3L', 'ETF', 'USDT'),
  meta('BERA3S', 'ETF', 'USDT'),
  meta('BTC', 'USD', 'USD'),
  meta('ETH', 'USD', 'USD'),
];

export const DEFAULT_PAIR = 'xrp_usdt';

/* --------------------------------- content -------------------------------- */

export const ANNOUNCEMENTS: Announcement[] = [
  { id: 'a1', tag: 'New', title: 'New USDT futures pair: CLAUDIA/USDT perpetual now live' },
  { id: 'a2', tag: 'Event', title: 'Trade smarter with AI — get up to 750 USDT in strategy rewards' },
  { id: 'a3', tag: 'Event', title: 'Migration offer: move your portfolio and share 500K USDT in rewards' },
  { id: 'a4', tag: 'Event', title: '8th anniversary: daily airdrops, reward boosts & prize draws' },
  { id: 'a5', tag: 'Listing', title: 'Discover new assets with 0 trading fees for a limited time' },
  { id: 'a6', tag: 'Event', title: 'Refer friends and earn up to 250 USDT plus a 25% fee rebate' },
  { id: 'a7', tag: 'Earn', title: 'Put your USDT/USDC to work — flexible products from 10% APR' },
];

export const PROMO_CARDS: PromoCard[] = [
  {
    id: 'p1',
    title: '8th Anniversary | Daily airdrops, 88,888 in rewards & a luxury cruise draw',
    tag: 'Hot event',
    art: 'anniversary',
    accentFrom: '#ffd76a',
    accentTo: '#ff7a59',
  },
  {
    id: 'p2',
    title: 'HOLD & EARN a share of 18,500 USDC — deposit via the XDC network',
    tag: 'Hot event',
    art: 'usdc',
    accentFrom: '#7ab8ff',
    accentTo: '#274bdb',
  },
  {
    id: 'p3',
    title: 'Trade smarter with AI — unlock up to 750 USDT in strategy rewards',
    tag: 'Hot event',
    art: 'ai',
    accentFrom: '#b78bff',
    accentTo: '#6a2bd9',
  },
  {
    id: 'p4',
    title: 'Flexible staking from 10% APR — new-user exclusive, no lock-up',
    tag: 'Hot event',
    art: 'staking',
    accentFrom: '#7ef0c0',
    accentTo: '#0e9f6e',
  },
];

export const STRATEGY_CARDS: StrategyCard[] = [
  {
    id: 's1',
    pair: 'BTC/USDT',
    label: 'Stable Grid 7x',
    tone: 'blue',
    apy: '207.72%',
    priceRange: '72,590.0 – 91,826.8',
    minCapital: '468',
    drawdown: '45.89%',
  },
  {
    id: 's2',
    pair: 'BTC/USDT',
    label: 'Growth Grid 3x',
    tone: 'gold',
    apy: '111.72%',
    priceRange: '71,932.3 – 92,484.5',
    minCapital: '680',
    drawdown: '26.54%',
  },
  {
    id: 's3',
    pair: 'BTC/USDT',
    label: 'Aggressive Grid 15x',
    tone: 'red',
    apy: '61.68%',
    priceRange: '76,864.9 – 87,551.9',
    minCapital: '384',
    drawdown: '79.08%',
  },
];

export const BUY_FAQ: FaqItem[] = [
  {
    q: 'Where can I buy cryptocurrency?',
    a: 'You can purchase cryptocurrency directly on this demo platform. The quick-buy widget simulates offers from multiple payment providers across nearly 100 fiat currencies.',
  },
  {
    q: 'How do I buy cryptocurrency?',
    a: 'Select the asset you want, review the simulated offer including fees, then confirm. In this demo no payment is processed and no funds move.',
  },
  {
    q: 'What fees do I need to pay?',
    a: 'In a production environment fees depend on the payment provider and on-chain transfer costs. Here every quote is simulated and clearly labelled.',
  },
  {
    q: 'How long does it take to receive cryptocurrency?',
    a: 'Real purchases typically settle in 2–10 minutes. In this demo, simulated purchases credit your demo balance instantly.',
  },
  {
    q: 'How can I resolve issues encountered during a purchase?',
    a: 'Open the support panel (bottom-right) for simulated assistance, or review the order details screen for the status of a simulated purchase.',
  },
];

export const PAYMENT_METHODS = ['Visa', 'Mastercard', 'Apple Pay', 'Google Pay', 'SEPA', 'PIX', 'Faster Payments', 'P2P'];

export const FOOTER_COLUMNS: Array<{ title: string; links: Array<{ label: string; to: string }> }> = [
  {
    title: 'About',
    links: [
      { label: 'About Us', to: '/placeholder/about-us' },
      { label: 'Announcements', to: '/placeholder/announcements' },
      { label: 'Blog', to: '/placeholder/blog' },
      { label: 'Terms', to: '/placeholder/terms' },
      { label: 'Privacy', to: '/placeholder/privacy' },
      { label: 'Verification', to: '/placeholder/verify' },
    ],
  },
  {
    title: 'Products',
    links: [
      { label: 'Buy/Sell', to: '/buy-usdt' },
      { label: 'Deposit', to: '/placeholder/deposit' },
      { label: 'Spot', to: '/trade/xrp_usdt' },
      { label: 'USDT Futures', to: '/futures' },
      { label: 'Copy Trading', to: '/placeholder/copy-trading' },
      { label: 'COIN-M Futures', to: '/placeholder/coin-m-futures' },
      { label: 'USDC Futures', to: '/placeholder/usdc-futures' },
      { label: 'Loans', to: '/placeholder/loans' },
    ],
  },
  {
    title: 'Service',
    links: [
      { label: 'iOS Download', to: '/download' },
      { label: 'Android Download', to: '/download' },
      { label: 'Partners', to: '/placeholder/affiliates' },
      { label: 'VIP Program', to: '/placeholder/vip' },
      { label: 'Sitemap', to: '/placeholder/sitemap' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', to: '/placeholder/help-center' },
      { label: 'API Guide', to: '/placeholder/api-guide' },
      { label: 'Fees', to: '/placeholder/fees' },
      { label: 'Trading Rules', to: '/placeholder/trading-rules' },
      { label: 'Converter', to: '/placeholder/converter' },
    ],
  },
  {
    title: 'Contact',
    links: [
      { label: 'Listing Application', to: '/placeholder/listing' },
      { label: 'Submit a Request', to: '/placeholder/request' },
      { label: 'Locate a Lost Deposit', to: '/placeholder/lost-deposit' },
      { label: 'support@bityaris.demo', to: '/placeholder/support-email' },
      { label: 'pr@bityaris.demo', to: '/placeholder/pr-email' },
    ],
  },
];
