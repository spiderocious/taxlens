import { Link } from 'react-router-dom';

import { ROUTES } from '@taxlens/core';
import { AppText } from '@taxlens/ui';

interface PathCardProps {
  readonly title: string;
  readonly body: string;
  readonly to: string;
  readonly cta: string;
}

function PathCard({ title, body, to, cta }: PathCardProps) {
  return (
    <div className="flex flex-col rounded-card border border-edge bg-paper-sheet p-5">
      <AppText variant="heading-3">{title}</AppText>
      <AppText variant="body-sm" className="mt-2 flex-1">
        {body}
      </AppText>
      <Link
        to={to}
        className="mt-4 inline-flex w-fit items-center rounded-ctrl bg-clay-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-clay-600"
      >
        {cta}
      </Link>
    </div>
  );
}

export function InputPathCards() {
  return (
    <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <PathCard
        title="Try with sample data"
        body="See a worked salary-earner or freelancer example with no data entry."
        to={ROUTES.RESULT}
        cta="View sample"
      />
      <PathCard
        title="Enter income manually"
        body="Type your gross income and reliefs to compute your position."
        to={ROUTES.INCOME}
        cta="Enter income"
      />
      <PathCard
        title="Upload bank statement"
        body="Upload a Nigerian bank statement (PDF) and we extract your inflows."
        to={ROUTES.INCOME}
        cta="Upload statement"
      />
    </section>
  );
}
