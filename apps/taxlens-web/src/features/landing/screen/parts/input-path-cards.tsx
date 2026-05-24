import { useNavigate } from 'react-router-dom';

import { compareRegimes, ROUTES } from '@taxlens/core';
import { cn } from '@taxlens/ui';
import { IconStatement, IconEdit, IconAssist, IconNext } from '@icons';

import { useIncomeContext } from '@features/income/providers/income-provider.tsx';
import { SAMPLE_INCOME } from '@shared/helpers/sample-income.ts';

interface PathCardProps {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly body: string;
  readonly cta: string;
  readonly featured?: boolean;
  readonly onSelect: () => void;
}

function PathCard({ icon, title, body, cta, featured = false, onSelect }: PathCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group flex w-full flex-col items-start gap-3 rounded-card border p-5 text-left transition-all',
        'hover:-translate-y-0.5 hover:shadow-pop focus:outline-none focus-visible:ring-[3px] focus-visible:ring-clay-500/45',
        featured
          ? 'border-clay-200 bg-clay-50'
          : 'border-edge bg-paper-sheet hover:border-ink-muted',
      )}
    >
      <span
        className={cn(
          'grid h-10 w-10 place-items-center rounded-ctrl',
          featured ? 'bg-clay-500 text-white' : 'bg-clay-50 text-clay-700',
        )}
      >
        {icon}
      </span>
      <span className="font-sans text-base font-semibold text-ink">{title}</span>
      <span className="flex-1 text-[13px] leading-[1.55] text-ink-muted">{body}</span>
      <span className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-semibold text-clay-700">
        {cta}
        <IconNext
          size={15}
          aria-hidden="true"
          className="transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </button>
  );
}

export function InputPathCards() {
  const navigate = useNavigate();
  const { setProfileType, setResult } = useIncomeContext();

  function startSample() {
    const input = SAMPLE_INCOME.salary_earner;
    setProfileType(input.profileType);
    setResult({ comparison: compareRegimes(input), source: 'sample' });
    navigate(ROUTES.RESULT);
  }

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <PathCard
        icon={<IconEdit size={19} aria-hidden="true" />}
        title="Enter income manually"
        body="Type your gross income and reliefs to compute your position."
        cta="Enter income"
        featured
        onSelect={() => navigate(`${ROUTES.INCOME}?path=manual`)}
      />
      <PathCard
        icon={<IconStatement size={19} aria-hidden="true" />}
        title="Upload bank statement"
        body="Upload a Nigerian bank statement (PDF) — we extract and classify your inflows."
        cta="Upload statement"
        onSelect={() => navigate(`${ROUTES.INCOME}?path=upload`)}
      />
      <PathCard
        icon={<IconAssist size={19} aria-hidden="true" />}
        title="Try with sample data"
        body="See a worked salary-earner example, no data entry needed."
        cta="View sample"
        onSelect={startSample}
      />
    </section>
  );
}
