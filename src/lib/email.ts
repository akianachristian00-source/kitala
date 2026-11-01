import { Resend } from 'resend';
import { formatFCFA } from './utils';

const resend = new Resend(process.env.RESEND_API_KEY);
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export async function sendNewOrderEmail(p: {
  to: string; boutique: string; orderId: string; total: number;
  lines: { nom: string; quantite: number; prix_unitaire: number }[];
  client: { nom: string; telephone: string; quartier: string };
}) {
  const ref = p.orderId.slice(0, 6).toUpperCase();
  const rows = p.lines.map((l) =>
    `<tr><td style="padding:6px 0">${l.quantite} × ${esc(l.nom)}</td><td style="text-align:right">${formatFCFA(l.quantite * l.prix_unitaire)}</td></tr>`).join('');
  // Toutes les données client sont échappées : aucune injection HTML possible dans l'e-mail.
  const html = `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto">
    <h2>Nouvelle commande #${ref}</h2>
    <table width="100%" style="border-collapse:collapse">${rows}
      <tr><td style="border-top:1px solid #ddd;padding-top:8px"><b>Total</b></td>
          <td style="border-top:1px solid #ddd;text-align:right;padding-top:8px"><b>${formatFCFA(p.total)}</b></td></tr></table>
    <p><b>${esc(p.client.nom)}</b><br>${esc(p.client.telephone)}<br>Quartier : ${esc(p.client.quartier)}</p>
    <p style="color:#666;font-size:13px">Le client est redirigé vers votre WhatsApp pour confirmer. Retrouvez la commande dans votre tableau de bord Kitala.</p></div>`;

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'Kitala <onboarding@resend.dev>',
    to: p.to, subject: `Nouvelle commande #${ref} — ${formatFCFA(p.total)}`, html,
  });
  if (error) throw new Error(error.message);
}
