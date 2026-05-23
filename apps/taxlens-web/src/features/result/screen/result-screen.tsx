import { Link } from 'react-router-dom';

import { ROUTES } from '@taxlens/core';
import { AppText } from '@taxlens/ui';

// Module 2 + 3 — tax position result + "what changed for you". Band breakdown,
// reliefs, comparison and the AI panel land here once income flow is wired.
export function ResultScreen() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <AppText variant="caption">module 2 — your tax position</AppText>
      <AppText variant="heading-1" className="mt-2">
        Your estimate under NTA 2025
      </AppText>
      <AppText variant="body" className="mt-4">
        Liability, effective rate, band breakdown, reliefs and the old-vs-new comparison render here.
      </AppText>
      <p className="mt-8 text-sm text-ink-muted">Estimate under NTA 2025 · Not tax advice.</p>
      <p className="mt-4 text-sm">
        <Link to={ROUTES.HOME} className="text-clay-700 underline">
          ← start over
        </Link>
      </p>
    </main>
  );
}
