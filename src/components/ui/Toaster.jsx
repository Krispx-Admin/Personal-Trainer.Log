import { useEffect, useState } from 'react';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { subscribeToasts, dismissToast } from '../../lib/toast.js';

const KIND_STYLE = {
  success: { color: '#3ADBC7', Icon: CheckCircle2 },
  info: { color: 'var(--c-brand-lime)', Icon: Info },
  warn: { color: 'var(--c-warning)', Icon: AlertTriangle },
  error: { color: 'var(--c-brand-red)', Icon: AlertTriangle },
};

export default function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => subscribeToasts(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed z-50 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
      style={{ bottom: 'calc(max(20px, env(safe-area-inset-bottom)) + 76px)' }}
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => {
        const { color, Icon } = KIND_STYLE[t.kind] || KIND_STYLE.info;
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-2.5 pl-3.5 pr-2 py-2.5 rounded-full animate-slide-up"
            style={{
              background: 'var(--c-glass-rest)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid var(--c-glass-border)',
              boxShadow: '0 12px 32px -8px rgba(0,0,0,0.35)',
            }}
          >
            <Icon size={15} style={{ color }} className="flex-shrink-0" />
            <span className="text-[13px] font-semibold text-txt-primary">
              {t.message}
            </span>
            <button
              onClick={() => dismissToast(t.id)}
              className="w-6 h-6 inline-flex items-center justify-center rounded-full text-txt-muted hover:text-txt-primary flex-shrink-0"
              aria-label="Dismiss"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
