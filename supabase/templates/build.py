# Génère les 6 modèles d'e-mail Supabase de Kitala (HTML compatible e-mail : tableaux, styles en ligne, animations CSS qui se dégradent proprement).
import os
OUT = os.path.dirname(os.path.abspath(__file__))

STYLE = """<style>
@keyframes kRise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
@keyframes kPop{0%{opacity:0;transform:scale(.4) translateY(10px)}70%{transform:scale(1.12)}100%{opacity:1;transform:none}}
@keyframes kPulse{0%,100%{box-shadow:0 0 0 0 rgba(232,49,91,.55)}50%{box-shadow:0 0 0 12px rgba(232,49,91,0)}}
@keyframes kShine{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes kFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes kBar{from{width:0}to{width:100%}}
.k-card{animation:kRise .7s cubic-bezier(.2,.8,.2,1) both}
.k-emoji{animation:kFloat 3s ease-in-out infinite;display:inline-block}
.k-d{animation:kPop .5s cubic-bezier(.2,.9,.3,1.4) both}
.k-btn{animation:kPulse 2.2s ease-out infinite}
.k-shine{background-image:linear-gradient(110deg,rgba(255,255,255,0) 35%,rgba(255,255,255,.45) 50%,rgba(255,255,255,0) 65%);background-size:200% 100%;animation:kShine 2.8s linear infinite}
.k-bar{animation:kBar 1.2s ease-out both}
@media (prefers-reduced-motion:reduce){.k-card,.k-emoji,.k-d,.k-btn,.k-shine,.k-bar{animation:none!important}}
@media (max-width:480px){.k-pad{padding:28px 20px!important}.k-h1{font-size:26px!important}.k-dig{width:42px!important;height:56px!important;font-size:28px!important}}
</style>"""

def digits():
    # {{ .Token }} est remplacé par Supabase : on l'affiche en gros dans un bloc « code » animé.
    return ('<table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:26px auto 6px"><tr><td class="k-d" '
            'style="background:#FFFFFF;border:2px solid #10173F;border-radius:16px;padding:16px 26px;box-shadow:0 6px 0 #E8315B;animation-delay:.35s">'
            '<span style="font-family:\'Courier New\',Courier,monospace;font-size:40px;line-height:44px;font-weight:800;letter-spacing:12px;color:#10173F;padding-left:12px">{{ .Token }}</span>'
            '</td></tr></table>'
            '<p style="margin:12px 0 0;font-size:13px;color:#6B7194;text-align:center">Saisissez ce code dans Kitala.</p>')

def button(url, label):
    return ('<table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:28px auto 6px"><tr>'
            f'<td class="k-btn" style="border-radius:14px;background:#E8315B"><a href="{url}" class="k-shine" '
            'style="display:block;padding:16px 34px;border-radius:14px;font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:800;color:#FFFFFF;text-decoration:none;text-align:center">'
            f'{label} &nbsp;→</a></td></tr></table>')

def page(title, preheader, emoji, h1, intro, body, foot):
    return f"""<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<title>{title}</title>
{STYLE}
</head>
<body style="margin:0;padding:0;background:#EEF0FF;-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#EEF0FF">{preheader}&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF0FF"><tr><td align="center" style="padding:28px 14px">
<table role="presentation" class="k-card" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:24px;overflow:hidden;box-shadow:0 18px 50px rgba(16,23,63,.16)">
  <tr><td style="background:#10173F;background-image:linear-gradient(135deg,#10173F 0%,#232C7A 100%);padding:26px 32px">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="background:#E8315B;border-radius:11px;width:40px;height:40px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:900;color:#fff;line-height:40px">K</td>
      <td style="padding-left:12px;font-family:Arial,Helvetica,sans-serif;font-size:26px;font-weight:800;color:#FFFFFF;letter-spacing:-.5px">kitala</td>
    </tr></table>
  </td></tr>
  <tr><td style="height:5px;background:#FFC72C;line-height:5px;font-size:0"><div class="k-bar" style="height:5px;background:#E8315B;width:100%">&nbsp;</div></td></tr>
  <tr><td class="k-pad" style="padding:38px 36px 30px;font-family:Arial,Helvetica,sans-serif;color:#10173F;text-align:center">
    <div class="k-emoji" style="font-size:54px;line-height:60px">{emoji}</div>
    <h1 class="k-h1" style="margin:14px 0 10px;font-size:30px;line-height:1.2;font-weight:800;color:#10173F">{h1}</h1>
    <p style="margin:0;font-size:16px;line-height:1.6;color:#3B4170">{intro}</p>
    {body}
  </td></tr>
  <tr><td style="padding:0 36px"><div style="height:1px;background:#E3E6FA;line-height:1px;font-size:0">&nbsp;</div></td></tr>
  <tr><td style="padding:20px 36px 30px;font-family:Arial,Helvetica,sans-serif;font-size:12.5px;line-height:1.6;color:#6B7194;text-align:center">
    {foot}<br><span style="color:#8C91B3">Kitala · Votre boutique en ligne, vos commandes sur WhatsApp · Brazzaville</span>
  </td></tr>
</table>
<table role="presentation" width="100%" style="max-width:560px"><tr><td style="padding:16px 8px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:11.5px;color:#8C91B3">Cet e-mail a été envoyé à {{{{ .Email }}}}. Ne le partagez avec personne.</td></tr></table>
</td></tr></table>
</body></html>"""

SAFE = "Si vous n’êtes pas à l’origine de cette demande, ignorez simplement cet e-mail : rien ne changera."

T = {
 'confirm-signup': ('Bienvenue sur Kitala : votre code', 'Votre code de confirmation Kitala : {{ .Token }}', page('Bienvenue sur Kitala',
    'Votre code de confirmation : {{ .Token }}', '🎉', 'Bienvenue sur Kitala !',
    'Plus qu’une étape : confirmez votre adresse e-mail pour ouvrir votre boutique et profiter de vos <strong>7 jours gratuits</strong>.',
    digits() + '<p style="margin:22px 0 0;font-size:13px;color:#6B7194">Ce code expire dans 1 heure.</p>',
    SAFE)),
 'recovery': ('Réinitialisez votre mot de passe Kitala', 'Code de réinitialisation Kitala : {{ .Token }}', page('Mot de passe oublié',
    'Votre code de réinitialisation : {{ .Token }}', '🔑', 'Mot de passe oublié ?',
    'Pas de panique. Saisissez ce code dans Kitala pour choisir un <strong>nouveau mot de passe</strong>.',
    digits() + '<p style="margin:22px 0 0;font-size:13px;color:#6B7194">Ce code expire dans 1 heure.</p>',
    SAFE + ' Votre mot de passe actuel reste valable.')),
 'magic-link': ('Votre code de connexion Kitala', 'Code de connexion Kitala : {{ .Token }}', page('Connexion à Kitala',
    'Votre code de connexion : {{ .Token }}', '✨', 'Connexion à Kitala',
    'Voici votre code à usage unique pour vous connecter à votre tableau de bord.',
    digits(), SAFE)),
 'invite': ('Vous êtes invité sur Kitala', 'Vous avez été invité à rejoindre Kitala', page('Invitation Kitala',
    'Vous avez été invité à rejoindre Kitala', '💌', 'Vous êtes invité !',
    'Quelqu’un vous invite à rejoindre <strong>Kitala</strong>, la plateforme pour vendre en ligne et recevoir ses commandes sur WhatsApp.',
    button('{{ .ConfirmationURL }}', 'Accepter l’invitation') + '<p style="margin:16px 0 0;font-size:12px;color:#8C91B3;word-break:break-all">Ou copiez ce lien : {{ .ConfirmationURL }}</p>',
    'Si cette invitation ne vous concerne pas, ignorez cet e-mail.')),
 'change-email': ('Confirmez votre nouvelle adresse e-mail', 'Confirmez votre nouvelle adresse e-mail Kitala', page('Changement d’adresse e-mail',
    'Confirmez votre nouvelle adresse e-mail', '📬', 'Nouvelle adresse e-mail',
    'Vous avez demandé à remplacer <strong>{{ .Email }}</strong> par <strong>{{ .NewEmail }}</strong>. Confirmez pour valider le changement.',
    button('{{ .ConfirmationURL }}', 'Confirmer le changement') + '<p style="margin:16px 0 0;font-size:12px;color:#8C91B3;word-break:break-all">Ou copiez ce lien : {{ .ConfirmationURL }}</p>',
    SAFE + ' Pensez à changer votre mot de passe si vous avez un doute.')),
 'reauthentication': ('Code de sécurité Kitala', 'Votre code de sécurité Kitala : {{ .Token }}', page('Vérification de sécurité',
    'Votre code de sécurité : {{ .Token }}', '🛡️', 'Vérification de sécurité',
    'Pour protéger votre compte, confirmez cette action avec le code ci-dessous.',
    digits() + '<p style="margin:22px 0 0;font-size:13px;color:#6B7194">Ce code expire rapidement.</p>',
    'Si vous n’avez rien demandé, changez votre mot de passe sans attendre.')),
}
import json
meta = {}
for name, (subject, _pre, html) in T.items():
    open(os.path.join(OUT, f'{name}.html'), 'w', encoding='utf-8').write(html)
    meta[name] = subject
json.dump(meta, open(os.path.join(OUT, 'subjects.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', list(T))
