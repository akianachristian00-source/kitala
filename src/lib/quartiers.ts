export type QuartierGroups = Record<string, string[]>;

/** Liste de secours : utilisée si la table « quartiers » de Supabase est vide ou injoignable. */
export const QUARTIERS_PAR_DEFAUT: QuartierGroups = {
  Brazzaville: ['Centre-ville', 'Plateau', 'Plateau des 15 ans', 'Poto-Poto', 'Moungali', 'Ouenzé', 'Talangaï', 'Bacongo', 'Makélékélé', 'Mfilou', 'Madibou', 'Djiri'],
  'Pointe-Noire': ['Centre-ville', 'Tié-Tié', 'Loandjili', 'Lumumba', 'Mvou-Mvou', 'Mongo-Mpoukou', 'Ngoyo', 'Tchimbamba'],
};

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Retrouve, dans la liste, le quartier qui correspond à un nom détecté par le GPS (accents et tirets ignorés). */
export function matchQuartier(groups: QuartierGroups, detected: string, ville?: string): { ville: string; nom: string } | null {
  const d = norm(detected);
  const order = Object.keys(groups).sort((a, b) => (ville && norm(a) === norm(ville) ? -1 : 0) - (ville && norm(b) === norm(ville) ? -1 : 0));
  for (const v of order) for (const nom of groups[v]) if (norm(nom) === d) return { ville: v, nom };
  return null;
}
