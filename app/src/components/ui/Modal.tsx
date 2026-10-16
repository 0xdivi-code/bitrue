import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/format';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  width?: number;
  tone?: 'dark' | 'light';
  labelledBy?: string;
}

/**
 * Accessible modal: Escape to close, backdrop click to close, focus moved
 * inside on open and restored on close.
 */
export function Modal({ open, onClose, title, children, width = 420, tone = 'light', labelledBy }: ModalProps): React.ReactElement | null {
  const ref = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement;
    const node = ref.current;
    const focusable = node?.querySelector<HTMLElement>('input, button, select, textarea, [tabindex]');
    (focusable ?? node)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : labelledBy ?? 'Dialog'}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={ref}
        tabIndex={-1}
        style={{ width, maxWidth: '100%' }}
        className={cn(
          'relative rounded-2xl shadow-pop outline-none animate-[modalIn_.18s_ease-out]',
          tone === 'dark' ? 'bg-night-800 text-txt-primary border border-bd-dark' : 'bg-white text-txt-dark',
        )}
      >
        <style>{`@keyframes modalIn { from { opacity: 0; transform: translateY(8px) scale(.985);} to { opacity:1; transform:none;} }`}</style>
        {title != null && (
          <div className={cn('flex items-center justify-between px-6 pt-5 pb-2', tone === 'dark' ? 'text-txt-primary' : 'text-txt-dark')}>
            <h2 className="text-[17px] font-semibold">{title}</h2>
            <button
              type="button"
              aria-label="Close dialog"
              onClick={onClose}
              className={cn(
                'rounded-md p-1 transition-colors',
                tone === 'dark' ? 'hover:bg-night-600 text-txt-secondary' : 'hover:bg-black/5 text-txt-darksec',
              )}
            >
              <X size={18} />
            </button>
          </div>
        )}
        {title == null && (
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className={cn(
              'absolute right-3 top-3 z-10 rounded-md p-1',
              tone === 'dark' ? 'hover:bg-night-600 text-txt-secondary' : 'hover:bg-black/5 text-txt-darksec',
            )}
          >
            <X size={18} />
          </button>
        )}
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>
  );
}
