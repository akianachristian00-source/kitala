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
});
export type ThemeConfig = z.infer<typeof themeSchema>;

export const DEFAULT_THEME: ThemeConfig = {
  primary: '#0F6B4F', background: '#FFFFFF', text: '#161616',
  font: 'inter', cardStyle: 'flat', radius: 14,
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
