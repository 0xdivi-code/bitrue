import React from 'react';
import { cn } from '../../utils/format';

/* ---------------- buttons ---------------- */

export function GoldButton({
  children,
  onClick,
  className,
  type = 'button',
  disabled,
  size = 'md',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}): React.ReactElement {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent font-semibold text-[#1e2329] transition-all hover:bg-accent-hover active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' && 'px-3 py-1.5 text-[12px]',
        size === 'md' && 'px-4 py-2 text-[13px]',
        size === 'lg' && 'px-6 py-2.5 text-[14px]',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  className,
  tone = 'dark',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  tone?: 'dark' | 'light';
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg border px-4 py-2 text-[13px] font-medium transition-colors',
        tone === 'dark'
          ? 'border-bd-dark text-txt-primary hover:border-txt-secondary'
          : 'border-bd-light text-txt-dark hover:bg-black/5',
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ---------------- tabs ---------------- */

export interface TabDef<T extends string = string> {
  id: T;
  label: React.ReactNode;
  count?: number;
}

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  tone = 'dark',
  className,
  underline = true,
}: {
  tabs: TabDef<T>[];
  active: T;
  onChange: (id: T) => void;
  tone?: 'dark' | 'light';
  className?: string;
  underline?: boolean;
}): React.ReactElement {
  return (
    <div className={cn('flex items-center gap-1', className)} role="tablist">
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.id)}
            className={cn(
              'relative whitespace-nowrap px-3 py-2 text-[13px] font-medium transition-colors',
              tone === 'dark'
                ? isActive
                  ? 'text-txt-primary'
                  : 'text-txt-secondary hover:text-txt-primary'
                : isActive
                  ? 'text-txt-dark'
                  : 'text-txt-darksec hover:text-txt-dark',
            )}
          >
            {t.label}
            {t.count != null && <span className="ml-1 text-txt-muted">({t.count})</span>}
            {underline && isActive && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- data-state badge ---------------- */

export function DataSourceBadge({
  state,
  label,
  tone = 'dark',
}: {
  state: 'live' | 'cached' | 'stale' | 'simulated' | 'loading' | 'error';
  label: string;
  tone?: 'dark' | 'light';
}): React.ReactElement {
  const color =
    state === 'live'
      ? 'text-up'
      : state === 'simulated'
        ? 'text-purple'
        : state === 'stale'
          ? 'text-accent'
          : state === 'loading'
            ? 'text-txt-secondary'
            : 'text-down';
  return (
    <span
      title={label}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        tone === 'dark' ? 'border-bd-dark bg-night-700' : 'border-bd-light bg-white',
        color,
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          state === 'live' ? 'bg-up pulse-dot' : state === 'simulated' ? 'bg-purple' : state === 'stale' ? 'bg-accent' : 'bg-txt-muted',
        )}
      />
      {label}
    </span>
  );
}

/* ---------------- skeletons ---------------- */

export function SkeletonRow({ cols, tone = 'dark' }: { cols: number; tone?: 'dark' | 'light' }): React.ReactElement {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className={cn('h-3 flex-1', tone === 'dark' ? 'skeleton' : 'skeleton-light')} />
      ))}
    </div>
  );
}

export function Skeleton({ className, tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' }): React.ReactElement {
  return <div className={cn(className, tone === 'dark' ? 'skeleton' : 'skeleton-light')} />;
}

/* ---------------- empty state ---------------- */

export function EmptyState({
  title,
  action,
  tone = 'dark',
  icon,
}: {
  title: React.ReactNode;
  action?: React.ReactNode;
  tone?: 'dark' | 'light';
  icon?: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      {icon}
      <div className={cn('text-[13px]', tone === 'dark' ? 'text-txt-secondary' : 'text-txt-darksec')}>{title}</div>
      {action}
    </div>
  );
}
