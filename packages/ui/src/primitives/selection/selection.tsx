import { type ReactNode } from 'react';

import { cn } from '../../utils/cn.js';

/**
 * Visual spec: design-system/projects/taxlens/preview/12-selection.html
 * Tokens:     design-system/projects/taxlens/preview/_foundation.css (.check / .switch · :279-292)
 *
 * Selection reads as "done" — a clean clay fill, never a warning. Both controlled.
 */
export interface CheckboxProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label?: ReactNode;
  readonly disabled?: boolean;
  readonly className?: string;
}

export function Checkbox({ checked, onChange, label, disabled = false, className }: CheckboxProps) {
  return (
    <label
      className={cn(
        'inline-flex cursor-pointer items-center gap-3',
        disabled ? 'cursor-not-allowed opacity-50' : '',
        className,
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'inline-grid h-5 w-5 flex-shrink-0 place-items-center rounded-md border-[1.5px]',
          'transition-[border-color,background] duration-[120ms]',
          'focus:outline-none focus-visible:ring-[3px] focus-visible:ring-clay-500/45',
          checked ? 'border-clay-500 bg-clay-500' : 'border-edge-strong bg-paper-sheet',
        )}
      >
        {checked ? (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none" aria-hidden="true">
            <path
              d="M1 4.5 4 7.5 10 1.5"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </button>
      {label !== undefined ? (
        <span className={cn('text-sm', checked ? 'text-ink' : 'text-ink-body')}>{label}</span>
      ) : null}
    </label>
  );
}

export interface SwitchProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label?: ReactNode;
  readonly disabled?: boolean;
  readonly className?: string;
}

export function Switch({ checked, onChange, label, disabled = false, className }: SwitchProps) {
  return (
    <label
      className={cn(
        'inline-flex cursor-pointer items-center gap-3',
        disabled ? 'cursor-not-allowed opacity-50' : '',
        className,
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-10 flex-shrink-0 rounded-full transition-colors duration-[120ms]',
          'focus:outline-none focus-visible:ring-[3px] focus-visible:ring-clay-500/45',
          checked ? 'bg-clay-500' : 'bg-edge-strong',
        )}
      >
        <span
          className={cn(
            'absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-[left] duration-[120ms]',
            checked ? 'left-[19px]' : 'left-[3px]',
          )}
        />
      </button>
      {label !== undefined ? (
        <span className={cn('text-sm', checked ? 'text-ink' : 'text-ink-body')}>{label}</span>
      ) : null}
    </label>
  );
}
