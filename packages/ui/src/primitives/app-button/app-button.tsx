import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

import { cn } from '../../utils/cn.js';

/**
 * Visual spec: design-system/projects/taxlens/preview/10-buttons.html
 * Tokens:     design-system/projects/taxlens/preview/_foundation.css (.b · :181-216)
 *
 * One filled clay primary per view, outline secondary beside it, quiet text for
 * the rest. Destructive is deliberately cooler + quieter than the warm primary:
 * `danger` is a ghost by default; `dangerSolid` (cold crimson) is reserved for
 * the one irreversible confirm — see HoldToConfirmButton / CriticalModal.
 */
export type AppButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'link'
  | 'danger'
  | 'dangerSolid';

export type AppButtonSize = 'sm' | 'md' | 'lg';

export interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  loading?: boolean;
  block?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const VARIANT_CLASSES: Record<AppButtonVariant, string> = {
  primary:
    'bg-clay-500 text-white border border-clay-500 hover:bg-clay-600 hover:border-clay-600 active:bg-clay-700 active:border-clay-700 disabled:opacity-45',
  secondary:
    'bg-paper-sheet text-ink border border-edge-strong hover:bg-paper-deep hover:border-ink-muted disabled:opacity-45',
  ghost:
    'bg-transparent text-ink-body border border-transparent hover:bg-ink/5 hover:text-ink disabled:opacity-45',
  link:
    'bg-transparent text-clay-700 border-0 px-0 h-auto hover:text-clay-800 hover:underline underline-offset-[3px] disabled:opacity-45',
  // destructive — ghost by default; crimson grows only on hover
  danger:
    'bg-paper-sheet text-crit border border-crit-edge hover:bg-crit-bg hover:border-crit disabled:opacity-45',
  // destructive — solid; ONLY inside the irreversible confirm
  dangerSolid:
    'bg-crit text-white border border-crit hover:bg-crit-deep hover:border-crit-deep disabled:opacity-45',
};

const SIZE_CLASSES: Record<AppButtonSize, string> = {
  sm: 'h-9 px-3.5 text-[13px] rounded-[10px]',
  md: 'h-11 px-5 text-sm rounded-ctrl',
  lg: 'h-[52px] px-6 text-[15px] rounded-[14px]',
};

export const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(function AppButton(
  {
    variant = 'primary',
    size = 'md',
    className,
    loading,
    block,
    leadingIcon,
    trailingIcon,
    children,
    disabled,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled === true || loading === true}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-sans font-semibold',
        'transition-colors duration-[120ms] active:translate-y-px',
        'focus:outline-none focus-visible:ring-[3px] focus-visible:ring-clay-500/45',
        'disabled:cursor-not-allowed',
        variant !== 'link' ? SIZE_CLASSES[size] : 'text-sm',
        block === true ? 'w-full' : '',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...rest}
    >
      {leadingIcon !== undefined && leadingIcon !== null ? (
        <span className="-ml-0.5 inline-flex">{leadingIcon}</span>
      ) : null}
      <span>{loading === true ? 'Loading…' : children}</span>
      {trailingIcon !== undefined && trailingIcon !== null ? (
        <span className="-mr-0.5 inline-flex">{trailingIcon}</span>
      ) : null}
    </button>
  );
});
