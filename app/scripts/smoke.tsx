/**
 * DOM smoke test: renders the real app (providers + routes) in jsdom for each
 * route and reports runtime errors. Development aid — not shipped.
 */
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});

const w = dom.window as unknown as Record<string, unknown>;
const g = globalThis as Record<string, unknown>;
g.window = w;
g.document = w.document;
g.navigator = w.navigator;
g.localStorage = w.localStorage;
g.sessionStorage = w.sessionStorage;
g.HTMLElement = w.HTMLElement;
g.SVGElement = w.SVGElement;
g.Element = w.Element;
g.Node = w.Node;
g.Event = w.Event;
g.MouseEvent = w.MouseEvent;
g.KeyboardEvent = w.KeyboardEvent;
g.getComputedStyle = w.getComputedStyle;
g.location = w.location;
g.history = w.history;
g.screen = w.screen;
g.devicePixelRatio = 1;
g.CSS = w.CSS;
g.requestAnimationFrame = (cb: (t: number) => void) => setTimeout(() => cb(Date.now()), 16);
g.cancelAnimationFrame = (id: number) => clearTimeout(id);

class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
g.ResizeObserver = RO;
w.ResizeObserver = RO;
w.scrollTo = () => {};
g.scrollTo = () => {};

// no-op WebSocket stand-in (network is unavailable in the harness)
class WSStub {
  onopen: (() => void) | null = null;
  onmessage: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  close() {}
  send() {}
  addEventListener() {}
  removeEventListener() {}
}
g.WebSocket = WSStub;
w.WebSocket = WSStub;
if (!w.matchMedia) {
  w.matchMedia = () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  });
}

// canvas 2d stub so chart libraries can initialize headlessly
const ctxStub = () =>
  new Proxy(
    { canvas: { width: 800, height: 400 } } as Record<string, unknown>,
    {
      get(t, prop: string) {
        if (prop === 'measureText') return () => ({ width: 10 });
        if (prop === 'createLinearGradient') return () => ({ addColorStop() {} });
        if (prop in t) return t[prop];
        return () => undefined;
      },
      set() {
        return true;
      },
    },
  );
(w.HTMLCanvasElement as unknown as { prototype: Record<string, unknown> }).prototype.getContext = function () {
  return ctxStub();
};

const errors: string[] = [];
const origError = console.error;
console.error = (...args: unknown[]) => {
  const msg = args.map(String).join(' ').slice(0, 260);
  if (msg.includes('not wrapped in act') || msg.includes('Not implemented')) return;
  errors.push(msg);
  origError(...args);
};

const ROUTES = [
  '/',
  '/trade/xrp_usdt',
  '/trade/btc_usdt',
  '/futures',
  '/futures/eth_usdt',
  '/trade/xrp_usdt?ex=okx&m=swap',
  '/buy-usdt',
  '/login',
  '/signup',
  '/placeholder/staking',
  '/nope',
];

async function main() {
  const React = (await import('react')).default;
  const { createRoot } = await import('react-dom/client');
  const { MemoryRouter } = await import('react-router-dom');
  const App = (await import('../src/App')).default;

  let failures = 0;
  for (const path of ROUTES) {
    errors.length = 0;
    const host = w.document.createElement('div');
    w.document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(App)));
    await new Promise((r) => setTimeout(r, 1200));
    const text = host.textContent ?? '';
    const ok = text.length > 200 && errors.length === 0;
    if (!ok) failures++;
    console.log(`ROUTE ${path.padEnd(22)} chars=${String(text.length).padStart(5)} errors=${errors.length} ${ok ? 'OK' : 'FAIL'}`);
    errors.slice(0, 4).forEach((e) => console.log('    !', e));
    root.unmount();
    host.remove();
    await new Promise((r) => setTimeout(r, 100));
  }
  console.log(failures === 0 ? 'SMOKE PASS' : `SMOKE FAIL (${failures})`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
