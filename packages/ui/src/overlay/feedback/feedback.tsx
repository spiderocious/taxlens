import { type ReactNode } from 'react';

import { cn } from '../../utils/cn.js';

/**
 * Visual spec: design-system/projects/taxlens/preview/41-feedback.html
 * Tokens:     design-system/projects/taxlens/preview/_foundation.css (.toast / .banner / .callout · :13-27 of 41)
 *
 * Calm and factual. Toasts slip in and leave; banners carry standing notes; the
 * statute callout teaches. No alarm bells, no fake urgency.
 */
/**
 * `save` is kept as an alias of `success` for back-compat. Toasts stay calm: a
 * dark ink pill with a tinted leading accent + dot, not a screaming coloured
 * panel — error gets the cold crimson edge (honours "red is reserved").
 */
export type ToastTone = 'default' | 'save' | 'success' | 'info' | 'warning' | 'error';

const TOAST_ACCENT: Record<ToastTone, string> = {
  default: 'bg-ink-faint',
  save: 'bg-save',
  success: 'bg-save',
  info: 'bg-info-edge',
  warning: 'bg-warn-edge',
  error: 'bg-crit',
};

export interface ToastProps {
  readonly children: ReactNode;
  readonly tone?: ToastTone;
  readonly icon?: ReactNode;
  /** Right-aligned dismiss handler (shows an ✕). */
  readonly onDismiss?: () => void;
  /** Right-aligned undo handler (shows "Undo"). */
  readonly onUndo?: () => void;
  readonly className?: string;
}

export function Toast({ children, tone = 'default', icon, onDismiss, onUndo, className }: ToastProps) {
  return (
    <div
      role="status"
      className={cn(
        'relative flex max-w-[420px] items-center gap-3 overflow-hidden rounded-ctrl px-4 py-[13px] text-[13.5px] text-white shadow-pop',
        tone === 'save' || tone === 'success' ? 'bg-[#1F3A22]' : 'bg-ink',
        className,
      )}
    >
      <span className={cn('absolute inset-y-0 left-0 w-1', TOAST_ACCENT[tone])} aria-hidden="true" />
      {icon !== undefined ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : (
        <span className={cn('h-2 w-2 flex-shrink-0 rounded-full', TOAST_ACCENT[tone])} aria-hidden="true" />
      )}
      <span>{children}</span>
      {onUndo !== undefined ? (
        <button type="button" onClick={onUndo} className="ml-auto font-semibold text-clay-300">
          Undo
        </button>
      ) : null}
      {onDismiss !== undefined ? (
        <button type="button" onClick={onDismiss} className="ml-auto opacity-60 hover:opacity-100" aria-label="Dismiss">
          ✕
        </button>
      ) : null}
    </div>
  );
}

export type BannerTone = 'info' | 'warn';

export interface BannerProps {
  readonly children: ReactNode;
  readonly tone?: BannerTone;
  readonly icon?: ReactNode;
  readonly className?: string;
}

export function Banner({ children, tone = 'info', icon, className }: BannerProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-ctrl border px-[18px] py-3.5 text-[13.5px] leading-[1.55]',
        tone === 'info' ? 'border-info-edge bg-info-bg text-info' : 'border-warn-edge bg-warn-bg text-warn',
        className,
      )}
    >
      {icon !== undefined ? <span className="mt-px flex-shrink-0">{icon}</span> : null}
      <span>{children}</span>
    </div>
  );
}

export interface CalloutProps {
  /** Small heading, e.g. "Good to know". */
  readonly heading?: string;
  readonly children: ReactNode;
  readonly className?: string;
}

export function Callout({ heading = 'Good to know', children, className }: CalloutProps) {
  return (
    <div
      className={cn('rounded-r-ctrl border-l-[3px] border-clay-500 bg-clay-50 px-[18px] py-3.5', className)}
    >
      <div className="mb-1 text-[13px] font-semibold text-clay-800">{heading}</div>
      <p className="m-0 text-[13px] text-ink-body">{children}</p>
    </div>
  );
}
