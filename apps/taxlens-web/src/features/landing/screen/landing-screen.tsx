import { Link } from 'react-router-dom';

import { ROUTES } from '@taxlens/core';
import { AppText } from '@taxlens/ui';

import { InputPathCards } from './parts/input-path-cards.tsx';

export function LandingScreen() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <AppText variant="caption">TaxLens NG · estimate under NTA 2025</AppText>
      <AppText variant="display-1" className="mt-2 text-teal-900">
        See what you actually pay under the new tax law.
      </AppText>
      <AppText variant="body" className="mt-4 max-w-2xl text-ink-700">
        Enter your income, get your tax position under the Nigeria Tax Act 2025, and see exactly what
        changed versus the old regime. Nothing is stored.
      </AppText>

      <InputPathCards />

      <p className="mt-12 text-sm text-slate-500">
        <Link to={ROUTES.HOW_IT_WORKS} className="text-teal-900 underline">
          How this works
        </Link>{' '}
        · Estimate only, not tax advice.
      </p>
    </main>
  );
}
