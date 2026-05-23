import { type ReactNode } from 'react';

import { type ToastTone } from '../feedback/index.js';

/**
 * Framework-free pub-sub store backing the imperative DrawerService. No Zustand,
 * no context — the hosts subscribe via useSyncExternalStore. Holds a toast queue
 * and a modal stack (last opened renders on top).
 *
 * Pattern mirrors the medcord-app DrawerService (translation-ui-guide §6.3).
 */

export interface ToastItem {
  readonly id: number;
  readonly message: ReactNode;
  readonly tone: ToastTone;
  /** ms before auto-dismiss; 0 = sticky. */
  readonly duration: number;
  readonly icon?: ReactNode;
  readonly onUndo?: () => void;
}

export type ModalSize = 'sm' | 'md' | 'lg';

/** A custom modal launched imperatively. `body` can be any component/JSX. */
export interface ModalItem {
  readonly id: number;
  readonly title?: ReactNode;
  readonly subtitle?: ReactNode;
  readonly body?: ReactNode;
  readonly size?: ModalSize;
  /** Show the ✕ in the header and allow ESC to close. Default true. */
  readonly canClose?: boolean;
  /** Close when the backdrop is clicked. Default true. */
  readonly clickOutsideClose?: boolean;
  /**
   * Confirm button (primary). Omit `onConfirm` to hide it, or use showConfirmButton.
   * Return value is ignored (so handlers can call DrawerService.* freely); if a
   * promise is returned, the modal closes after it resolves.
   */
  readonly onConfirm?: () => unknown;
  readonly onCancel?: () => unknown;
  /** Called whenever the modal leaves the screen, by any path. */
  readonly onClose?: () => unknown;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly showConfirmButton?: boolean;
  readonly showCancelButton?: boolean;
  /** Render the confirm button as the destructive (solid crimson) variant. */
  readonly destructive?: boolean;
  /** Critical (irreversible) variant: crimson header + hold-to-confirm. */
  readonly critical?: boolean;
  readonly criticalHeaderLabel?: string;
}

export interface DrawerState {
  readonly toasts: readonly ToastItem[];
  readonly modals: readonly ModalItem[];
}

type Listener = () => void;

class DrawerStore {
  private state: DrawerState = { toasts: [], modals: [] };
  private listeners = new Set<Listener>();
  private seq = 0;

  getState = (): DrawerState => this.state;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private emit(): void {
    // Replace the object so useSyncExternalStore sees a new reference.
    for (const l of this.listeners) l();
  }

  private nextId(): number {
    this.seq += 1;
    return this.seq;
  }

  // ── toasts ──────────────────────────────────────────────────────────────
  addToast = (toast: Omit<ToastItem, 'id'>): number => {
    const id = this.nextId();
    this.state = { ...this.state, toasts: [...this.state.toasts, { ...toast, id }] };
    this.emit();
    return id;
  };

  dismissToast = (id: number): void => {
    this.state = { ...this.state, toasts: this.state.toasts.filter((t) => t.id !== id) };
    this.emit();
  };

  // ── modals ──────────────────────────────────────────────────────────────
  openModal = (modal: Omit<ModalItem, 'id'>): number => {
    const id = this.nextId();
    this.state = { ...this.state, modals: [...this.state.modals, { ...modal, id }] };
    this.emit();
    return id;
  };

  closeModal = (id: number): void => {
    const target = this.state.modals.find((m) => m.id === id);
    this.state = { ...this.state, modals: this.state.modals.filter((m) => m.id !== id) };
    this.emit();
    target?.onClose?.();
  };

  closeAllModals = (): void => {
    const open = this.state.modals;
    this.state = { ...this.state, modals: [] };
    this.emit();
    for (const m of open) m.onClose?.();
  };
}

export const drawerStore = new DrawerStore();
