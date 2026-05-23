import { Link } from 'react-router-dom';

import { ROUTES } from '@taxlens/core';
import { AppText } from '@taxlens/ui';

// Module 1 — income input (manual + upload). Form + statement-confirm flow is
// downstream work; this is the routed shell.
export function IncomeScreen() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <AppText variant="caption">module 1 — income input</AppText>
      <AppText variant="heading-1" className="mt-2 text-teal-900">
        Tell us about your income
      </AppText>
      <AppText variant="body" className="mt-4 text-ink-700">
        Manual entry and bank-statement upload land here.
      </AppText>
      <p className="mt-8 text-sm">
        <Link to={ROUTES.HOME} className="text-teal-900 underline">
          ← back
        </Link>
      </p>
    </main>
  );
}
