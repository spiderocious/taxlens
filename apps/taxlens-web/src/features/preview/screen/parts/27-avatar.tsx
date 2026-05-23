import { Repeat } from 'meemaw';

import { Avatar, type AvatarSize } from '@taxlens/ui';

import { PartHeader, RefRow, Scene } from './preview-canvas.tsx';

const SIZES: readonly AvatarSize[] = ['sm', 'md', 'lg'];

export function AvatarPart() {
  return (
    <div>
      <PartHeader index="27 / Data" title="Avatar" tagline="The only avatar — the AI assistant mark" />

      <Scene label="Scene · sizes">
        <Repeat each={[...SIZES]}>
          {(size) => (
            <RefRow key={size} label={size}>
              <Avatar size={size} />
            </RefRow>
          )}
        </Repeat>
      </Scene>

      <Scene label="Scene · in context">
        <div className="flex items-center gap-3">
          <Avatar />
          <span className="text-[13px] text-ink-muted">
            A serif “T” on a clay gradient — calm, never a cartoon face.
          </span>
        </div>
      </Scene>
    </div>
  );
}
