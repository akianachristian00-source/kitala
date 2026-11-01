# Kitala

## Démarrage
1. `cp .env.example .env.local` et renseigner Supabase + Resend
2. Exécuter `supabase/migrations/0001_init.sql` dans l'éditeur SQL Supabase (ou `supabase db push`)
3. `npm install && npm run dev`
4. Créer un compte sur `/login`, créer la boutique, ajouter des produits, ouvrir `/boutique/<slug>`

## Sécurité (résumé)
- RLS activée partout ; propriétaire vérifié par `owns_store()` (SECURITY DEFINER)
- `email`, `whatsapp`, `user_id` des boutiques jamais lisibles par le public (GRANT par colonne)
- Aucune insertion directe de commande : uniquement `create_order()` (prix et stock recalculés en base, verrouillage `FOR UPDATE`)
- Images : dossier Storage = uid du marchand

## Avant la mise en production
- Limiter le débit de `createOrderAction` (Upstash Ratelimit / Turnstile) contre le spam
- Vérifier un domaine d'envoi Resend (SPF/DKIM)
- Ajouter la mise à jour des statuts de commande et le paiement Mobile Money (MTN MoMo / Airtel Money)
