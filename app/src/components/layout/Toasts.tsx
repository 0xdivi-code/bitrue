import React from 'react';
import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { useUi } from '../../state/UiContext';
import { cn } from '../../utils/format';

export function Toasts(): React.ReactElement {
  const { toasts, dismissToast } = useUi();
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[300] flex w-[min(420px,92vw)] -translate-x-1/2 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            'pointer-events-auto flex items-start gap-3 rounded-xl border bg-night-800/95 p-3 shadow-pop backdrop-blur',
            t.tone === 'success' ? 'border-up/40' : t.tone === 'error' ? 'border-down/40' : 'border-bd-dark',
          )}
        >
          <span className={cn('mt-0.5', t.tone === 'success' ? 'text-up' : t.tone === 'error' ? 'text-down' : 'text-accent')}>
            {t.tone === 'success' ? <CheckCircle2 size={16} /> : t.tone === 'error' ? <XCircle size={16} /> : <Info size={16} />}
          </span>
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-txt-primary">{t.title}</div>
            {t.body && <div className="mt-0.5 text-[12px] leading-relaxed text-txt-secondary">{t.body}</div>}
          </div>
          <button
            type="button"
            aria-label="Dismiss notification"
            className="text-txt-muted hover:text-txt-primary"
            onClick={() => dismissToast(t.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
