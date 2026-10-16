import React, { useMemo } from 'react';

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  positive: boolean;
  strokeWidth?: number;
}

/** Tiny inline SVG area chart used in gainers lists & market tables. */
export function Sparkline({ data, width = 84, height = 28, positive, strokeWidth = 1.4 }: SparklineProps): React.ReactElement {
  const path = useMemo(() => {
    if (data.length < 2) return { line: '', area: '' };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - 2 - ((v - min) / span) * (height - 4);
      return [x, y] as const;
    });
    const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const area = `${line} L${width},${height} L0,${height} Z`;
    return { line, area };
  }, [data, width, height]);

  const color = positive ? '#0ecb81' : '#f6465d';
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={path.area} fill={color} opacity={0.12} />
      <path d={path.line} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </svg>
  );
}
