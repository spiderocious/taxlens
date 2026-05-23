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
    <div className="flex flex-col rounded-xl border border-teal-900/10 bg-white p-5 shadow-sm">
      <AppText variant="heading-3" className="text-teal-900">
        {title}
      </AppText>
      <AppText variant="body-sm" className="mt-2 flex-1 text-ink-700">
        {body}
      </AppText>
      <Link
        to={to}
        className="mt-4 inline-flex w-fit items-center rounded-md bg-teal-900 px-4 py-2 text-sm font-medium text-paper-50 hover:bg-teal-700"
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
