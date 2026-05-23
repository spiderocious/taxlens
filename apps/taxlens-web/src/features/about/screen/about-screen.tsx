import { Link } from 'react-router-dom';

import { ROUTES } from '@taxlens/core';
import { AppText } from '@taxlens/ui';

// Module 5 — build rationale: pain identified, scope chosen, what was cut,
// known limitations, what v2 would look like.
export function AboutScreen() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <AppText variant="caption">module 5 — about</AppText>
      <AppText variant="heading-1" className="mt-2">
        Why TaxLens
      </AppText>
      <AppText variant="body" className="mt-4">
        The build rationale, deliberate scope cuts and known limitations live here.
      </AppText>
      <p className="mt-8 text-sm">
        <Link to={ROUTES.HOME} className="text-clay-700 underline">
          ← back home
        </Link>
      </p>
    </main>
  );
}
