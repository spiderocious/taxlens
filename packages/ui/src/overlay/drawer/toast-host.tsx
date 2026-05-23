import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

import { Toast } from '../feedback/index.js';
import { drawerStore } from './drawer-store.js';

/**
 * Mount once at the app root (inside <DrawerHost />). Subscribes to the store
 * and renders the toast stack in a fixed bottom-right column, newest at the
 * bottom. Auto-dismiss timing is owned by DrawerService.toast.
 */
export function ToastHost() {
  const state = useSyncExternalStore(drawerStore.subscribe, drawerStore.getState, drawerStore.getState);

  if (typeof document === 'undefined' || state.toasts.length === 0) return null;

  return createPortal(
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex max-w-[420px] flex-col gap-2.5">
      {state.toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast
            tone={t.tone}
            icon={t.icon}
            onDismiss={() => drawerStore.dismissToast(t.id)}
            onUndo={
              t.onUndo !== undefined
                ? () => {
                    t.onUndo?.();
                    drawerStore.dismissToast(t.id);
                  }
                : undefined
            }
          >
            {t.message}
          </Toast>
        </div>
      ))}
    </div>,
    document.body,
  );
}
