import { Link } from 'react-router-dom';

import { ROUTES } from '@taxlens/core';
import { AppText, Chip } from '@taxlens/ui';

import { AppShell } from '@shared/ui/app-shell.tsx';

import { InputPathCards } from './parts/input-path-cards.tsx';
import { FeatureStrip } from './parts/feature-strip.tsx';
import { FaqSection } from './parts/faq-section.tsx';

export function LandingScreen() {
  return (
    <AppShell activeLink={ROUTES.HOME}>
      <main className="flex flex-col gap-12 px-5 py-12 sm:px-6 sm:py-16 lg:gap-16 lg:py-20">
        <header className="flex flex-col items-start gap-4">
          <Chip variant="clay" dot>
            Estimate under NTA 2025 · 2026 tax year
          </Chip>
          <h1 className="font-serif font-medium tracking-display text-ink text-[34px] leading-[1.05] sm:text-[44px] lg:text-[52px]">
            Nigeria Tax Act 2025
            <br className="hidden sm:block" /> calculator for 2026.
          </h1>
          <AppText variant="lede" className="max-w-2xl">
            See your personal income tax under the new Nigeria Tax Act 2025, compare it to the
            pre-2026 PITA regime, and find out exactly what changed for you. Free, no account,
            nothing stored.
          </AppText>
        </header>

        <InputPathCards />

        <FeatureStrip />

        <section
          aria-labelledby="trust-heading"
          className="grid gap-4 rounded-card border border-edge bg-paper-sheet p-6 sm:flex sm:items-center sm:justify-between sm:gap-8"
        >
          <div className="grid gap-2">
            <h2 id="trust-heading" className="font-serif text-[22px] font-medium text-ink">
              Built around the statute, not a guess.
            </h2>
            <p className="max-w-xl text-[13.5px] leading-[1.6] text-ink-body">
              Every band, rate and relief is sourced from the Fourth Schedule of the Nigeria Tax Act
              2025. The calculator is the single source of truth; the assistant only explains figures
              it produced — never invents one.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-[13.5px] font-semibold text-clay-700">
            <Link to={ROUTES.HOW_IT_WORKS} className="underline-offset-4 hover:underline">
              How it works →
            </Link>
            <Link to={ROUTES.ABOUT} className="underline-offset-4 hover:underline">
              About TaxLens →
            </Link>
          </div>
        </section>

        <FaqSection />

        <p className="text-[12.5px] text-ink-muted">
          Every figure is an estimate under the Nigeria Tax Act 2025 — not tax advice. For complex
          situations, please consult a registered tax professional.
        </p>
      </main>
    </AppShell>
  );
}
