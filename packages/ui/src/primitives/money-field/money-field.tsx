import { forwardRef, type InputHTMLAttributes } from 'react';

import { cn } from '../../utils/cn.js';

/**
 * Visual spec: design-system/projects/taxlens/preview/11-inputs.html
 * Tokens:     design-system/projects/taxlens/preview/_foundation.css (.money / .f · :218-249)
 *
 * The workhorse of the whole product: a persistent ₦ prefix, mono tabular
 * figures so amounts line up, and an optional /mo · /yr suffix. Presentational —
 * parse with parseNairaToKobo and format with formatNaira from @taxlens/core.
 */
export type MoneyFieldSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<MoneyFieldSize, string> = {
  sm: 'h-[38px] text-[13px] rounded-[10px]',
  md: 'h-[46px] text-sm rounded-ctrl',
  lg: 'h-[54px] text-base rounded-[14px]',
};

export interface MoneyFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  fieldSize?: MoneyFieldSize;
  invalid?: boolean;
  /** A short suffix shown inside the field on the right, e.g. "/mo" or "/yr". */
  per?: string;
}

export const MoneyField = forwardRef<HTMLInputElement, MoneyFieldProps>(function MoneyField(
  { fieldSize = 'md', invalid = false, per, className, disabled, ...rest },
  ref,
) {
  return (
    <div className="relative">
      <span
        className={cn(
          'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-ink-muted',
          disabled === true ? 'opacity-50' : '',
        )}
        aria-hidden="true"
      >
        ₦
      </span>
      <input
        ref={ref}
        inputMode="decimal"
        disabled={disabled}
        className={cn(
          'w-full bg-paper-sheet border border-edge-strong text-ink outline-none',
          'pl-9 font-mono tabular-nums tracking-[-0.01em] transition-[border-color,box-shadow] duration-[120ms]',
          'placeholder:text-ink-faint focus:border-clay-500 focus:shadow-[0_0_0_3px_rgba(194,97,58,0.16)]',
          'disabled:bg-paper-deep disabled:text-ink-faint disabled:cursor-not-allowed',
          per !== undefined ? 'pr-12' : 'pr-3.5',
          SIZE_CLASSES[fieldSize],
          invalid ? 'border-crit focus:border-crit focus:shadow-[0_0_0_3px_rgba(161,18,18,0.14)]' : '',
          className,
        )}
        {...rest}
      />
      {per !== undefined ? (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          {per}
        </span>
      ) : null}
    </div>
  );
});
