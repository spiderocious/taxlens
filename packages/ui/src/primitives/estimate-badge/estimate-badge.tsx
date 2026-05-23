import { type HTMLAttributes } from 'react';

import { cn } from '../../utils/cn.js';

/**
 * Visual spec: design-system/projects/taxlens/preview/26-avatars-pills.html
 * Tokens:     design-system/projects/taxlens/preview/_foundation.css (.est-badge · :318-324)
 *
 * Required beside every computed figure (a PRD idiom). Sits next to the number,
 * never decorating empty space. Default label "Estimate · NTA 2025".
 */
export interface EstimateBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  label?: string;
}

export function EstimateBadge({
  label = 'Estimate · NTA 2025',
  className,
  ...rest
}: EstimateBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-[22px] items-center gap-1.5 rounded-md border border-clay-200 bg-clay-50 px-[9px]',
        'font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-clay-800',
        className,
      )}
      {...rest}
    >
      {label}
    </span>
  );
}
