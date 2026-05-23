import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../../utils/cn.js';

/**
 * Visual spec: design-system/projects/taxlens/preview/40-modals.html
 * Tokens:     design-system/projects/taxlens/preview/_foundation.css (.modal · :12-23 of 40)
 *
 * Most confirmations are gentle (low-stakes, no-account tool). Portals to
 * document.body, closes on ESC and backdrop click. The irreversible one is
 * <CriticalModal>, which pairs a cold-crimson header with HoldToConfirmButton.
 */
export interface ModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: ReactNode;
  readonly children: ReactNode;
  /** The action row, right-aligned. */
  readonly footer?: ReactNode;
  readonly className?: string;
}

export function Modal({ open, onClose, title, children, footer, className }: ModalProps) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/30 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'w-full max-w-[420px] overflow-hidden rounded-card-lg border border-edge bg-paper-sheet shadow-pop',
          className,
        )}
      >
        <div className="px-[26px] pb-2 pt-6">
          <h3 className="m-0 mb-2 font-serif text-xl font-medium tracking-[-0.012em] text-ink">
            {title}
          </h3>
          <div className="text-[13.5px] leading-[1.6] text-ink-body">{children}</div>
        </div>
        {footer !== undefined ? (
          <div className="flex justify-end gap-2.5 border-t border-edge-hair bg-paper px-[26px] py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export interface CriticalModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: ReactNode;
  /** Short uppercase banner in the crimson header. */
  readonly headerLabel?: string;
  readonly children: ReactNode;
  /** The list of what will be permanently lost. */
  readonly wipeList?: readonly string[];
  /** The action row (keep + the HoldToConfirmButton). */
  readonly footer?: ReactNode;
  readonly className?: string;
}

export function CriticalModal({
  open,
  onClose,
  title,
  headerLabel = 'Can’t be undone',
  children,
  wipeList = [],
  footer,
  className,
}: CriticalModalProps) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/30 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'w-full max-w-[420px] overflow-hidden rounded-card-lg border border-crit-edge bg-paper-sheet shadow-pop',
          className,
        )}
      >
        <div className="flex items-center gap-2.5 border-b border-crit-edge bg-crit-bg px-[26px] py-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-crit" aria-hidden="true">
            <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-[0.08em] text-crit">{headerLabel}</span>
        </div>
        <div className="px-[26px] pb-2 pt-6">
          <h3 className="m-0 mb-2 font-serif text-xl font-medium tracking-[-0.012em] text-ink">
            {title}
          </h3>
          <div className="text-[13.5px] leading-[1.6] text-ink-body">{children}</div>
          {wipeList.length > 0 ? (
            <ul className="m-0 mb-1 mt-3.5 grid list-none gap-2 p-0">
              {wipeList.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-[13px] text-ink-body">
                  <span className="h-[5px] w-[5px] rounded-full bg-crit" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {footer !== undefined ? (
          <div className="flex justify-end gap-2.5 border-t border-edge-hair bg-paper px-[26px] py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
