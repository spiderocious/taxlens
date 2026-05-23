import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        teal: { 500: '#159E9C', 700: '#0F5C5E', 900: '#0B3B3C' },
        amber: { 500: '#E0A106', 600: '#C2870A' },
        positive: { 600: '#1F8A4C' },
        negative: { 600: '#C0392B' },
        ink: { 700: '#3A4248', 900: '#14181B' },
        slate: { 500: '#6B7780' },
        paper: { 50: '#FBFAF7' },
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
