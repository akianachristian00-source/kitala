import type { Config } from 'tailwindcss';

// Toutes les couleurs de la vitrine passent par des variables CSS (--k-*) injectées depuis theme_config.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palette de la marque Kitala (identique au site vitrine) : tableau de bord et écrans de connexion.
        nuit: '#10173F', rose: '#E8315B', soleil: '#FFC72C', feuille: '#19A463', pale: '#EEF0FF',
        k: {
          primary: 'var(--k-primary)', onprimary: 'var(--k-on-primary)', bg: 'var(--k-bg)', text: 'var(--k-text)',
          surface: 'var(--k-surface)', tint: 'var(--k-tint)', line: 'var(--k-line)', muted: 'var(--k-muted)',
        },
      },
      fontFamily: { display: ['var(--font-titre)', 'system-ui', 'sans-serif'] },
      borderRadius: { k: 'var(--k-radius)' },
      keyframes: {
        reveal: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'none' } },
        sheet: { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'none' } },
        floaty: { '0%,100%': { transform: 'translateY(0) rotate(-1deg)' }, '50%': { transform: 'translateY(-10px) rotate(1deg)' } },
        pop: { '0%': { transform: 'scale(1)' }, '40%': { transform: 'scale(1.35)' }, '100%': { transform: 'scale(1)' } },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        shine: { '0%': { transform: 'translateX(-120%) skewX(-20deg)' }, '60%,100%': { transform: 'translateX(220%) skewX(-20deg)' } },
        confetti: { '0%': { opacity: '0', transform: 'translate(0,0) rotate(0) scale(.4)' }, '15%': { opacity: '1' }, '100%': { opacity: '1', transform: 'translate(var(--dx), var(--dy)) rotate(var(--rot)) scale(1)' } },
        check: { '0%': { transform: 'scale(0)' }, '70%': { transform: 'scale(1.12)' }, '100%': { transform: 'scale(1)' } },
      },
      animation: {
        reveal: 'reveal .5s ease-out both', sheet: 'sheet .28s cubic-bezier(.2,.8,.2,1) both',
        floaty: 'floaty 6s ease-in-out infinite', pop: 'pop .4s ease-out', fadeIn: 'fadeIn .25s ease-out both',
        shine: 'shine 3.2s ease-in-out infinite', confetti: 'confetti 1.1s cubic-bezier(.2,.8,.2,1) both', check: 'check .6s cubic-bezier(.3,1.4,.5,1) both',
      },
    },
  },
  plugins: [],
};
export default config;
