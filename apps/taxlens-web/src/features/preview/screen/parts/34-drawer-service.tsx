import { useState } from 'react';

import { AppButton, DrawerService, Field, MoneyField } from '@taxlens/ui';

import { PartHeader, RefRow, Scene } from './preview-canvas.tsx';

/** A custom component passed straight into a service modal as its body. */
function EditIncomeForm() {
  const [value, setValue] = useState('540,000');
  return (
    <Field label="Gross income" help="Enter monthly — we convert." htmlFor="svc-income">
      <MoneyField id="svc-income" per="/mo" value={value} onChange={(e) => setValue(e.target.value)} />
    </Field>
  );
}

export function DrawerServicePart() {
  return (
    <div>
      <PartHeader
        index="34 / Overlay"
        title="Drawer service"
        tagline="Imperative toasts & modals — call DrawerService from anywhere"
      />

      <Scene label="Scene · toasts by type (auto-dismiss; error is sticky)">
        <RefRow label="success">
          <AppButton size="sm" onClick={() => DrawerService.success('Result downloaded — TaxLens-2026.pdf')}>
            Show success
          </AppButton>
        </RefRow>
        <RefRow label="info">
          <AppButton size="sm" variant="secondary" onClick={() => DrawerService.info('Switched to yearly — figures converted')}>
            Show info
          </AppButton>
        </RefRow>
        <RefRow label="warning">
          <AppButton size="sm" variant="secondary" onClick={() => DrawerService.warning('3 credits are still unclassified')}>
            Show warning
          </AppButton>
        </RefRow>
        <RefRow label="error (sticky)">
          <AppButton size="sm" variant="danger" onClick={() => DrawerService.error('We couldn’t read that PDF')}>
            Show error
          </AppButton>
        </RefRow>
        <RefRow label="with undo">
          <AppButton
            size="sm"
            variant="ghost"
            onClick={() =>
              DrawerService.toast('3 credits reclassified as business income', {
                onUndo: () => DrawerService.info('Reverted'),
              })
            }
          >
            Toast with undo
          </AppButton>
        </RefRow>
      </Scene>

      <Scene label="Scene · custom modal — pass any component as the body">
        <RefRow label="custom body + confirm">
          <AppButton
            size="sm"
            onClick={() =>
              DrawerService.showModal({
                title: 'Edit income',
                subtitle: 'We’ll recompute your position when you save.',
                body: <EditIncomeForm />,
                confirmLabel: 'Save & recompute',
                showConfirmButton: true,
                showCancelButton: true,
                onConfirm: () => DrawerService.success('Income updated — recomputed'),
              })
            }
          >
            Open custom modal
          </AppButton>
        </RefRow>
        <RefRow label="confirm (no ✕, no outside-close)">
          <AppButton
            size="sm"
            variant="secondary"
            onClick={() =>
              DrawerService.confirm({
                title: 'Include these as business income?',
                body: 'We classified 3 credits totalling ₦297,500 as business income.',
                canClose: false,
                clickOutsideClose: false,
                confirmLabel: 'Yes, include them',
                cancelLabel: 'Review again',
                onConfirm: () => DrawerService.success('Included in your computation'),
              })
            }
          >
            Confirm modal
          </AppButton>
        </RefRow>
        <RefRow label="destructive confirm">
          <AppButton
            size="sm"
            variant="danger"
            onClick={() =>
              DrawerService.confirm({
                title: 'Remove this relief?',
                body: 'It will no longer reduce your taxable income.',
                destructive: true,
                confirmLabel: 'Remove relief',
                onConfirm: () => DrawerService.info('Relief removed'),
              })
            }
          >
            Destructive confirm
          </AppButton>
        </RefRow>
        <RefRow label="critical (hold-to-confirm)">
          <AppButton
            size="sm"
            variant="danger"
            onClick={() =>
              DrawerService.critical({
                title: 'Clear all your data and start over?',
                body: 'TaxLens stores nothing on a server, so this permanently removes everything from this session. There is no recovery.',
                criticalHeaderLabel: 'Clear everything — can’t be undone',
                onConfirm: () => DrawerService.success('Cleared — starting over'),
              })
            }
          >
            Critical modal
          </AppButton>
        </RefRow>
      </Scene>
    </div>
  );
}
