import type { Config } from 'tailwindcss';

// TaxLens — Soft Scandinavian, clay on paper. Named colours mirror
// packages/ui/src/theme/index.ts (which mirrors the Studio _foundation.css).
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
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
        // `paper.50` kept so legacy `bg-paper-50` keeps resolving (now clay-system).
        paper: { DEFAULT: '#F6F4EF', deep: '#EEEBE3', sheet: '#FFFFFF', 50: '#F6F4EF' },
        edge: { DEFAULT: '#E4E0D6', strong: '#D6D1C5', hair: '#E7E3D9' },
        // `ink.700/900` kept so legacy `text-ink-700/900` keeps resolving.
        ink: { DEFAULT: '#1C1B18', body: '#3A3833', muted: '#76726A', faint: '#A8A49B', 700: '#3A3833', 900: '#1C1B18' },
        save: { DEFAULT: '#4F7A52', bg: '#EEF3EC', edge: '#C7DBC4' },
        warn: { DEFAULT: '#9A6B16', bg: '#FAF2E0', edge: '#E6D5A6' },
        crit: { DEFAULT: '#A11212', deep: '#870D0D', bg: '#FBECEA', edge: '#E7B4AE' },
        info: { DEFAULT: '#3C5C7A', bg: '#ECF0F4', edge: '#BFCDD9' },
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: { card: '18px', 'card-lg': '22px', ctrl: '12px' },
      letterSpacing: { display: '-0.022em', overline: '0.18em', label: '0.12em' },
      boxShadow: {
        pop: '0 14px 36px -18px rgba(28,27,24,0.20), 0 2px 8px -4px rgba(28,27,24,0.08)',
      },
      keyframes: {
        indet: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(320%)' } },
        shimmer: { '0%': { backgroundPosition: '-200px 0' }, '100%': { backgroundPosition: '200px 0' } },
        settle: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: {
        indet: 'indet 1.2s cubic-bezier(0.4,0,0.2,1) infinite',
        shimmer: 'shimmer 1.3s linear infinite',
        settle: 'settle 360ms cubic-bezier(0.16,1,0.3,1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
