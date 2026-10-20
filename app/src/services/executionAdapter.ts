/**
 * Authenticated execution layer — ARCHITECTURE ONLY.
 *
 * Public market data (this app's CCXT adapters) is deliberately kept separate
 * from order routing. Real execution requires:
 *   1. a backend proxy that stores exchange API keys server-side (never in
 *      browser code, env vars shipped to clients, or localStorage),
 *   2. exchange testnet/demo credentials (Binance testnet, Bybit testnet,
 *      OKX demo trading) for safe end-to-end testing,
 *   3. exchange-confirmed fills — an order is only reported filled when the
 *      venue acknowledges it (watchOrders / fetchOrder), never before.
 *
 * This frontend ships a simulated execution engine (OrdersContext) that is
 * always labelled "simulated". The interface below defines the contract a
 * future backend-backed adapter must satisfy; the stub fails loudly instead
 * of pretending to trade.
 */
import type { OrderSide, OrderType } from '../types/domain';
import type { ExchangeId } from '../types/marketDataTypes';

export interface ExecutionOrderRequest {
  exchange: ExchangeId;
  symbol: string; // venue symbol, e.g. "XRP/USDT" or "XRP/USDT:USDT"
  side: OrderSide;
  type: OrderType;
  amount: number;
  price?: number;
  triggerPrice?: number;
  reduceOnly?: boolean;
  clientOrderId?: string;
}

export interface ExecutionOrderState {
  venueOrderId: string;
  status: 'open' | 'partially-filled' | 'filled' | 'canceled' | 'rejected';
  filledAmount: number;
  averagePrice?: number;
  fee?: number;
  raw: unknown; // untouched venue response
}

export interface ExecutionAdapter {
  readonly exchange: ExchangeId;
  /** Testnet/demo only in this project. */
  readonly sandbox: boolean;
  placeOrder(req: ExecutionOrderRequest): Promise<ExecutionOrderState>;
  cancelOrder(venueOrderId: string, symbol: string): Promise<ExecutionOrderState>;
  fetchOpenOrders(symbol?: string): Promise<ExecutionOrderState[]>;
  fetchBalances(): Promise<Array<{ asset: string; free: number; used: number }>>;
  /** Position sync for perpetuals. */
  fetchPositions(symbol?: string): Promise<Array<{ symbol: string; side: 'long' | 'short'; size: number; entryPrice?: number; markPrice?: number; leverage?: number }>>;
}

export class ExecutionUnavailableError extends Error {
  constructor(exchange: ExchangeId) {
    super(
      `Live order routing for ${exchange} is not enabled in this frontend-only build. ` +
        'Deploy the backend proxy with server-side API keys (testnet first) and implement this adapter via CCXT unified trading calls.',
    );
    this.name = 'ExecutionUnavailableError';
  }
}

/** Stub that never fakes an execution — every call rejects with guidance. */
export class UnwiredExecutionAdapter implements ExecutionAdapter {
  readonly sandbox = true;
  constructor(readonly exchange: ExchangeId) {}
  placeOrder(): Promise<ExecutionOrderState> {
    return Promise.reject(new ExecutionUnavailableError(this.exchange));
  }
  cancelOrder(): Promise<ExecutionOrderState> {
    return Promise.reject(new ExecutionUnavailableError(this.exchange));
  }
  fetchOpenOrders(): Promise<ExecutionOrderState[]> {
    return Promise.reject(new ExecutionUnavailableError(this.exchange));
  }
  fetchBalances(): Promise<Array<{ asset: string; free: number; used: number }>> {
    return Promise.reject(new ExecutionUnavailableError(this.exchange));
  }
  fetchPositions(): Promise<Array<{ symbol: string; side: 'long' | 'short'; size: number }>> {
    return Promise.reject(new ExecutionUnavailableError(this.exchange));
  }
}

export const executionAdapters: Record<ExchangeId, ExecutionAdapter> = {
  binance: new UnwiredExecutionAdapter('binance'),
  bybit: new UnwiredExecutionAdapter('bybit'),
  okx: new UnwiredExecutionAdapter('okx'),
};
