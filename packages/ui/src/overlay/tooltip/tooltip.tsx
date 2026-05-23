import { useState, type ReactNode } from 'react';

import { cn } from '../../utils/cn.js';

/**
 * Visual spec: design-system/projects/taxlens/preview/28-tooltips.html
 * Tokens:     design-system/projects/taxlens/preview/_foundation.css (.tip / .pop · :13-20 of 28)
 *
 * Tax has jargon; TaxLens defines it inline. A dotted clay underline marks a
 * definable term — hover (or focus) for a one-line plain-English gloss. The
 * Popover is the heavier sibling: a statute snippet behind a figure.
 */
export interface TooltipProps {
  /** The trigger term. */
  readonly children: ReactNode;
  /** The plain-English gloss. */
  readonly content: ReactNode;
  readonly className?: string;
}

export function Tooltip({ children, content, className }: TooltipProps) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className={cn('relative inline-block cursor-help border-b-[1.5px] border-dotted border-clay-400', className)}
      tabIndex={0}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open ? (
        <span
          role="tooltip"
          className="absolute bottom-[calc(100%+10px)] left-1/2 z-30 w-max max-w-[240px] -translate-x-1/2 rounded-lg bg-ink px-[11px] py-2 text-xs leading-[1.45] text-white shadow-pop"
        >
          {content}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-[5px] border-transparent border-t-ink" />
        </span>
      ) : null}
    </span>
  );
}

export interface PopoverProps {
  /** Statute reference, mono, e.g. "NTA 2025 · Fourth Schedule". */
  readonly statuteRef: string;
  /** The quoted statute text (rendered serif italic). */
  readonly quote: ReactNode;
  /** "How we got your figure" body. */
  readonly children: ReactNode;
  readonly bodyLabel?: string;
  readonly className?: string;
}

export function Popover({
  statuteRef,
  quote,
  children,
  bodyLabel = 'How we got your figure',
  className,
}: PopoverProps) {
  return (
    <div
      role="dialog"
      className={cn('w-[300px] overflow-hidden rounded-[14px] border border-edge bg-paper-sheet shadow-pop', className)}
    >
      <div className="border-b border-edge-hair px-4 pb-3 pt-3.5">
        <div className="font-mono text-[11px] font-semibold text-clay-800">{statuteRef}</div>
        <div className="mt-1.5 font-serif text-sm italic leading-[1.5] text-ink-body">{quote}</div>
      </div>
      <div className="px-4 py-3.5">
        <div className="mb-1.5 text-xs text-ink-muted">{bodyLabel}</div>
        <div className="text-[13px] text-ink">{children}</div>
      </div>
    </div>
  );
}
