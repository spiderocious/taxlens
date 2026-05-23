import { type ReactNode } from 'react';

import { type ToastTone } from '../feedback/index.js';
import { drawerStore, type ModalItem } from './drawer-store.js';

/**
 * The imperative companion to <Modal> / <Toast>. Call from anywhere — no props,
 * no context — once <DrawerHost /> is mounted at the app root.
 *
 *   DrawerService.success('Result downloaded');
 *   DrawerService.error('We couldn’t read that PDF');
 *   const id = DrawerService.showModal({ title: 'Edit income', body: <IncomeForm />, onConfirm });
 *   DrawerService.confirm({ title: 'Include these?', body: '…', onConfirm });
 *   DrawerService.critical({ title: 'Clear all my data?', wipeList: […], onConfirm });
 */

const DEFAULT_TOAST_MS = 4500;

export interface ToastOptions {
  readonly tone?: ToastTone;
  /** ms before auto-dismiss; 0 = sticky (stays until dismissed). */
  readonly duration?: number;
  readonly icon?: ReactNode;
  readonly onUndo?: () => void;
}

/** Everything you can pass when launching a custom modal imperatively. */
export type ShowModalOptions = Omit<ModalItem, 'id'>;

class DrawerServiceImpl {
  // ── toasts ──────────────────────────────────────────────────────────────
  toast = (message: ReactNode, options: ToastOptions = {}): number => {
    const { tone = 'default', duration = DEFAULT_TOAST_MS, icon, onUndo } = options;
    const id = drawerStore.addToast({ message, tone, duration, icon, onUndo });
    if (duration > 0) {
      setTimeout(() => drawerStore.dismissToast(id), duration);
    }
    return id;
  };

  success = (message: ReactNode, options: ToastOptions = {}): number =>
    this.toast(message, { ...options, tone: 'success' });

  error = (message: ReactNode, options: ToastOptions = {}): number =>
    this.toast(message, { ...options, tone: 'error', duration: options.duration ?? 0 });

  warning = (message: ReactNode, options: ToastOptions = {}): number =>
    this.toast(message, { ...options, tone: 'warning' });

  info = (message: ReactNode, options: ToastOptions = {}): number =>
    this.toast(message, { ...options, tone: 'info' });

  dismissToast = (id: number): void => drawerStore.dismissToast(id);

  // ── modals ──────────────────────────────────────────────────────────────
  /** Launch a fully custom modal (pass any component as `body`). Returns its id. */
  showModal = (options: ShowModalOptions): number => drawerStore.openModal(options);

  /** A confirm modal with a primary action + cancel. */
  confirm = (
    options: Omit<ShowModalOptions, 'showConfirmButton' | 'showCancelButton'>,
  ): number =>
    drawerStore.openModal({
      confirmLabel: 'Confirm',
      cancelLabel: 'Cancel',
      ...options,
      showConfirmButton: true,
      showCancelButton: true,
    });

  /** The irreversible variant — crimson header + hold-to-confirm. */
  critical = (
    options: Omit<ShowModalOptions, 'critical' | 'showConfirmButton'>,
  ): number =>
    drawerStore.openModal({
      cancelLabel: 'Keep my data',
      confirmLabel: 'Hold to clear everything',
      ...options,
      critical: true,
      showCancelButton: options.showCancelButton ?? true,
    });

  closeModal = (id: number): void => drawerStore.closeModal(id);
  closeAllModals = (): void => drawerStore.closeAllModals();
}

export const DrawerService = new DrawerServiceImpl();
export type DrawerServiceApi = DrawerServiceImpl;
