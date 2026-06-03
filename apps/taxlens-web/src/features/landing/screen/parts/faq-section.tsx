import { Repeat } from 'meemaw';

import { AppText } from '@taxlens/ui';

interface QA {
  readonly q: string;
  readonly a: string;
}

// The text here MUST stay in sync with the FAQPage JSON-LD in index.html —
// Google compares them and de-features mismatched FAQs from rich results.
const FAQS: readonly QA[] = [
  {
    q: 'When does the Nigeria Tax Act 2025 take effect?',
    a: 'The Nigeria Tax Act 2025 takes effect on 1 January 2026. Personal income tax for the 2026 tax year is computed under its new bands and reliefs.',
  },
  {
    q: 'What changed under the Nigeria Tax Act 2025?',
    a: 'The first ₦800,000 of taxable income is tax-free, the bands above it are progressive from 15% to 25%, and the old Consolidated Relief Allowance is replaced by a rent relief of 20% of rent paid, capped at ₦500,000. Statutory deductions for pension, NHIS, NHF and life insurance still apply.',
  },
  {
    q: 'Is TaxLens free? Do I need an account?',
    a: 'TaxLens is free, requires no account and stores no personal data. Your figures are used once to compute an estimate and then discarded.',
  },
  {
    q: 'Is the TaxLens estimate tax advice?',
    a: 'No. Every figure is an estimate under the Nigeria Tax Act 2025 and is not tax advice. For complex situations, please consult a registered tax professional.',
  },
  {
    q: 'Can I compute my tax from a bank statement?',
    a: 'Yes. Upload a Nigerian bank statement PDF (3–12 months); TaxLens reads the credits, classifies them as salary, business or transfer, and lets you confirm which count as income before computing your position under the NTA 2025.',
  },
];

export function FaqSection() {
  return (
    <section aria-labelledby="faq-heading" className="grid gap-5">
      <header className="grid gap-1">
        <AppText variant="caption">questions</AppText>
        <h2
          id="faq-heading"
          className="font-serif text-[26px] font-medium tracking-[-0.012em] text-ink sm:text-[30px]"
        >
          Frequently asked
        </h2>
      </header>

      <div className="grid divide-y divide-edge overflow-hidden rounded-card border border-edge bg-paper-sheet">
        <Repeat each={[...FAQS]}>
          {(item) => (
            <details key={item.q} className="group px-5 py-4 sm:px-6">
              <summary
                className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-ink"
              >
                {item.q}
                <span
                  aria-hidden="true"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-edge text-ink-muted transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-[13.5px] leading-[1.65] text-ink-body">{item.a}</p>
            </details>
          )}
        </Repeat>
      </div>
    </section>
  );
}
