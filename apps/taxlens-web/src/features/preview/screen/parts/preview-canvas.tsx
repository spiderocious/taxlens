import type { ReactNode } from 'react';

interface PartHeaderProps {
  readonly index: string;
  readonly title: string;
  readonly tagline: string;
}

export function PartHeader({ index, title, tagline }: PartHeaderProps) {
  return (
    <div className="mb-8">
      <div className="mb-1 font-mono text-[11px] uppercase tracking-wide text-ink-muted">{index}</div>
      <h1 className="font-serif text-3xl font-medium text-ink">{title}</h1>
      <p className="mt-1 font-mono text-[11px] text-ink-muted">{tagline}</p>
    </div>
  );
}

interface SceneProps {
  readonly label: string;
  readonly children: ReactNode;
}

export function Scene({ label, children }: SceneProps) {
  return (
    <section className="mb-8">
      <div className="mb-3 font-mono text-[11px] uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="rounded-card border border-edge bg-paper-sheet p-6">{children}</div>
    </section>
  );
}

interface RefRowProps {
  readonly label: string;
  readonly children: ReactNode;
}

export function RefRow({ label, children }: RefRowProps) {
  return (
    <div className="grid grid-cols-[160px_1fr] items-center gap-4 border-b border-edge-hair py-3 last:border-b-0">
      <span className="font-mono text-[11px] text-ink-muted">{label}</span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
