import { cn } from '../../utils/cn.js';

/**
 * Visual spec: design-system/projects/taxlens/preview/12-selection.html
 * Tokens:     design-system/projects/taxlens/preview/_foundation.css (.choice · :259-277)
 *
 * The signature picker — the first decision a visitor makes; it drives which
 * income fields appear. A clean clay tick, never a heavy coloured panel.
 * Controlled: pass `value` + `onChange`.
 */
export interface ProfileOption {
  readonly id: string;
  readonly title: string;
  readonly description: string;
}

export interface ProfilePickerProps {
  readonly options: readonly ProfileOption[];
  readonly value: string;
  readonly onChange: (id: string) => void;
  readonly name?: string;
  readonly className?: string;
}

export function ProfilePicker({
  options,
  value,
  onChange,
  name = 'profile',
  className,
}: ProfilePickerProps) {
  return (
    <div role="radiogroup" className={cn('grid gap-3.5 sm:grid-cols-3', className)}>
      {options.map((opt) => {
        const selected = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={selected}
            name={name}
            onClick={() => onChange(opt.id)}
            className={cn(
              'grid grid-cols-[22px_1fr] items-start gap-3 rounded-ctrl border p-4 pr-[18px] text-left',
              'transition-[border-color,background] duration-[120ms]',
              'focus:outline-none focus-visible:ring-[3px] focus-visible:ring-clay-500/45',
              selected
                ? 'border-clay-500 bg-clay-50 shadow-[inset_0_0_0_1px_#C2613A]'
                : 'border-edge-strong bg-paper-sheet hover:border-ink-muted',
            )}
          >
            <span
              className={cn(
                'relative mt-px h-5 w-5 rounded-full border-[1.5px] transition-colors duration-[120ms]',
                selected ? 'border-clay-500' : 'border-edge-strong',
              )}
              aria-hidden="true"
            >
              {selected ? (
                <span className="absolute inset-1 rounded-full bg-clay-500" />
              ) : null}
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink">{opt.title}</span>
              <span className="mt-[3px] block text-[12.5px] leading-[1.45] text-ink-muted">
                {opt.description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
