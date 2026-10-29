import React, { useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, Info, LoaderCircle, RotateCcw, X } from 'lucide-react';

export type Feature = 'notes' | 'generator' | 'mock' | 'library' | 'meetings' | 'connect' | 'groups' | 'brand';

export function Card({
  children,
  feature = 'brand',
  className = '',
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { feature?: Feature }) {
  return (
    <div className={`ui-card feature-${feature} ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  feature = 'brand',
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'brand' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  feature?: Feature;
}) {
  return (
    <button
      className={`ui-button ui-button-${variant} ui-button-${size} feature-${feature} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  feature = 'brand',
  className = ''
}: {
  children: React.ReactNode;
  feature?: Feature;
  className?: string;
}) {
  return (
    <span className={`ui-badge feature-${feature} ${className}`}>
      {children}
    </span>
  );
}

export function IconTile({
  children,
  feature = 'brand',
  className = ''
}: {
  children: React.ReactNode;
  feature?: Feature;
  className?: string;
}) {
  return (
    <span className={`ui-icon-tile feature-${feature} ${className}`}>
      {children}
    </span>
  );
}

export function Field({
  label,
  children,
  className = ''
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`ui-field ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function SegmentedControl<T extends string>({
  values,
  value,
  onChange,
  feature = 'brand'
}: {
  values: T[];
  value: T;
  onChange: (value: T) => void;
  feature?: Feature;
}) {
  return (
    <div className={`ui-segmented feature-${feature}`} role="group">
      {values.map((v) => (
        <button
          type="button"
          aria-pressed={value === v}
          key={v}
          className={value === v ? 'selected' : ''}
          onClick={() => onChange(v)}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

export function Skeleton({ lines = 4, className = '' }: { lines?: number; className?: string }) {
  if (className) {
    return <div className={`shimmer ${className}`} />;
  }
  return (
    <div role="status" aria-label="Loading content" className="ui-skeleton space-y-3.5 py-2">
      {Array.from({length: lines}, (_, i) => (
        <div
          key={i}
          style={{ width: `${i === 0 ? '45' : i === lines - 1 ? '60' : i % 2 === 0 ? '90' : '100'}%` }}
          className="h-4 rounded-full shimmer"
        />
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  feature = 'brand'
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  feature?: Feature;
}) {
  return (
    <div className={`ui-empty feature-${feature}`}>
      <IconTile feature={feature}>{icon}</IconTile>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  feature = 'brand'
}: {
  message: string;
  onRetry?: () => void;
  feature?: Feature;
}) {
  return (
    <div className={`ui-empty feature-${feature} py-8`}>
      <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 grid place-items-center mb-1">
        <AlertCircle size={22} />
      </div>
      <h3 className="text-base font-bold text-slate-900">Something went wrong</h3>
      <p className="text-sm text-slate-500 max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-2">
          <RotateCcw size={15} /> Try again
        </Button>
      )}
    </div>
  );
}

export function Dialog({
  open,
  onClose,
  title,
  children
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const root = close.current?.closest('[role=dialog]');
        const els = Array.from(
          root?.querySelectorAll<HTMLElement>(
            'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
          ) || []
        ).filter((e) => !e.hasAttribute('disabled'));
        if (!els.length) return;
        const first = els[0], last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', key);
    close.current?.focus();
    return () => {
      document.removeEventListener('keydown', key);
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="ui-dialog-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section role="dialog" aria-modal="true" aria-label={title} className="ui-dialog">
        <header>
          <h2>{title}</h2>
          <button
            ref={close}
            aria-label="Close dialog"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 grid place-items-center transition-colors border-0"
          >
            <X size={18} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

export function Toast({
  message,
  kind = 'info',
  onClose
}: {
  message: string;
  kind?: 'info' | 'success' | 'error';
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [message, onClose]);

  const Icon = kind === 'success' ? CheckCircle2 : kind === 'error' ? AlertCircle : Info;
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-slate-200 shadow-xl text-sm ${
        kind === 'error' ? 'border-rose-200 text-rose-700' : 'text-slate-800'
      }`}
    >
      <Icon size={18} className={kind === 'error' ? 'text-rose-500' : 'text-emerald-500'} />
      <span>{message}</span>
      <button onClick={onClose} aria-label="Dismiss" className="ml-2 text-slate-400 hover:text-slate-600">
        <X size={15} />
      </button>
    </div>
  );
}

export function LoadingStages({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div className="grid grid-cols-4 gap-2 text-center" role="status">
      {labels.map((s, i) => (
        <div
          key={s}
          className={`flex flex-col items-center gap-1.5 text-xs font-semibold ${
            step === i ? 'text-[#5B5BF0]' : step > i ? 'text-emerald-600' : 'text-slate-400'
          }`}
        >
          <span
            className={`w-7 h-7 rounded-full grid place-items-center text-xs transition-colors ${
              step > i
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : step === i
                ? 'bg-[#EEF0FF] text-[#5B5BF0] border border-[#DDE1FC]'
                : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}
          >
            {step > i ? (
              <CheckCircle2 size={14} />
            ) : step === i ? (
              <LoaderCircle size={14} className="animate-spin" />
            ) : (
              i + 1
            )}
          </span>
          <p className="truncate max-w-[80px] text-[11px]">{s}</p>
        </div>
      ))}
    </div>
  );
}
