import { useState } from 'react';

import { InflowsTable, Chip, type InflowRow } from '@taxlens/ui';

import { PartHeader, Scene } from './preview-canvas.tsx';

const ROWS: readonly InflowRow[] = [
  { id: '1', date: '04 Feb 2026', narration: 'SALARY — ACME LTD', amount: '₦540,000', klass: 'salary' },
  { id: '2', date: '04 Mar 2026', narration: 'SALARY — ACME LTD', amount: '₦540,000', klass: 'salary' },
  { id: '3', date: '11 Feb 2026', narration: 'TRF FROM J. OKAFOR — design work', amount: '₦85,000', klass: 'business' },
  { id: '4', date: '19 Feb 2026', narration: 'PAYSTACK PAYOUT', amount: '₦212,500', klass: 'business' },
  { id: '5', date: '22 Feb 2026', narration: 'TRF FROM MUM', amount: '₦40,000', klass: 'transfer' },
  { id: '6', date: '28 Feb 2026', narration: 'UNKNOWN CREDIT — REF 8841', amount: '₦150,000', klass: 'unclassified' },
];

export function TablePart() {
  const [selected, setSelected] = useState<string[]>(['1', '2']);
  const toggle = (id: string): void =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  return (
    <div>
      <PartHeader index="22 / Data" title="Inflows table" tagline="Classify & sum — the sum IS the income figure" />

      <Scene label="Scene · filters">
        <div className="flex flex-wrap gap-2.5">
          <Chip variant="paper">All 142</Chip>
          <Chip variant="clay">Salary · 6</Chip>
          <Chip variant="info">Business · 23</Chip>
          <Chip variant="paper">Transfers · 110</Chip>
          <Chip variant="warn" dot>
            Unclassified · 3
          </Chip>
        </div>
      </Scene>

      <Scene label="Scene · the worklist (multi-select, running total)">
        <InflowsTable rows={ROWS} selectedIds={selected} onToggle={toggle} total="₦6,480,000" />
      </Scene>
    </div>
  );
}
