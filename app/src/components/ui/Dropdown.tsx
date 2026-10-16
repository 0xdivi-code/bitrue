import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/format';

export interface DropdownProps {
  trigger: (open: boolean) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: 'left' | 'right';
  width?: number;
  className?: string;
  panelClassName?: string;
  /** hover-intent menus for the top navigation */
  hover?: boolean;
}

/** Click (or hover) driven dropdown with outside-click + Escape dismissal. */
export function Dropdown({
  trigger,
  children,
  align = 'left',
  width = 220,
  className,
  panelClassName,
  hover = false,
}: DropdownProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const enter = () => {
    if (!hover) return;
    window.clearTimeout(hoverTimer.current);
    setOpen(true);
  };
  const leave = () => {
    if (!hover) return;
    hoverTimer.current = window.setTimeout(() => setOpen(false), 160);
  };

  return (
    <div
      ref={ref}
      className={cn('relative', className)}
      onMouseEnter={enter}
      onMouseLeave={leave}
    >
      <div
        onClick={() => (hover ? undefined : setOpen((o) => !o))}
        aria-haspopup="menu"
        aria-expanded={open}
        className="cursor-pointer"
      >
        {trigger(open)}
      </div>
      {open && (
        <div
          role="menu"
          style={{ width }}
          className={cn(
            'absolute z-[120] mt-1 overflow-hidden rounded-xl border shadow-pop',
            align === 'right' ? 'right-0' : 'left-0',
            panelClassName ?? 'border-bd-dark bg-night-800 text-txt-primary',
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  children,
  onClick,
  active,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}): React.ReactElement {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] transition-colors hover:bg-white/5',
        active && 'text-accent',
        className,
      )}
    >
      {children}
    </button>
  );
}
