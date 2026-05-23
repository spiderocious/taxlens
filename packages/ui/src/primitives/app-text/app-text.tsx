import { type HTMLAttributes, type ElementType, type ReactNode } from 'react';

import { cn } from '../../utils/cn.js';

/**
 * Visual spec: design-system/projects/taxlens/preview/02-type.html
 * Tokens:     design-system/projects/taxlens/preview/_foundation.css (.serif / .headline / .lede / .overline)
 *
 * Sans (Inter) leads the chrome; Newsreader serif is reserved for the calm
 * "thinking" voice — display, headlines, lede, the AI explainer, empty states.
 * Naira figures are mono and live in <Amount>, not here.
 */
export type AppTextVariant =
  | 'display-1' // 52 serif — hero page title
  | 'display-2' // 32 serif
  | 'heading-1' // 32 serif
  | 'heading-2' // 22 serif
  | 'heading-3' // 20 sans semibold
  | 'lede' // 18 serif — plain-English read
  | 'body' // 14 sans
  | 'body-sm' // 13 sans
  | 'caption'; // 11 sans caps, +0.18em (overline)

export interface AppTextProps extends HTMLAttributes<HTMLElement> {
  variant?: AppTextVariant;
  as?: ElementType;
  children?: ReactNode;
}

const VARIANT_CLASSES: Record<AppTextVariant, string> = {
  'display-1': 'font-serif text-[52px] leading-[1.03] font-medium tracking-display text-ink',
  'display-2': 'font-serif text-[32px] leading-[1.1] font-medium tracking-[-0.018em] text-ink',
  'heading-1': 'font-serif text-[32px] leading-[1.1] font-medium tracking-[-0.018em] text-ink',
  'heading-2': 'font-serif text-[22px] leading-[1.2] font-medium tracking-[-0.012em] text-ink',
  'heading-3': 'font-sans text-xl font-semibold leading-snug text-ink',
  lede: 'font-serif text-[18px] leading-[1.55] tracking-[-0.006em] text-ink-body',
  body: 'font-sans text-sm leading-[1.65] text-ink-body',
  'body-sm': 'font-sans text-[13px] leading-relaxed text-ink-body',
  caption: 'font-sans text-[11px] font-semibold uppercase tracking-overline text-ink-muted',
};

const DEFAULT_ELEMENT: Record<AppTextVariant, ElementType> = {
  'display-1': 'h1',
  'display-2': 'h1',
  'heading-1': 'h2',
  'heading-2': 'h3',
  'heading-3': 'h4',
  lede: 'p',
  body: 'p',
  'body-sm': 'p',
  caption: 'span',
};

export function AppText({ variant = 'body', as, className, children, ...rest }: AppTextProps) {
  const Component = as ?? DEFAULT_ELEMENT[variant];
  return (
    <Component className={cn(VARIANT_CLASSES[variant], className)} {...rest}>
      {children}
    </Component>
  );
}
