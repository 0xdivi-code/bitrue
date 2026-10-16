import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { cn } from '../../utils/format';

export interface TooltipProps {
  content: React.ReactNode;
  children?: React.ReactNode;
  width?: number;
  side?: 'top' | 'bottom';
  icon?: boolean;
}

/** Lightweight hover/focus tooltip used for BBO / TP-SL / trigger help text. */
export function Tooltip({ content, children, width = 280, side = 'bottom', icon = true }: TooltipProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {icon && (
        <span role="button" tabIndex={0} aria-label="More information" className="ml-1 cursor-help text-txt-muted hover:text-txt-secondary">
          <Info size={13} />
        </span>
      )}
      {open && (
        <span
          style={{ width }}
          className={cn(
            'absolute left-1/2 z-[150] -translate-x-1/2 rounded-lg border border-bd-dark bg-night-700 p-3 text-left text-[12px] leading-relaxed text-txt-secondary shadow-pop',
            side === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2',
          )}
          role="tooltip"
        >
          {content}
        </span>
      )}
    </span>
  );
}
