import { cn } from '../../utils/cn.js';

/**
 * Visual spec: design-system/projects/taxlens/preview/12-selection.html
 * Tokens:     design-system/projects/taxlens/preview/_foundation.css (.seg · :294-301)
 *
 * Used for monthly/yearly and old/new toggles. Controlled.
 */
export interface SegmentedOption<T extends string> {
  readonly label: string;
  readonly value: T;
}

export interface SegmentedControlProps<T extends string> {
  readonly options: readonly SegmentedOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly ariaLabel?: string;
  readonly className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('inline-flex gap-0.5 rounded-[10px] bg-paper-deep p-[3px]', className)}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'h-[30px] rounded-lg px-3.5 font-sans text-[12.5px] font-semibold transition-colors duration-[120ms]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-clay-500/45',
              active
                ? 'bg-paper-sheet text-ink shadow-[0_1px_0_rgba(28,27,24,0.03)]'
                : 'text-ink-muted hover:text-ink',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
