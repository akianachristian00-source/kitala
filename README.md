# Kitala

## Démarrage
1. `cp .env.example .env.local` et renseigner Supabase + Resend
2. Exécuter les fichiers de `supabase/migrations/` dans l'ordre (0001, 0002, 0003) dans l'éditeur SQL Supabase (ou `supabase db push`)
3. `npm install && npm run dev`
4. Créer un compte sur `/login`, créer la boutique, ajouter des produits, ouvrir `/boutique/<slug>`

## Sécurité (résumé)
- RLS activée partout ; propriétaire vérifié par `owns_store()` (SECURITY DEFINER)
- `email`, `whatsapp`, `user_id` des boutiques jamais lisibles par le public (GRANT par colonne)
- Aucune insertion directe de commande : uniquement `create_order()` (prix et stock recalculés en base, verrouillage `FOR UPDATE`)
- Images : dossier Storage = uid du marchand

- Statut des commandes : uniquement via `set_order_status()` (propriétaire vérifié, transitions contrôlées, stock remis en cas d'annulation)

## Avant la mise en production
- Limiter le débit de `createOrderAction` (Upstash Ratelimit / Turnstile) contre le spam
- Vérifier un domaine d'envoi Resend (SPF/DKIM)
- Le paiement se règle directement avec le marchand, via WhatsApp
