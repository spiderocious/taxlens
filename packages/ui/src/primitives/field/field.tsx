import {
  forwardRef,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
  type ReactNode,
} from 'react';

import { cn } from '../../utils/cn.js';

/**
 * Visual spec: design-system/projects/taxlens/preview/11-inputs.html
 * Tokens:     design-system/projects/taxlens/preview/_foundation.css (.f / .field · :218-257)
 *
 * Generic form atoms. The ₦ workhorse lives in <MoneyField>. A <Field> wraps any
 * control with an uppercase label, optional help, and an error message.
 */
export type FieldSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<FieldSize, string> = {
  sm: 'h-[38px] text-[13px] px-3 rounded-[10px]',
  md: 'h-[46px] text-sm px-3.5 rounded-ctrl',
  lg: 'h-[54px] text-base px-[18px] rounded-[14px]',
};

const baseControl =
  'w-full bg-paper-sheet border border-edge-strong text-ink outline-none transition-[border-color,box-shadow] duration-[120ms] ' +
  'placeholder:text-ink-faint focus:border-clay-500 focus:shadow-[0_0_0_3px_rgba(194,97,58,0.16)] ' +
  'disabled:bg-paper-deep disabled:text-ink-faint disabled:cursor-not-allowed';

const invalidControl = 'border-crit focus:shadow-[0_0_0_3px_rgba(161,18,18,0.14)] focus:border-crit';

export interface FieldProps {
  readonly label?: string;
  readonly help?: ReactNode;
  readonly error?: string;
  readonly htmlFor?: string;
  readonly className?: string;
  readonly children: ReactNode;
}

export function Field({ label, help, error, htmlFor, className, children }: FieldProps) {
  return (
    <div className={cn('grid gap-[7px]', className)}>
      {label !== undefined ? (
        <label
          htmlFor={htmlFor}
          className={cn(
            'font-sans text-[10.5px] font-semibold uppercase tracking-label',
            error !== undefined ? 'text-crit' : 'text-ink-muted',
          )}
        >
          {label}
        </label>
      ) : null}
      {children}
      {error !== undefined ? (
        <span className="text-xs text-crit">{error}</span>
      ) : help !== undefined ? (
        <span className="text-xs leading-[1.45] text-ink-muted">{help}</span>
      ) : null}
    </div>
  );
}

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  fieldSize?: FieldSize;
  invalid?: boolean;
  mono?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { fieldSize = 'md', invalid = false, mono = false, className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        baseControl,
        SIZE_CLASSES[fieldSize],
        mono ? 'font-mono tabular-nums tracking-[-0.01em]' : 'font-sans',
        invalid ? invalidControl : '',
        className,
      )}
      {...rest}
    />
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid = false, className, rows = 2, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        baseControl,
        'rounded-ctrl px-3.5 py-[13px] font-sans text-sm leading-[1.6] resize-y',
        invalid ? invalidControl : '',
        className,
      )}
      {...rest}
    />
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  fieldSize?: FieldSize;
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { fieldSize = 'md', invalid = false, className, children, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        baseControl,
        SIZE_CLASSES[fieldSize],
        'font-sans appearance-none',
        invalid ? invalidControl : '',
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
});
