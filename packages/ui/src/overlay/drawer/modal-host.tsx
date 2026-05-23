import { useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../../utils/cn.js';
import { AppButton } from '../../primitives/app-button/index.js';
import { HoldToConfirmButton } from '../../primitives/hold-to-confirm-button/index.js';
import { drawerStore, type ModalItem, type ModalSize } from './drawer-store.js';
import { ToastHost } from './toast-host.js';

/**
 * Mount once at the app root (inside <DrawerHost />). Renders the modal stack;
 * the last-opened modal sits on top with a darker backdrop. Each modal honours
 * canClose / clickOutsideClose / confirm+cancel buttons / destructive / critical
 * from its descriptor (see ModalItem).
 */

const SIZE: Record<ModalSize, string> = {
  sm: 'max-w-[360px]',
  md: 'max-w-[460px]',
  lg: 'max-w-[640px]',
};

function ServiceModal({ modal, top }: { readonly modal: ModalItem; readonly top: boolean }) {
  const {
    id,
    title,
    subtitle,
    body,
    size = 'md',
    canClose = true,
    clickOutsideClose = true,
    onConfirm,
    onCancel,
    confirmLabel,
    cancelLabel,
    showConfirmButton,
    showCancelButton,
    destructive = false,
    critical = false,
    criticalHeaderLabel = 'Can’t be undone',
  } = modal;

  const close = (): void => drawerStore.closeModal(id);

  useEffect(() => {
    if (!top || !canClose) return undefined;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') drawerStore.closeModal(id);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [top, canClose, id]);

  const handleCancel = (): void => {
    onCancel?.();
    close();
  };

  const handleConfirm = (): void => {
    void Promise.resolve(onConfirm?.()).then(() => close());
  };

  // Confirm button shows when explicitly requested OR an onConfirm is supplied.
  const wantConfirm = showConfirmButton ?? onConfirm !== undefined;
  const wantCancel = showCancelButton ?? true;

  return (
    <div
      className={cn('fixed inset-0 z-50 grid place-items-center p-4', top ? 'bg-ink/30' : 'bg-transparent')}
      onClick={clickOutsideClose && canClose ? close : undefined}
      role="presentation"
    >
      <div
        role={critical ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'w-full overflow-hidden rounded-card-lg border bg-paper-sheet shadow-pop',
          critical ? 'border-crit-edge' : 'border-edge',
          SIZE[size],
        )}
      >
        {critical ? (
          <div className="flex items-center gap-2.5 border-b border-crit-edge bg-crit-bg px-[26px] py-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-crit" aria-hidden="true">
              <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-crit">
              {criticalHeaderLabel}
            </span>
          </div>
        ) : null}

        <div className="px-[26px] pb-2 pt-6">
          {title !== undefined || (canClose && !critical) ? (
            <div className="mb-2 flex items-start justify-between gap-3">
              {title !== undefined ? (
                <h3 className="m-0 font-serif text-xl font-medium tracking-[-0.012em] text-ink">{title}</h3>
              ) : (
                <span />
              )}
              {canClose && !critical ? (
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="-mr-1 -mt-1 rounded-md p-1 text-ink-muted hover:bg-ink/5 hover:text-ink"
                >
                  ✕
                </button>
              ) : null}
            </div>
          ) : null}
          {subtitle !== undefined ? (
            <p className="m-0 mb-3 text-[13px] text-ink-muted">{subtitle}</p>
          ) : null}
          {body !== undefined ? (
            <div className="text-[13.5px] leading-[1.6] text-ink-body">{body}</div>
          ) : null}
        </div>

        {wantConfirm || wantCancel ? (
          <div className="mt-2 flex justify-end gap-2.5 border-t border-edge-hair bg-paper px-[26px] py-4">
            {wantCancel ? (
              <AppButton variant="secondary" onClick={handleCancel}>
                {cancelLabel ?? 'Cancel'}
              </AppButton>
            ) : null}
            {wantConfirm ? (
              critical ? (
                <HoldToConfirmButton onConfirm={handleConfirm}>
                  {confirmLabel ?? 'Hold to confirm'}
                </HoldToConfirmButton>
              ) : (
                <AppButton variant={destructive ? 'dangerSolid' : 'primary'} onClick={handleConfirm}>
                  {confirmLabel ?? 'Confirm'}
                </AppButton>
              )
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ModalHost() {
  const state = useSyncExternalStore(drawerStore.subscribe, drawerStore.getState, drawerStore.getState);

  if (typeof document === 'undefined' || state.modals.length === 0) return null;

  const lastIndex = state.modals.length - 1;
  return createPortal(
    <>
      {state.modals.map((modal, i) => (
        <ServiceModal key={modal.id} modal={modal} top={i === lastIndex} />
      ))}
    </>,
    document.body,
  );
}

/** Mount this once at the app root — it renders both the modal stack and toasts. */
export function DrawerHost() {
  return (
    <>
      <ModalHost />
      <ToastHost />
    </>
  );
}
