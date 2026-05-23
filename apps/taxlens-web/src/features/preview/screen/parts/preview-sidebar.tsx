import { Repeat } from 'meemaw';

import { cn } from '@taxlens/ui';

import { NAV_GROUPS, NAV_ITEMS, type NavGroup } from '../../shared/nav-items.ts';

interface PreviewSidebarProps {
  readonly activeId: string;
  readonly onSelect: (id: string) => void;
}

export function PreviewSidebar({ activeId, onSelect }: PreviewSidebarProps) {
  return (
    <nav aria-label="Preview navigation" className="border-r border-edge bg-paper-deep p-4">
      <div className="mb-6 font-serif text-lg font-medium text-clay-700">TaxLens DS</div>
      <Repeat each={[...NAV_GROUPS]}>
        {(group: NavGroup) => (
          <div key={group} className="mb-5">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wide text-ink-muted">
              {group}
            </div>
            <Repeat each={NAV_ITEMS.filter((item) => item.group === group)}>
              {(item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={cn(
                    'mb-0.5 block w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-clay-500',
                    item.id === activeId
                      ? 'bg-clay-500 text-white'
                      : 'text-ink-body hover:bg-clay-500/5',
                  )}
                >
                  {item.label}
                </button>
              )}
            </Repeat>
          </div>
        )}
      </Repeat>
    </nav>
  );
}
