export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/** 15000 -> "15 000 FCFA" (séparateur déterministe : pas de mismatch d'hydratation). */
export const formatFCFA = (n: number) => `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0')}\u00A0FCFA`;

/** "+242 06 123 45 67" / "00242061234567" -> "242061234567" */
export const toWaNumber = (raw: string) => raw.replace(/\D/g, '').replace(/^00/, '');
