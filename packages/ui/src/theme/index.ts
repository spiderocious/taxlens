// TaxLens palette — Soft Scandinavian, clay on paper. Single source of truth;
// apps map these into Tailwind. Mirrors design-system/projects/taxlens/preview/_foundation.css.
//   Accent:   Clay  (the one accent — actions, result bands, focus ring)
//   Save:     Sage  (calm "you save ₦X", never a shouty green)
//   Warn:     Amber (missing info / low confidence)
//   Critical: cold crimson — colder than clay, irreversible action ONLY
//   Info:     dusk slate — statute notes (not Bootstrap blue)
//   Neutrals: warm paper / sheet / edge / ink scale
export const TAXLENS_COLORS = {
  clay: {
    50: '#FAF3EE',
    100: '#F4E7DD',
    200: '#E8C6B2',
    300: '#D89E7E',
    400: '#CE7A50',
    500: '#C2613A',
    600: '#A94F2C',
    700: '#8E4022',
    800: '#6F3119',
    900: '#4E2210',
  },
  paper: { base: '#F6F4EF', deep: '#EEEBE3', sheet: '#FFFFFF' },
  edge: { base: '#E4E0D6', strong: '#D6D1C5', hair: '#E7E3D9' },
  ink: { base: '#1C1B18', body: '#3A3833', muted: '#76726A', faint: '#A8A49B' },
  save: { base: '#4F7A52', bg: '#EEF3EC', edge: '#C7DBC4' },
  warn: { base: '#9A6B16', bg: '#FAF2E0', edge: '#E6D5A6' },
  crit: { base: '#A11212', deep: '#870D0D', bg: '#FBECEA', edge: '#E7B4AE' },
  info: { base: '#3C5C7A', bg: '#ECF0F4', edge: '#BFCDD9' },
} as const;

export type TaxlensColorScale = keyof typeof TAXLENS_COLORS;

export const FONTS = {
  serif: '"Newsreader", Georgia, "Times New Roman", serif', // explainer / AI voice
  sans: '"Inter", system-ui, -apple-system, sans-serif', // chrome
  mono: '"JetBrains Mono", ui-monospace, "SF Mono", monospace', // every ₦ figure
} as const;

export const RADII = {
  sharp: '8px',
  ctrl: '12px',
  card: '18px',
  cardLg: '22px',
  pill: '9999px',
} as const;
