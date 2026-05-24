import type { TaxBand } from '@taxlens/core';
import type { BandRung } from '@taxlens/ui';

import { bandRatePct, naira } from './format.ts';

/**
 * Map the engine's TaxBand[] into the BandLadder's display rungs. `fill` is the
 * share of the band that the income actually used (0 = never reached). The
 * first band at 0% is the exempt slice; bands with no income are "untouched".
 */
export function bandsToRungs(bands: readonly TaxBand[]): BandRung[] {
  return bands.map((band, i) => {
    const capacity =
      band.upperKobo === null ? band.amountInBandKobo : band.upperKobo - band.lowerKobo;
    const fill = capacity > 0 ? Math.round((band.amountInBandKobo / capacity) * 100) : 0;
    const untouched = band.amountInBandKobo === 0 && band.rate > 0;
    const exempt = band.rate === 0;

    const upperLabel =
      band.upperKobo === null
        ? `above ${naira(band.lowerKobo)}`
        : `${naira(band.lowerKobo)} – ${naira(band.upperKobo)}`;

    return {
      name: exempt ? 'First slice — tax-free' : `Band ${i + 1}`,
      range: upperLabel,
      rate: bandRatePct(band.rate),
      tax: band.amountInBandKobo > 0 || exempt ? naira(band.taxKobo) : '—',
      fill: exempt ? 100 : fill,
      exempt,
      untouched,
    };
  });
}
