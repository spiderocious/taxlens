import { ROUTES } from '@taxlens/core';
import { AppText, Chip } from '@taxlens/ui';

import { AppShell } from '@shared/ui/app-shell.tsx';

import { InputPathCards } from './parts/input-path-cards.tsx';

export function LandingScreen() {
  return (
    <AppShell activeLink={ROUTES.HOME}>
      <main className="flex flex-col gap-10 px-5 py-12 sm:px-6 sm:py-16 lg:gap-14 lg:py-20">
        <header className="flex flex-col items-start gap-4">
          <Chip variant="clay" dot>
            Estimate under NTA 2025
          </Chip>
          <h1 className="font-serif font-medium tracking-display text-ink text-[34px] leading-[1.05] sm:text-[44px] lg:text-[52px]">
            See what you actually pay
            <br className="hidden sm:block" /> under the new tax law.
          </h1>
          <AppText variant="lede" className="max-w-xl">
            Enter your income, get your tax position under the Nigeria Tax Act 2025, and see exactly
            what changed versus the old regime. No account, nothing stored.
          </AppText>
        </header>

        <InputPathCards />

        <p className="text-[12.5px] text-ink-muted">
          Every figure is an estimate under the Nigeria Tax Act 2025 — not tax advice.
        </p>
      </main>
    </AppShell>
  );
}
