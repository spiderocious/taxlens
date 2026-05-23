import type { ReactNode } from 'react';

interface PartHeaderProps {
  readonly index: string;
  readonly title: string;
  readonly tagline: string;
}

export function PartHeader({ index, title, tagline }: PartHeaderProps) {
  return (
    <div className="mb-8">
      <div className="mb-1 font-mono text-[11px] uppercase tracking-wide text-slate-500">{index}</div>
      <h1 className="font-serif text-3xl font-medium text-teal-900">{title}</h1>
      <p className="mt-1 font-mono text-[11px] text-slate-500">{tagline}</p>
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
      <div className="mb-3 font-mono text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="rounded-xl border border-teal-900/10 bg-white p-6">{children}</div>
    </section>
  );
}

interface RefRowProps {
  readonly label: string;
  readonly children: ReactNode;
}

export function RefRow({ label, children }: RefRowProps) {
  return (
    <div className="grid grid-cols-[160px_1fr] items-center gap-4 border-b border-teal-900/5 py-3 last:border-b-0">
      <span className="font-mono text-[11px] text-slate-500">{label}</span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
