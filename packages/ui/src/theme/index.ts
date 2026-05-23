// TaxLens palette. The PRD asks for colours that are easy to swap, so the
// design system keeps tokens in one place and apps map them into Tailwind.
//   Primary:   Deep Teal (trust, finance, calm)
//   Accent:    Warm Amber (CTAs / highlights only)
//   Positive:  Green  (you save / exempt)
//   Negative:  Red    (you pay more)
//   Neutrals:  Ink, slate, paper
export const TAXLENS_COLORS = {
  teal: {
    900: '#0B3B3C',
    700: '#0F5C5E',
    500: '#159E9C',
  },
  amber: {
    500: '#E0A106',
    600: '#C2870A',
  },
  positive: {
    600: '#1F8A4C',
  },
  negative: {
    600: '#C0392B',
  },
  ink: {
    900: '#14181B',
    700: '#3A4248',
  },
  slate: {
    500: '#6B7780',
  },
  paper: {
    50: '#FBFAF7',
  },
} as const;

export type TaxlensColorScale = keyof typeof TAXLENS_COLORS;

export const FONTS = {
  display: '"Fraunces", Georgia, serif',
  body: '"Inter", system-ui, sans-serif',
} as const;
