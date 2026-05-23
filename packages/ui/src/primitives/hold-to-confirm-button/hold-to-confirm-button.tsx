import { useCallback, useRef, useState, type ReactNode } from 'react';

import { cn } from '../../utils/cn.js';

/**
 * Visual spec: design-system/projects/taxlens/preview/10-buttons.html, 40-modals.html
 * Tokens:     design-system/projects/taxlens/preview/_foundation.css (.hold / .b-danger · :206-212)
 *
 * The one irreversible action — wiping the stateless session. Press and hold;
 * a cold-crimson ring fills over `holdMs` (default 1500). Releasing early
 * cancels. Honours prefers-reduced-motion (ring still fills, just instantly via
 * the same timer — no transition jank). This is the ONLY place crimson goes solid.
 */
export interface HoldToConfirmButtonProps {
  readonly onConfirm: () => void;
  readonly children?: ReactNode;
  readonly holdMs?: number;
  readonly disabled?: boolean;
  readonly className?: string;
}

export function HoldToConfirmButton({
  onConfirm,
  children = 'Hold to clear everything',
  holdMs = 1500,
  disabled = false,
  className,
}: HoldToConfirmButtonProps) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setHolding(false);
  }, []);

  const start = useCallback(() => {
    if (disabled) return;
    setHolding(true);
    timer.current = setTimeout(() => {
      setHolding(false);
      onConfirm();
    }, holdMs);
  }, [disabled, holdMs, onConfirm]);

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      className={cn(
        'relative inline-flex h-11 items-center justify-center overflow-hidden rounded-ctrl border border-crit bg-crit px-5',
        'font-sans text-sm font-semibold text-white select-none',
        'focus:outline-none focus-visible:ring-[3px] focus-visible:ring-crit/45',
        'disabled:cursor-not-allowed disabled:opacity-45',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 bg-crit-deep motion-reduce:transition-none"
        style={{
          width: holding ? '100%' : '0%',
          transitionProperty: 'width',
          transitionTimingFunction: 'linear',
          transitionDuration: holding ? `${holdMs}ms` : '0ms',
        }}
      />
      <span className="relative z-[1]">{children}</span>
    </button>
  );
}
