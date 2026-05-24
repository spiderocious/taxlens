import { ROUTES } from '@taxlens/core';
import { AppText, Disclaimer } from '@taxlens/ui';

import { AppShell } from '@shared/ui/app-shell.tsx';

// Module 5 — build rationale: pain identified, scope chosen, what was cut,
// known limitations, what v2 would look like.
export function AboutScreen() {
  return (
    <AppShell activeLink={ROUTES.ABOUT}>
      <main className="grid gap-8 px-5 py-10 sm:px-6 sm:py-12">
        <header>
          <AppText variant="caption">about</AppText>
          <AppText variant="heading-1" className="mt-1">
            Why TaxLens
          </AppText>
        </header>

        <section className="grid gap-2">
          <AppText variant="heading-3">The pain</AppText>
          <AppText variant="body" className="max-w-2xl">
            The Nigeria Tax Act 2025 changed the rules from 1 January 2026 — new bands, a tax-free
            first ₦800,000, the old Consolidated Relief Allowance replaced by rent relief. Most people
            have no idea what it means for their take-home pay.
          </AppText>
        </section>

        <section className="grid gap-2">
          <AppText variant="heading-3">What we built</AppText>
          <AppText variant="body" className="max-w-2xl">
            A single calm tool: put in your income (by hand or from a bank statement), see your exact
            position under the new law, see what changed versus the old regime, and ask plain-English
            questions about your own numbers. Nothing is stored.
          </AppText>
        </section>

        <section className="grid gap-2">
          <AppText variant="heading-3">What we deliberately cut</AppText>
          <AppText variant="body" className="max-w-2xl">
            No accounts, no saved history, no bank-account connections, no VAT or company tax, no
            multi-year projection. v1 does one thing well: your personal income tax for 2026.
          </AppText>
        </section>

        <section className="grid gap-2">
          <AppText variant="heading-3">Known limitations</AppText>
          <AppText variant="body" className="max-w-2xl">
            Statement extraction is best-effort and asks you to confirm what counts. Every figure is
            an estimate, not tax advice — for anything complex, talk to a professional.
          </AppText>
        </section>

        <Disclaimer />
      </main>
    </AppShell>
  );
}
