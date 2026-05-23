import { type ReactNode } from 'react';

import { cn } from '../../utils/cn.js';
import { Avatar } from '../../data/avatar/index.js';

/**
 * Visual spec: design-system/projects/taxlens/preview/42-cross.html, 33-ai-followup.html
 * Tokens:     design-system/projects/taxlens/preview/_foundation.css (.assist / .meth / .cite / .export)
 *
 * TaxLens has no sharing, mentions, or audit log. What it has: AI suggestions
 * that never act on their own, a transparent methodology list, statute
 * citations, and a single PDF export. Plus the required disclaimer footer.
 */
export interface AssistCardProps {
  readonly heading: string;
  readonly children: ReactNode;
  /** The action row — never auto-acts; the human disposes. */
  readonly actions?: ReactNode;
  readonly className?: string;
}

export function AssistCard({ heading, children, actions, className }: AssistCardProps) {
  return (
    <div className={cn('grid grid-cols-[34px_1fr] gap-3.5', className)}>
      <Avatar size="sm" />
      <div className="rounded-[14px] border border-clay-200 bg-clay-50 px-[18px] py-4">
        <div className="mb-1.5 text-[13px] font-semibold text-clay-800">{heading}</div>
        <div className="text-[13.5px] leading-[1.55] text-ink-body">{children}</div>
        {actions !== undefined ? <div className="mt-3 flex gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export interface CitationBlockProps {
  /** Statute reference, mono, e.g. "NTA 2025 · Fourth Schedule". */
  readonly statuteRef: string;
  /** The quoted statute text (serif italic). */
  readonly children: ReactNode;
  readonly className?: string;
}

export function CitationBlock({ statuteRef, children, className }: CitationBlockProps) {
  return (
    <div className={cn('my-2 rounded-r-lg border-l-2 border-clay-300 bg-clay-50 px-3.5 py-2.5', className)}>
      <div className="font-mono text-[11px] font-semibold text-clay-800">{statuteRef}</div>
      <div className="mt-1 font-serif text-sm italic leading-[1.5] text-ink-body">{children}</div>
    </div>
  );
}

export interface MethodologyEntry {
  readonly what: ReactNode;
  /** Statute reference, mono. */
  readonly ref: string;
}

export interface MethodologyListProps {
  readonly entries: readonly MethodologyEntry[];
  readonly className?: string;
}

export function MethodologyList({ entries, className }: MethodologyListProps) {
  return (
    <div className={cn('overflow-hidden rounded-ctrl border border-edge', className)}>
      {entries.map((entry, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_auto] items-baseline gap-3.5 border-b border-edge-hair px-4 py-3 last:border-b-0"
        >
          <span className="text-[13px] text-ink-body">{entry.what}</span>
          <span className="font-mono text-[11px] text-clay-700">{entry.ref}</span>
        </div>
      ))}
    </div>
  );
}

export interface ExportRowProps {
  readonly filename: string;
  readonly meta: ReactNode;
  /** The download action. */
  readonly action?: ReactNode;
  readonly className?: string;
}

export function ExportRow({ filename, meta, action, className }: ExportRowProps) {
  return (
    <div className={cn('flex items-center gap-3.5 rounded-[14px] border border-edge px-[18px] py-4', className)}>
      <span className="grid h-[46px] w-[38px] flex-shrink-0 place-items-center rounded-[5px] border border-clay-200 bg-clay-50 font-mono text-[9px] text-clay-700">
        PDF
      </span>
      <span className="flex-1">
        <span className="block text-[13.5px] font-semibold text-ink">{filename}</span>
        <span className="mt-0.5 block text-[11.5px] text-ink-muted">{meta}</span>
      </span>
      {action}
    </div>
  );
}

export interface DisclaimerProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

export function Disclaimer({
  children = (
    <>
      Estimate under the Nigeria Tax Act 2025. <b className="font-semibold text-ink-body">Not tax advice.</b>
    </>
  ),
  className,
}: DisclaimerProps) {
  return (
    <p
      className={cn('mt-[18px] border-t border-edge-hair pt-3 text-[11.5px] leading-[1.5] text-ink-muted', className)}
    >
      {children}
    </p>
  );
}
