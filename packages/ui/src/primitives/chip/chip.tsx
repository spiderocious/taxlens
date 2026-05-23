import { type HTMLAttributes, type ReactNode } from 'react';

import { cn } from '../../utils/cn.js';

/**
 * Visual spec: design-system/projects/taxlens/preview/12-selection.html, 26-avatars-pills.html
 * Tokens:     design-system/projects/taxlens/preview/_foundation.css (.chip · :303-316)
 *
 * The tax-position taxonomy — each colour means exactly one thing:
 *   clay = exempt/accent · save = good news · warn = needs input ·
 *   crit = will be lost · info = statute note · paper/sand = neutral profile.
 */
export type ChipVariant = 'clay' | 'sand' | 'paper' | 'save' | 'warn' | 'crit' | 'info';

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: ChipVariant;
  /** Show a leading status dot in the current text colour. */
  dot?: boolean;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ChipVariant, string> = {
  clay: 'bg-clay-100 text-clay-800 border-transparent',
  sand: 'bg-[#F0EADD] text-[#5A4F2E] border-transparent',
  paper: 'bg-paper-sheet text-ink-body border-edge',
  save: 'bg-save-bg text-save border-save-edge',
  warn: 'bg-warn-bg text-warn border-warn-edge',
  crit: 'bg-crit-bg text-crit border-crit-edge',
  info: 'bg-info-bg text-info border-info-edge',
};

export function Chip({ variant = 'paper', dot = false, className, children, ...rest }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex h-[26px] items-center gap-1.5 whitespace-nowrap rounded-full border px-[11px]',
        'font-sans text-xs font-semibold tracking-[0.02em]',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...rest}
    >
      {dot ? (
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-85" aria-hidden="true" />
      ) : null}
      {children}
    </span>
  );
}
