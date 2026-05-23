import { Link } from 'react-router-dom';

import { useHealth } from '@taxlens/api';
import { ROUTES } from '@taxlens/core';
import { AppButton, AppText } from '@taxlens/ui';

export function HomeScreen() {
  const { data, isLoading, isError } = useHealth();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <AppText variant="caption">solon · political intelligence</AppText>
      <AppText variant="display-1" className="mt-2 text-forest-900">
        The campaign stack for Nigeria.
      </AppText>
      <AppText variant="body" className="mt-4 max-w-2xl text-charcoal-700">
        Pre-campaign simulation, voter data, agent coordination, finance compliance and an election-day
        war room — in one platform built around Nigerian electoral realities.
      </AppText>

      <div className="mt-8 flex gap-3">
        <Link to={ROUTES.SIMULATOR}>
          <AppButton>Open simulator</AppButton>
        </Link>
        <AppButton variant="secondary" type="button">
          Sign in
        </AppButton>
      </div>

      <section className="mt-12 rounded-lg border border-forest-900/10 bg-white/60 p-4 text-sm">
        <AppText variant="caption">backend health</AppText>
        <div className="mt-2">
          {isLoading && 'Checking…'}
          {isError && <span className="text-orange-600">unreachable — is main-backend running?</span>}
          {data && (
            <span>
              status: <strong>{data.status}</strong>
            </span>
          )}
        </div>
      </section>
    </main>
  );
}
