import { Resend } from 'resend';
import { formatFCFA, toWaNumber } from './utils';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

// Couleurs de la marque (e-mail : styles en ligne uniquement, compatibles Gmail / Outlook / mobile).
const INK = '#1f2937';
const MUTED = '#6b7280';
const BRAND = '#0f766e';
const LINE = '#e5e7eb';
const BG = '#f3f4f6';

type OrderEmailInput = {
  boutique: string; orderId: string; total: number;
  lines: { nom: string; quantite: number; prix_unitaire: number }[];
  client: { nom: string; telephone: string; quartier: string };
  dashboardUrl: string;
};

/** Construit l'e-mail "Nouvelle commande" (HTML + texte brut). Toutes les données client sont échappées. */
export function renderNewOrderEmail(p: OrderEmailInput) {
  const ref = p.orderId.slice(0, 6).toUpperCase();
  const subject = `Nouvelle commande #${ref} — ${formatFCFA(p.total)}`;
  const preheader = `${p.client.nom} a commandé pour ${formatFCFA(p.total)}. Contactez-le sur WhatsApp pour confirmer.`;
  const phoneDigits = toWaNumber(p.client.telephone);
  const telHref = `tel:+${phoneDigits}`;
  const waHref = `https://wa.me/${phoneDigits}`;

  const rows = p.lines.map((l) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${LINE};font-size:15px;color:${INK};">
            ${esc(l.nom)}<br><span style="font-size:13px;color:${MUTED};">${l.quantite} × ${formatFCFA(l.prix_unitaire)}</span>
          </td>
          <td align="right" style="padding:12px 0;border-bottom:1px solid ${LINE};font-size:15px;color:${INK};white-space:nowrap;vertical-align:top;">${formatFCFA(l.quantite * l.prix_unitaire)}</td>
        </tr>`).join('');

  const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${BG};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

        <tr><td style="padding:0 4px 12px;font-size:20px;font-weight:700;color:${BRAND};letter-spacing:.2px;">Kitala</td></tr>

        <tr><td style="background:#ffffff;border-radius:12px;border:1px solid ${LINE};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

            <tr><td style="padding:28px 28px 8px;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:${BRAND};text-transform:uppercase;letter-spacing:.6px;">Nouvelle commande</p>
              <h1 style="margin:0;font-size:22px;line-height:1.3;color:${INK};">Commande #${ref} pour ${esc(p.boutique)}</h1>
              <p style="margin:8px 0 0;font-size:15px;line-height:1.5;color:${MUTED};">Vous avez reçu une nouvelle commande. Voici les détails.</p>
            </td></tr>

            <tr><td style="padding:12px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${rows}
                <tr>
                  <td style="padding:16px 0 0;font-size:16px;font-weight:700;color:${INK};">Total</td>
                  <td align="right" style="padding:16px 0 0;font-size:18px;font-weight:700;color:${INK};white-space:nowrap;">${formatFCFA(p.total)}</td>
                </tr>
              </table>
            </td></tr>

            <tr><td style="padding:24px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};border-radius:8px;">
                <tr><td style="padding:16px 18px;font-size:15px;line-height:1.6;color:${INK};">
                  <span style="font-size:12px;font-weight:600;color:${MUTED};text-transform:uppercase;letter-spacing:.6px;">Client</span><br>
                  <strong>${esc(p.client.nom)}</strong><br>
                  <a href="${telHref}" style="color:${INK};text-decoration:none;">${esc(p.client.telephone)}</a><br>
                  Quartier : ${esc(p.client.quartier)}
                </td></tr>
              </table>
            </td></tr>

            <tr><td style="padding:24px 28px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                <td style="border-radius:8px;background:${BRAND};">
                  <a href="${waHref}" style="display:inline-block;padding:14px 22px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Écrire au client sur WhatsApp</a>
                </td>
              </tr></table>
              <p style="margin:14px 0 0;font-size:14px;line-height:1.5;">
                <a href="${esc(p.dashboardUrl)}" style="color:${BRAND};font-weight:600;">Voir la commande dans mon tableau de bord</a>
              </p>
            </td></tr>

            <tr><td style="padding:20px 28px 28px;font-size:14px;line-height:1.6;color:${MUTED};">
              Confirmez la disponibilité des articles, puis convenez du paiement et de la livraison directement avec votre client.
            </td></tr>

          </table>
        </td></tr>

        <tr><td style="padding:16px 0 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;">
            <tr><td style="padding:14px 16px;font-size:13px;line-height:1.6;color:#92400e;">
              <strong>Vérifiez votre dossier spam.</strong> Si cet e-mail est arrivé dans vos courriers indésirables, cliquez sur « Ce n’est pas un spam » et ajoutez l’expéditeur à vos contacts. Ainsi, vous ne manquerez aucune commande.
            </td></tr>
          </table>
        </td></tr>

        <tr><td align="center" style="padding:20px 12px 0;font-size:12px;line-height:1.6;color:${MUTED};">
          Cet e-mail vous est envoyé automatiquement par Kitala, car un client a passé commande dans votre boutique.
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `NOUVELLE COMMANDE #${ref} — ${p.boutique}`,
    '',
    ...p.lines.map((l) => `- ${l.quantite} x ${l.nom} : ${formatFCFA(l.quantite * l.prix_unitaire)}`),
    '',
    `TOTAL : ${formatFCFA(p.total)}`,
    '',
    'CLIENT',
    p.client.nom,
    p.client.telephone,
    `Quartier : ${p.client.quartier}`,
    '',
    `Écrire au client sur WhatsApp : ${waHref}`,
    `Voir la commande : ${p.dashboardUrl}`,
    '',
    'Confirmez la disponibilité des articles, puis convenez du paiement et de la livraison directement avec votre client.',
    '',
    'VÉRIFIEZ VOTRE DOSSIER SPAM : si cet e-mail est arrivé dans vos courriers indésirables, cliquez sur « Ce n’est pas un spam » et ajoutez l’expéditeur à vos contacts, pour ne manquer aucune commande.',
  ].join('\n');

  return { subject, html, text };
}

export async function sendNewOrderEmail(p: Omit<OrderEmailInput, 'dashboardUrl'> & { to: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY manquante : e-mail non envoyé');
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kitala-delta.vercel.app').replace(/\/$/, '');
  const { subject, html, text } = renderNewOrderEmail({ ...p, dashboardUrl: `${base}/dashboard` });

  // Client créé à l'envoi (et non à l'import du fichier) : une clé manquante ne casse jamais la page.
  const { error } = await new Resend(key).emails.send({
    from: process.env.RESEND_FROM ?? 'Kitala <onboarding@resend.dev>',
    to: p.to, subject, html, text,
  });
  if (error) throw new Error(error.message);
}
