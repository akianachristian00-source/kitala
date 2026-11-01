import { formatFCFA, toWaNumber } from './utils';

type Line = { nom: string; quantite: number; prix_unitaire: number };

export function buildWhatsAppUrl(p: {
  whatsapp: string; orderId: string; boutique: string; lines: Line[]; total: number;
  client: { nom: string; telephone: string; quartier: string };
}) {
  const ref = p.orderId.slice(0, 6).toUpperCase();
  const text = [
    `*Nouvelle commande #${ref}* — ${p.boutique}`,
    '',
    ...p.lines.map((l) => `• ${l.quantite} × ${l.nom} — ${formatFCFA(l.quantite * l.prix_unitaire)}`),
    '',
    `*Total : ${formatFCFA(p.total)}*`,
    '',
    `Client : ${p.client.nom}`,
    `Téléphone : ${p.client.telephone}`,
    `Quartier de livraison : ${p.client.quartier}`,
    '',
    'Paiement : Mobile Money ou à la livraison. Merci de confirmer la disponibilité.',
  ].join('\n');
  return `https://wa.me/${toWaNumber(p.whatsapp)}?text=${encodeURIComponent(text)}`;
}
