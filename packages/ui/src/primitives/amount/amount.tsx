import { type HTMLAttributes } from 'react';

import { cn } from '../../utils/cn.js';

/**
 * Visual spec: design-system/projects/taxlens/preview/02-type.html, 27-cards.html
 * Tokens:     design-system/projects/taxlens/preview/_foundation.css (.amt · :326-339)
 *
 * The ₦ figure is the loudest object on the screen — mono, tabular, with a
 * de-emphasised currency mark. This is the system's hero idiom. Pass a
 * pre-formatted string (use formatNaira from @taxlens/core) or a raw number.
 */
export type AmountSize = 'hero' | 'xl' | 'lg' | 'md' | 'sm';

export interface AmountProps extends HTMLAttributes<HTMLSpanElement> {
  /** Pre-formatted value WITHOUT the currency symbol, e.g. "805,200" or "12.4". */
  value: string | number;
  size?: AmountSize;
  /** The currency / unit mark shown small before the value. Default "₦". */
  symbol?: string;
  /** A trailing unit, e.g. "% effective" or "/yr". */
  unit?: string;
}

const SIZE_CLASSES: Record<AmountSize, string> = {
  hero: 'text-[44px] leading-none tracking-[-0.03em]',
  xl: 'text-[32px] tracking-[-0.02em]',
  lg: 'text-[22px]',
  md: 'text-base',
  sm: 'text-[13px]',
};

const SYMBOL_SIZE: Record<AmountSize, string> = {
  hero: 'text-[26px]',
  xl: 'text-[20px]',
  lg: 'text-[15px]',
  md: 'text-[12px]',
  sm: 'text-[11px]',
};

export function Amount({
  value,
  size = 'md',
  symbol = '₦',
  unit,
  className,
  ...rest
}: AmountProps) {
  return (
    <span
      className={cn(
        'inline-flex items-baseline gap-1 font-mono font-medium tabular-nums tracking-[-0.01em] text-ink',
        SIZE_CLASSES[size],
        className,
      )}
      {...rest}
    >
      {symbol !== '' ? (
        <span className={cn('font-medium text-ink-muted', SYMBOL_SIZE[size])}>{symbol}</span>
      ) : null}
      <span>{value}</span>
      {unit !== undefined && unit !== '' ? (
        <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
          {unit}
        </span>
      ) : null}
    </span>
  );
}
