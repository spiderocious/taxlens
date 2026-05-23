import { useState } from 'react';

import {
  ProfilePicker,
  Checkbox,
  Switch,
  SegmentedControl,
  type ProfileOption,
} from '@taxlens/ui';

import { PartHeader, Scene } from './preview-canvas.tsx';

const PROFILES: readonly ProfileOption[] = [
  { id: 'salary', title: 'Salary earner', description: 'PAYE deducted by your employer. One income source.' },
  { id: 'freelance', title: 'Freelancer / self-employed', description: 'You invoice clients and manage your own tax.' },
  { id: 'mixed', title: 'Mixed', description: 'A salary plus side income on top.' },
];

const PERIOD = [
  { label: 'Monthly', value: 'mo' as const },
  { label: 'Yearly', value: 'yr' as const },
];
const REGIME = [
  { label: 'Old PITA', value: 'old' as const },
  { label: 'NTA 2025', value: 'new' as const },
];

export function SelectionPart() {
  const [profile, setProfile] = useState('salary');
  const [rent, setRent] = useState(true);
  const [pension, setPension] = useState(true);
  const [nhis, setNhis] = useState(false);
  const [breakdown, setBreakdown] = useState(true);
  const [period, setPeriod] = useState<'mo' | 'yr'>('mo');
  const [regime, setRegime] = useState<'old' | 'new'>('new');

  return (
    <div>
      <PartHeader index="15 / Primitives" title="Selection" tagline="The profile picker · tick, not fill" />

      <Scene label="Scene · choose your profile (drives the form)">
        <ProfilePicker options={PROFILES} value={profile} onChange={setProfile} />
      </Scene>

      <Scene label="Scene · checkboxes — which reliefs apply">
        <div className="grid gap-3.5">
          <Checkbox checked={rent} onChange={setRent} label="I pay rent (eligible for rent relief)" />
          <Checkbox checked={pension} onChange={setPension} label="I contribute to a pension (PFA)" />
          <Checkbox checked={nhis} onChange={setNhis} label="I have NHIS / NHF contributions" />
        </div>
      </Scene>

      <Scene label="Scene · switch & segmented">
        <div className="grid gap-4">
          <Switch
            checked={breakdown}
            onChange={setBreakdown}
            label="Show me the band-by-band breakdown"
          />
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <div className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-overline text-ink-muted">
                Income period
              </div>
              <SegmentedControl options={PERIOD} value={period} onChange={setPeriod} ariaLabel="Income period" />
            </div>
            <div>
              <div className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-overline text-ink-muted">
                Regime
              </div>
              <SegmentedControl options={REGIME} value={regime} onChange={setRegime} ariaLabel="Regime" />
            </div>
          </div>
        </div>
      </Scene>
    </div>
  );
}
