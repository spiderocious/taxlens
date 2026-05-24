import { useNavigate } from 'react-router-dom';

import { ROUTES } from '@taxlens/core';
import { AppButton, cn } from '@taxlens/ui';

interface NavLink {
  readonly label: string;
  readonly to: string;
}

const NAV: readonly NavLink[] = [
  { label: 'Start', to: ROUTES.HOME },
  { label: 'How it works', to: ROUTES.HOW_IT_WORKS },
  { label: 'About', to: ROUTES.ABOUT },
];

interface AppHeaderProps {
  readonly activeLink?: string;
  readonly onStartOver?: () => void;
}

/**
 * Responsive header. The package TopBar is desktop-only, so the shell uses this.
 * Deliberate two-row layout on mobile: row 1 = brand + (Start over) at the ends;
 * row 2 = the nav. On sm+ it collapses to one row: brand · nav · Start over.
 * The flow IS the navigation, so the link set stays tiny.
 */
export function AppHeader({ activeLink, onStartOver }: AppHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:gap-5 sm:px-6">
      {/* Row 1 (mobile): brand + start-over at the ends. `sm:contents` lets both
          children join the parent flex row on desktop. */}
      <div className="flex items-center justify-between gap-3 sm:contents">
        <button
          type="button"
          onClick={() => navigate(ROUTES.HOME)}
          className="flex shrink-0 items-center gap-2.5 font-serif text-[19px] font-semibold tracking-[-0.01em] text-ink"
        >
          <span className="grid h-[26px] w-[26px] place-items-center rounded-[7px] bg-clay-500 text-[13px] text-white">
            ₦
          </span>
          TaxLens
          <span className="text-[11px] font-semibold tracking-[0.08em] text-ink-faint">NG</span>
        </button>

        {onStartOver ? (
          <AppButton
            variant="ghost"
            size="sm"
            className="shrink-0 sm:order-last"
            onClick={onStartOver}
          >
            Start over
          </AppButton>
        ) : null}
      </div>

      {/* Row 2 (mobile) / inline (sm+): nav links */}
      <nav className="-mx-1 flex items-center gap-1 sm:mx-0 sm:flex-1">
        {NAV.map((link) => (
          <button
            key={link.to}
            type="button"
            onClick={() => navigate(link.to)}
            className={cn(
              'shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-clay-500/45',
              activeLink === link.to ? 'bg-clay-50 text-ink' : 'text-ink-muted hover:text-ink',
            )}
          >
            {link.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
