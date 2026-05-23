import { Link } from 'react-router-dom';

import { ROUTES } from '@taxlens/core';
import { AppText } from '@taxlens/ui';

export function SimulatorScreen() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <AppText variant="caption">module 0 — election simulator</AppText>
      <AppText variant="heading-1" className="mt-2 text-forest-900">
        Pick a race to simulate
      </AppText>
      <AppText variant="body" className="mt-4 text-charcoal-700">
        Choose an office and constituency, model candidate matchups, then layer turnout, defection and
        issue-shock scenarios.
      </AppText>

      <p className="mt-8 text-sm">
        <Link to={ROUTES.HOME} className="text-forest-900 underline">
          ← back home
        </Link>
      </p>
    </main>
  );
}
