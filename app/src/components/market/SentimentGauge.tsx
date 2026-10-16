import React from 'react';

/**
 * Semi-circular market-sentiment gauge built from SVG arcs
 * (green = fear-side ticks, red marker on the right, needle at the value).
 */
export function SentimentGauge({ value }: { value: number }): React.ReactElement {
  const clamped = Math.max(0, Math.min(100, value));
  const angle = -90 + (clamped / 100) * 180;
  const ticks = Array.from({ length: 21 }, (_, i) => i);

  return (
    <div className="flex flex-col items-center">
      <svg width="150" height="86" viewBox="0 0 150 86" aria-label={`Market sentiment ${clamped}`}>
        {ticks.map((i) => {
          const a = (-90 + (i / 20) * 180) * (Math.PI / 180);
          const inner = 46;
          const outer = 60;
          const x1 = 75 + Math.sin(a) * inner;
          const y1 = 78 - Math.cos(a) * inner;
          const x2 = 75 + Math.sin(a) * outer;
          const y2 = 78 - Math.cos(a) * outer;
          const filled = i / 20 <= clamped / 100;
          const green = i / 20 < 0.62;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={filled ? (green ? '#0ecb81' : '#f6465d') : '#e6e8eb'}
              strokeWidth={5}
              strokeLinecap="round"
            />
          );
        })}
        <g transform={`rotate(${angle} 75 78)`}>
          <line x1="75" y1="78" x2="75" y2="34" stroke="#1e2329" strokeWidth="2.5" strokeLinecap="round" />
        </g>
        <circle cx="75" cy="78" r="4" fill="#1e2329" />
      </svg>
      <div className="-mt-4 text-center">
        <div className="text-[20px] font-bold text-txt-dark num">{clamped}</div>
        <div className="text-[11px] text-txt-darksec">{clamped >= 55 ? 'Greed' : clamped >= 45 ? 'Neutral' : 'Fear'}</div>
      </div>
      <div className="mt-2 flex w-full items-center justify-between text-[10px]">
        <span className="text-up">▲ 45</span>
        <span className="h-1 flex-1 mx-2 rounded bg-gradient-to-r from-up via-accent to-down" />
        <span className="text-down">534 ▼</span>
      </div>
    </div>
  );
}
