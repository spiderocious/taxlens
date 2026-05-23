import { type ReactNode } from 'react';

import { cn } from '../../utils/cn.js';

/**
 * Visual spec: design-system/projects/taxlens/preview/25-skeletons-empty.html
 * Tokens:     design-system/projects/taxlens/preview/_foundation.css (.sk / .empty / .err)
 *
 * Loading mirrors the result layout so nothing jumps. Empty states speak in the
 * calm serif voice — they invite, they don't scold. Errors get a single crimson
 * leading edge, never a full red panel.
 */
export interface SkeletonProps {
  readonly className?: string;
  readonly width?: string;
  readonly height?: string;
}

export function Skeleton({ className, width, height }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-md bg-[linear-gradient(90deg,#EEEBE3_25%,#F4F1EA_50%,#EEEBE3_75%)] bg-[length:400px_100%]',
        className,
      )}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export interface EmptyStateProps {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly icon?: ReactNode;
  readonly action?: ReactNode;
  /** Use the italic serif voice (for the AI out-of-scope empty). */
  readonly quote?: boolean;
  readonly className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  quote = false,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('text-center', className)}>
      {icon !== undefined ? (
        <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center text-clay-400">
          {icon}
        </div>
      ) : null}
      <div
        className={cn(
          'font-serif text-ink',
          quote ? 'text-[18px] font-normal italic' : 'text-xl',
        )}
      >
        {title}
      </div>
      {description !== undefined ? (
        <div className="mx-auto mt-1.5 max-w-[38ch] text-[13px] leading-[1.55] text-ink-muted">
          {description}
        </div>
      ) : null}
      {action !== undefined ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export interface ErrorStateProps {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly action?: ReactNode;
  readonly className?: string;
}

export function ErrorState({ title, description, action, className }: ErrorStateProps) {
  return (
    <div className={className}>
      <div className="rounded-r-ctrl border-l-[3px] border-crit bg-crit-bg px-[18px] py-4">
        <div className="mb-1 text-sm font-semibold text-crit">{title}</div>
        {description !== undefined ? (
          <p className="m-0 text-xs text-ink-body">{description}</p>
        ) : null}
      </div>
      {action !== undefined ? <div className="mt-3.5 flex gap-2.5">{action}</div> : null}
    </div>
  );
}
