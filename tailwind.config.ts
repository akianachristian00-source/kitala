import type { Config } from 'tailwindcss';

// Toutes les couleurs de la vitrine passent par des variables CSS (--k-*) injectées depuis theme_config.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        k: {
          primary: 'var(--k-primary)', onprimary: 'var(--k-on-primary)', bg: 'var(--k-bg)', text: 'var(--k-text)',
          surface: 'var(--k-surface)', tint: 'var(--k-tint)', line: 'var(--k-line)', muted: 'var(--k-muted)',
        },
      },
      borderRadius: { k: 'var(--k-radius)' },
      keyframes: {
        reveal: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'none' } },
        sheet: { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'none' } },
      },
      animation: { reveal: 'reveal .5s ease-out both', sheet: 'sheet .28s cubic-bezier(.2,.8,.2,1) both' },
    },
  },
  plugins: [],
};
export default config;
