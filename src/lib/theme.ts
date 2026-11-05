import { z } from 'zod';
import type { CSSProperties } from 'react';

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const FONTS = {
  inter:    { label: 'Inter — neutre',        cssVar: '--font-inter' },
  poppins:  { label: 'Poppins — rond',        cssVar: '--font-poppins' },
  playfair: { label: 'Playfair — élégant',    cssVar: '--font-playfair' },
  dmsans:   { label: 'DM Sans — géométrique', cssVar: '--font-dmsans' },
} as const;

export const CARD_STYLES = { flat: 'Plat', elevated: 'Relief', outlined: 'Contour', soft: 'Teinté' } as const;

export const themeSchema = z.object({
  primary: hex, background: hex, text: hex,
  font: z.enum(['inter', 'poppins', 'playfair', 'dmsans']),
  cardStyle: z.enum(['flat', 'elevated', 'outlined', 'soft']),
  radius: z.number().min(0).max(32),
  heroTitle: z.string().trim().max(80).optional(),
  tagline: z.string().trim().max(100).optional(),
  preset: z.enum(['mode', 'beaute', 'alimentation', 'electronique']).optional(),
});
export type ThemeConfig = z.infer<typeof themeSchema>;

export const DEFAULT_THEME: ThemeConfig = {
  primary: '#F5B921', background: '#FBF7F1', text: '#1B1B1B',
  font: 'poppins', cardStyle: 'elevated', radius: 16,
};

/** Tolérant : un JSONB vide, partiel ou corrompu retombe toujours sur un thème valide. */
export function parseTheme(raw: unknown): ThemeConfig {
  const r = themeSchema.safeParse({ ...DEFAULT_THEME, ...(typeof raw === 'object' && raw ? raw : {}) });
  return r.success ? r.data : DEFAULT_THEME;
}

/** Texte lisible (noir/blanc) sur la couleur principale — contraste WCAG. */
function onColor(h: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#111111' : '#FFFFFF';
}

export function themeToCssVars(t: ThemeConfig): CSSProperties {
  return {
    '--k-primary': t.primary, '--k-on-primary': onColor(t.primary), '--k-bg': t.background, '--k-text': t.text,
    '--k-surface': `color-mix(in srgb, ${t.text} 5%, ${t.background})`,
    '--k-tint': `color-mix(in srgb, ${t.primary} 12%, ${t.background})`,
    '--k-line': `color-mix(in srgb, ${t.text} 18%, transparent)`,
    '--k-muted': `color-mix(in srgb, ${t.text} 62%, ${t.background})`,
    '--k-radius': `${t.radius}px`,
    fontFamily: `var(${FONTS[t.font].cssVar}), system-ui, sans-serif`,
  } as CSSProperties;
}

/** Thèmes prêts à l'emploi : un clic règle couleurs, police, style des cartes et arrondi (le titre d'accueil reste inchangé). */
export const THEME_PRESETS: { key: NonNullable<ThemeConfig['preset']>; label: string; hint: string; img: string; tagline: string; theme: Omit<ThemeConfig, 'heroTitle' | 'tagline'> }[] = [
  { key: 'mode', label: 'Mode Wax', hint: 'Robes, pagnes, accessoires', img: '/themes/mode.webp', tagline: 'Élégance wax et moderne, cousue avec soin',
    theme: { primary: '#F5B921', background: '#FBF7F1', text: '#1B1B1B', font: 'poppins', cardStyle: 'elevated', radius: 16, preset: 'mode' } },
  { key: 'beaute', label: 'Beauté Naturelle', hint: 'Soins, cosmétiques, coiffure', img: '/themes/beaute.webp', tagline: 'Des soins naturels pour une peau qui rayonne',
    theme: { primary: '#E0B040', background: '#FAF6F0', text: '#2A2420', font: 'playfair', cardStyle: 'soft', radius: 14, preset: 'beaute' } },
  { key: 'alimentation', label: 'Alimentation Bissap', hint: 'Pâtisserie, jus, épices', img: '/themes/alimentation.webp', tagline: 'Fait maison, frais et plein de saveurs',
    theme: { primary: '#B4233A', background: '#FFF8F3', text: '#2A1215', font: 'dmsans', cardStyle: 'outlined', radius: 14, preset: 'alimentation' } },
  { key: 'electronique', label: 'Électronique Tech', hint: 'Téléphones, accessoires', img: '/themes/electronique.webp', tagline: 'Téléphones et accessoires de qualité',
    theme: { primary: '#F5B921', background: '#F7F5F2', text: '#13151A', font: 'inter', cardStyle: 'elevated', radius: 10, preset: 'electronique' } },
];
