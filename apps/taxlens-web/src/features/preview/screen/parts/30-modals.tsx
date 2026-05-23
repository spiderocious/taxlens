import { useState } from 'react';

import { AppButton, Modal, CriticalModal, HoldToConfirmButton } from '@taxlens/ui';

import { PartHeader, Scene } from './preview-canvas.tsx';

export function ModalsPart() {
  const [confirm, setConfirm] = useState(false);
  const [leave, setLeave] = useState(false);
  const [critical, setCritical] = useState(false);

  return (
    <div>
      <PartHeader index="30 / Overlay" title="Modals" tagline="Gentle confirms · the critical hold-to-confirm" />

      <Scene label="Scene · ordinary confirm">
        <AppButton onClick={() => setConfirm(true)}>Open confirm modal</AppButton>
        <Modal
          open={confirm}
          onClose={() => setConfirm(false)}
          title="Include these as business income?"
          footer={
            <>
              <AppButton variant="ghost" onClick={() => setConfirm(false)}>
                Review again
              </AppButton>
              <AppButton onClick={() => setConfirm(false)}>Yes, include them</AppButton>
            </>
          }
        >
          We classified 3 credits totalling <b className="font-mono">₦297,500</b> as business income.
          They’ll be added to your taxable income.
        </Modal>
      </Scene>

      <Scene label="Scene · soft — leaving with entries">
        <AppButton variant="secondary" onClick={() => setLeave(true)}>
          Open leave modal
        </AppButton>
        <Modal
          open={leave}
          onClose={() => setLeave(false)}
          title="Leave without seeing your result?"
          footer={
            <>
              <AppButton variant="ghost" onClick={() => setLeave(false)}>
                Leave
              </AppButton>
              <AppButton onClick={() => setLeave(false)}>Stay &amp; calculate</AppButton>
            </>
          }
        >
          You’ve entered income but haven’t calculated yet. Nothing is stored, so leaving now discards
          what you typed.
        </Modal>
      </Scene>

      <Scene label="Scene · critical — the one irreversible action">
        <AppButton variant="danger" onClick={() => setCritical(true)}>
          Clear all my data
        </AppButton>
        <CriticalModal
          open={critical}
          onClose={() => setCritical(false)}
          title="Clear all your data and start over?"
          headerLabel="Clear everything — can’t be undone"
          wipeList={[
            'Your entered income and reliefs',
            'The uploaded bank statement and its 142 classified credits',
            'Your computed result and the old-vs-new comparison',
          ]}
          footer={
            <>
              <AppButton variant="secondary" onClick={() => setCritical(false)}>
                Keep my data
              </AppButton>
              <HoldToConfirmButton onConfirm={() => setCritical(false)} />
            </>
          }
        >
          TaxLens stores nothing on a server, so this permanently removes everything from this session.
          There is no recovery. Press and hold the button to confirm.
        </CriticalModal>
      </Scene>
    </div>
  );
}
