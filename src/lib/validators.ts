import { z } from 'zod';
import { toWaNumber } from './utils';

export const orderInputSchema = z.object({
  storeId: z.string().uuid(),
  nom: z.string().trim().min(2, 'Entrez votre nom').max(80),
  telephone: z.string().trim().regex(/^\+?[0-9\s().-]{8,18}$/, 'Numéro de téléphone invalide'),
  quartier: z.string().trim().min(2, 'Indiquez votre quartier').max(120),
  position: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).optional(),
  items: z.array(z.object({ productId: z.string().uuid(), quantite: z.number().int().min(1).max(99) })).min(1).max(50),
});
export type OrderInput = z.infer<typeof orderInputSchema>;

export const storeSchema = z.object({
  nom: z.string().trim().min(2).max(80),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Lettres minuscules, chiffres et tirets').min(3).max(40),
  whatsapp: z.string().transform(toWaNumber).pipe(z.string().regex(/^[0-9]{8,15}$/, 'Numéro avec indicatif pays (ex. 242 06 123 4567)')),
  email: z.string().trim().email(),
});

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  nom: z.string().trim().min(2, 'Nom trop court').max(120),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  prix: z.number().int('Prix entier en FCFA').min(0),
  stock: z.number().int().min(0),
  image_url: z.string().url().nullable(),
});
export type ProductInput = z.infer<typeof productSchema>;
