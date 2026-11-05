export type PublicStore = { id: string; nom: string; slug: string; theme_config: unknown };
export type Store = PublicStore & { whatsapp: string; email: string; user_id: string; trial_ends_at?: string | null; paid_until?: string | null };
export type Product = {
  id: string; store_id: string; nom: string; description: string | null;
  prix: number; stock: number; image_url: string | null; actif: boolean; created_at: string;
};
export type OrderStatus = 'nouvelle' | 'confirmee' | 'expediee' | 'livree' | 'annulee';
export type Order = {
  id: string; client_nom: string; client_telephone: string; client_quartier: string;
  montant_total: number; statut: OrderStatus; created_at: string;
  order_items: { nom_produit: string; quantite: number }[];
};
