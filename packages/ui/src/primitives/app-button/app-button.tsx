import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

import { cn } from '../../utils/cn.js';

export type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AppButtonVariant;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const VARIANT_CLASSES: Record<AppButtonVariant, string> = {
  primary:
    'bg-[#0B3B3C] text-[#FBFAF7] hover:bg-[#0F5C5E] focus-visible:ring-[#0F5C5E] disabled:opacity-60',
  secondary:
    'bg-[#FBFAF7] text-[#0B3B3C] ring-1 ring-inset ring-[#0B3B3C]/15 hover:bg-[#0B3B3C]/5 focus-visible:ring-[#0B3B3C] disabled:opacity-60',
  ghost:
    'bg-transparent text-[#0B3B3C] hover:bg-[#0B3B3C]/5 focus-visible:ring-[#0B3B3C] disabled:opacity-60',
  danger:
    'bg-[#C0392B] text-white hover:bg-[#A23123] focus-visible:ring-[#C0392B] disabled:opacity-60',
};

export const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(function AppButton(
  { variant = 'primary', className, loading, leadingIcon, trailingIcon, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2',
        'text-sm font-medium transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...rest}
    >
      {leadingIcon ? <span className="-ml-0.5">{leadingIcon}</span> : null}
      <span>{loading ? 'Loading…' : children}</span>
      {trailingIcon ? <span className="-mr-0.5">{trailingIcon}</span> : null}
    </button>
  );
});
