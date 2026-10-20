/** Application-domain types (orders, accounts, content). */

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'limit' | 'market' | 'trigger';
export type OrderStatus = 'open' | 'filled' | 'canceled' | 'partially-filled' | 'triggered';

export interface Order {
  id: string;
  pair: string;
  storeKey?: string;
  venueLabel?: string;
  side: OrderSide;
  type: OrderType;
  price?: number; // limit price (limit & trigger orders)
  triggerPrice?: number;
  amount: number;
  filledAmount: number;
  filledAvgPrice?: number;
  total?: number;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
  tpSl?: { tp?: number; sl?: number };
  market: 'spot' | 'futures';
  simulated: true;
}

export interface Balance {
  symbol: string;
  available: number;
  locked: number;
}

export interface AccountState {
  loggedIn: boolean;
  email: string | null;
  demoMode: boolean;
  balances: Balance[];
}

/* ---------------------------- site content ---------------------------- */

export interface Announcement {
  id: string;
  tag: string;
  title: string;
  href?: string;
}

export interface PromoCard {
  id: string;
  title: string;
  tag: string;
  art: 'anniversary' | 'usdc' | 'ai' | 'migration' | 'staking' | 'referral';
  accentFrom: string;
  accentTo: string;
}

export interface StrategyCard {
  id: string;
  pair: string;
  label: string;
  tone: 'blue' | 'gold' | 'red';
  apy: string;
  priceRange: string;
  minCapital: string;
  drawdown: string;
}

export interface FaqItem {
  q: string;
  a: string;
}
