# Kitala

## Démarrage
1. `cp .env.example .env.local` et renseigner Supabase + Resend
2. Exécuter les fichiers de `supabase/migrations/` dans l'ordre (0001 à 0004) dans l'éditeur SQL Supabase (ou `supabase db push`)
3. `npm install && npm run dev`
4. Créer un compte sur `/login`, créer la boutique, ajouter des produits, ouvrir `/boutique/<slug>`

## Sécurité (résumé)
- RLS activée partout ; propriétaire vérifié par `owns_store()` (SECURITY DEFINER)
- `email`, `whatsapp`, `user_id` des boutiques jamais lisibles par le public (GRANT par colonne)
- Aucune insertion directe de commande : uniquement `create_order()` (prix et stock recalculés en base, verrouillage `FOR UPDATE`)
- Images : dossier Storage = uid du marchand

- Statut des commandes : uniquement via `set_order_status()` (propriétaire vérifié, transitions contrôlées, stock remis en cas d'annulation)

- Connexion : inscription confirmée par un **code à 6 chiffres** envoyé par e-mail (modèle : `supabase/email-templates/confirm-signup.html`)
- **Double authentification (TOTP) facultative** par boutique : activable dans `/dashboard/securite`. Appliquée aussi côté base (`mfa_ok()`, migration 0004) : mot de passe seul = aucun accès aux commandes, produits ni coordonnées.

### Réglages Supabase à faire dans le tableau de bord (non automatisables)
1. Authentication → Sign In / Providers → Email : **Confirm email** activé, longueur du code (OTP length) = 6
2. Authentication → Email Templates → Confirm signup : coller le modèle ci-dessus, objet `Votre code Kitala : {{ .Token }}`
3. Authentication → SMTP Settings : SMTP personnalisé via Resend (`smtp.resend.com`, port 465, utilisateur `resend`, mot de passe = clé API Resend, expéditeur sur un domaine vérifié). Sans cela, Supabase n'envoie qu'aux membres de l'équipe, avec une limite très basse.
4. Authentication → Multi-Factor : TOTP activé (inscription + vérification)

## Avant la mise en production
- Limiter le débit de `createOrderAction` (Upstash Ratelimit / Turnstile) contre le spam
- Vérifier un domaine d'envoi Resend (SPF/DKIM)
- Le paiement se règle directement avec le marchand, via WhatsApp
