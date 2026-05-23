import { cn } from '../../utils/cn.js';

/**
 * Visual spec: design-system/projects/taxlens/preview/24-progress.html
 * Tokens:     design-system/projects/taxlens/preview/_foundation.css (.stepper / .bar · :12-24 of 24)
 *
 * Steps, bars, and the compute moment. Calm — bars draw once, never bounce.
 */
export interface Step {
  readonly label: string;
}

export interface StepperProps {
  readonly steps: readonly Step[];
  /** 0-based index of the current step. Earlier steps render as done. */
  readonly current: number;
  readonly className?: string;
}

export function Stepper({ steps, current, className }: StepperProps) {
  return (
    <div className={cn('flex items-center', className)}>
      {steps.map((step, i) => {
        const done = i < current;
        const now = i === current;
        return (
          <div key={step.label} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  'grid h-[26px] w-[26px] place-items-center rounded-full border-[1.5px] font-mono text-xs',
                  done
                    ? 'border-clay-500 bg-clay-500 text-white'
                    : now
                      ? 'border-clay-500 text-clay-700 shadow-[0_0_0_4px_#F4E7DD]'
                      : 'border-edge-strong text-ink-muted',
                )}
              >
                {done ? '✓' : i + 1}
              </span>
              <span
                className={cn(
                  'text-[13px] font-semibold',
                  now || done ? 'text-ink' : 'text-ink-faint font-medium',
                )}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 ? (
              <span className={cn('mx-3.5 h-px flex-1', done ? 'bg-clay-500' : 'bg-edge')} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export interface ProgressBarProps {
  /** 0–100. Omit for indeterminate. */
  readonly value?: number;
  readonly indeterminate?: boolean;
  readonly className?: string;
}

export function ProgressBar({ value = 0, indeterminate = false, className }: ProgressBarProps) {
  return (
    <div className={cn('h-2 overflow-hidden rounded-full bg-paper-deep', className)}>
      {indeterminate ? (
        <div className="h-full w-[30%] animate-indet rounded-full bg-clay-500" />
      ) : (
        <span
          className="block h-full rounded-full bg-clay-500 transition-[width] duration-[360ms] ease-out motion-reduce:transition-none"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      )}
    </div>
  );
}

export interface RingProps {
  /** 0–100 filled share. */
  readonly value: number;
  readonly label?: string;
  readonly size?: number;
  readonly className?: string;
}

export function Ring({ value, label, size = 92, className }: RingProps) {
  const filled = Math.max(0, Math.min(100, value));
  return (
    <svg width={size} height={size} viewBox="0 0 42 42" className={className} role="img">
      <circle cx="21" cy="21" r="15.9" fill="none" stroke="#EEEBE3" strokeWidth="5" />
      <circle
        cx="21"
        cy="21"
        r="15.9"
        fill="none"
        stroke="#C2613A"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${100 - filled}`}
        transform="rotate(-90 21 21)"
      />
      {label !== undefined ? (
        <text
          x="21"
          y="22.5"
          textAnchor="middle"
          style={{ fontSize: 7, fill: '#1C1B18', fontWeight: 600, fontFamily: 'JetBrains Mono' }}
        >
          {label}
        </text>
      ) : null}
    </svg>
  );
}
