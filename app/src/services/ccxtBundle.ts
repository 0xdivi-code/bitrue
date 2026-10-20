/**
 * Venue-scoped CCXT bundle: imports only Binance, Bybit and OKX (REST + Pro)
 * instead of the full 100-exchange package, keeping the lazy vendor chunk
 * small. Paths are resolved through Vite aliases (see vite.config.ts) because
 * the ccxt package exports map only exposes the root entry.
 */
import binance from 'ccxt-venue/binance';
import bybit from 'ccxt-venue/bybit';
import okx from 'ccxt-venue/okx';
import proBinance from 'ccxt-venue/pro/binance';
import proBybit from 'ccxt-venue/pro/bybit';
import proOkx from 'ccxt-venue/pro/okx';

export const venues = { binance, bybit, okx };
export const proVenues = { binance: proBinance, bybit: proBybit, okx: proOkx };
