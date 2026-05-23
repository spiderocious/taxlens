import { Repeat } from 'meemaw';

import { TAXLENS_COLORS } from '@taxlens/ui';

import { PartHeader, Scene } from './preview-canvas.tsx';

interface Swatch {
  readonly name: string;
  readonly hex: string;
}

function flatten(): Swatch[] {
  const out: Swatch[] = [];
  for (const [scale, shades] of Object.entries(TAXLENS_COLORS)) {
    for (const [shade, hex] of Object.entries(shades)) {
      out.push({ name: `${scale}-${shade}`, hex });
    }
  }
  return out;
}

export function PalettePart() {
  const swatches = flatten();
  return (
    <div>
      <PartHeader index="01 / Foundation" title="Palette" tagline="Tokens from @taxlens/ui theme" />
      <Scene label="Scene · all tokens">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Repeat each={swatches}>
            {(s) => (
              <div key={s.name} className="rounded-lg border border-teal-900/10 p-2">
                <div className="h-12 w-full rounded-md" style={{ background: s.hex }} />
                <div className="mt-2 font-mono text-[11px] text-ink-700">{s.name}</div>
                <div className="font-mono text-[10px] text-slate-500">{s.hex}</div>
              </div>
            )}
          </Repeat>
        </div>
      </Scene>
    </div>
  );
}
