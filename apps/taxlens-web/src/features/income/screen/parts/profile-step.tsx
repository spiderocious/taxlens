import type { ProfileType } from '@taxlens/core';
import { AppText, ProfilePicker, type ProfileOption } from '@taxlens/ui';

const PROFILE_OPTIONS: readonly ProfileOption[] = [
  {
    id: 'salary_earner',
    title: 'Salary earner',
    description: 'You earn a regular salary from an employer.',
  },
  {
    id: 'freelancer',
    title: 'Freelancer / self-employed',
    description: 'You invoice clients or run your own trade.',
  },
  {
    id: 'mixed',
    title: 'Mixed',
    description: 'A salary plus side income.',
  },
];

interface ProfileStepProps {
  readonly value: ProfileType | null;
  readonly onChange: (value: ProfileType) => void;
}

export function ProfileStep({ value, onChange }: ProfileStepProps) {
  return (
    <section className="grid gap-3.5">
      <AppText variant="heading-2">First, what describes you?</AppText>
      <AppText variant="body-sm" className="-mt-1 max-w-xl">
        This decides which income fields we ask for.
      </AppText>
      <ProfilePicker
        options={PROFILE_OPTIONS}
        value={value ?? ''}
        onChange={(id) => onChange(id as ProfileType)}
      />
    </section>
  );
}
