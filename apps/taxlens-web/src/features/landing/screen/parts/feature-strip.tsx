import { IconBands, IconRate, IconStatement } from '@icons';

interface FeatureProps {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly body: string;
}

function Feature({ icon, title, body }: FeatureProps) {
  return (
    <div className="grid gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-ctrl bg-clay-50 text-clay-700">
        {icon}
      </span>
      <h3 className="font-sans text-base font-semibold text-ink">{title}</h3>
      <p className="text-[13.5px] leading-[1.6] text-ink-body">{body}</p>
    </div>
  );
}

/**
 * The "what TaxLens actually does" trio on the landing page. Drives SEO weight
 * on the high-intent keywords (NTA 2025, PAYE 2026, old-vs-new, statement upload)
 * by phrasing them naturally in the body copy.
 */
export function FeatureStrip() {
  return (
    <section
      aria-labelledby="features-heading"
      className="grid gap-6 border-y border-edge py-10 sm:grid-cols-3 sm:py-12"
    >
      <h2 id="features-heading" className="sr-only">
        What TaxLens does
      </h2>

      <Feature
        icon={<IconBands size={19} aria-hidden="true" />}
        title="Calculate your 2026 PAYE"
        body="Estimate your personal income tax under the Nigeria Tax Act 2025 — band by band, with every relief shown line by line."
      />
      <Feature
        icon={<IconRate size={19} aria-hidden="true" />}
        title="Compare old vs new"
        body="See exactly what changed: the new NTA 2025 bands versus the pre-2026 PITA regime, with a plain-English line that says you save or pay more."
      />
      <Feature
        icon={<IconStatement size={19} aria-hidden="true" />}
        title="Read your bank statement"
        body="Upload a Nigerian bank statement PDF. TaxLens classifies your credits — salary, business or transfer — and lets you confirm what counts as income."
      />
    </section>
  );
}
