import React from 'react';
import { Apple, Play } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useUi } from '../../state/UiContext';

/** Generated QR placeholder (original SVG pattern, not a scannable code). */
function QrArt({ size = 148 }: { size?: number }): React.ReactElement {
  const cells: React.ReactElement[] = [];
  const n = 21;
  let seed = 7;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const finder =
        (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
      let on = false;
      if (finder) {
        const lx = x < 7 ? x : x - (n - 7);
        const ly = y < 7 ? y : y - (n - 7);
        const ring = lx === 0 || ly === 0 || lx === 6 || ly === 6;
        const core = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4;
        on = ring || core;
      } else {
        on = rnd() > 0.52;
      }
      if (on) cells.push(<rect key={`${x}-${y}`} x={x * 6 + 4} y={y * 6 + 4} width={6} height={6} fill="#1e2329" />);
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${n * 6 + 8} ${n * 6 + 8}`} aria-label="Demo QR code">
      <rect width="100%" height="100%" fill="#fff" />
      {cells}
    </svg>
  );
}

export function DownloadModal({ open, onClose }: { open: boolean; onClose: () => void }): React.ReactElement {
  const { pushToast } = useUi();
  const fake = (store: string) =>
    pushToast({
      tone: 'info',
      title: `${store} download simulated`,
      body: 'This demo has no distributable app package; the store link is illustrative only.',
    });

  return (
    <Modal open={open} onClose={onClose} title="Download Orbitex App" width={380}>
      <div className="flex flex-col items-center pt-2">
        <div className="rounded-xl border border-bd-light p-3">
          <QrArt />
        </div>
        <p className="mt-3 text-center text-[12px] text-txt-darksec">
          Scan to install the demo app. The pattern above is decorative and not a scannable code.
        </p>
        <div className="mt-4 grid w-full grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fake('App Store')}
            className="flex items-center justify-center gap-2 rounded-lg bg-txt-dark py-2.5 text-[13px] font-semibold text-white hover:opacity-90"
          >
            <Apple size={16} /> iOS
          </button>
          <button
            type="button"
            onClick={() => fake('Google Play')}
            className="flex items-center justify-center gap-2 rounded-lg bg-txt-dark py-2.5 text-[13px] font-semibold text-white hover:opacity-90"
          >
            <Play size={16} /> Android
          </button>
        </div>
      </div>
    </Modal>
  );
}
