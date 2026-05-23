import { type ReactNode } from 'react';

import { cn } from '../../utils/cn.js';

/**
 * Visual spec: design-system/projects/taxlens/preview/29-navigation.html
 * Tokens:     design-system/projects/taxlens/preview/_foundation.css (.topbar / .steprail · :12-28 of 29)
 *
 * A single-task tool needs almost no navigation — a brand mark, the three-step
 * flow, and a way to reach the explainer pages. The flow IS the navigation.
 */
export interface TopBarLink {
  readonly label: string;
  readonly href?: string;
  readonly active?: boolean;
  readonly onClick?: () => void;
}

export interface TopBarProps {
  readonly links: readonly TopBarLink[];
  /** Right-aligned action (e.g. a "Start over" button). */
  readonly action?: ReactNode;
  readonly brand?: ReactNode;
  readonly className?: string;
}

export function TopBar({ links, action, brand, className }: TopBarProps) {
  return (
    <div className={cn('flex h-[60px] items-center gap-[18px] px-[22px]', className)}>
      <span className="flex items-center gap-2.5 font-serif text-[19px] font-semibold tracking-[-0.01em] text-ink">
        {brand ?? (
          <>
            <span className="grid h-[26px] w-[26px] place-items-center rounded-[7px] bg-clay-500 text-[13px] text-white">
              ₦
            </span>
            TaxLens
            <span className="self-center text-[11px] font-semibold tracking-[0.08em] text-ink-faint">
              NG
            </span>
          </>
        )}
      </span>
      <span className="flex-1" />
      <nav className="flex gap-1">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href ?? '#'}
            onClick={link.onClick}
            className={cn(
              'rounded-lg px-3 py-2 text-[13px] font-medium no-underline transition-colors',
              link.active === true ? 'bg-clay-50 text-ink' : 'text-ink-muted hover:text-ink',
            )}
          >
            {link.label}
          </a>
        ))}
      </nav>
      {action}
    </div>
  );
}

export interface RailStep {
  readonly index: string;
  readonly title: string;
}

export interface StepRailProps {
  readonly steps: readonly RailStep[];
  /** 0-based index of the active step. */
  readonly active: number;
  readonly className?: string;
}

export function StepRail({ steps, active, className }: StepRailProps) {
  return (
    <div className={cn('flex gap-2 p-3.5 px-[22px]', className)}>
      {steps.map((step, i) => {
        const on = i === active;
        return (
          <div
            key={step.index}
            className={cn(
              'flex-1 rounded-ctrl border px-3.5 py-3',
              on ? 'border-clay-500 bg-clay-50' : 'border-edge',
            )}
          >
            <div className="font-mono text-[11px] text-ink-muted">{step.index}</div>
            <div className={cn('mt-[3px] text-[13px] font-semibold', on ? 'text-clay-800' : 'text-ink')}>
              {step.title}
            </div>
          </div>
        );
      })}
    </div>
  );
}
