'use server';
import { createClient, getMyStore } from '@/lib/supabase/server';
import { geminiDescribeImage } from '@/lib/gemini';

const DAILY_LIMIT = 20;
type Result = { ok: true; nom: string; description: string } | { ok: false; error: string };

/** Propose un nom et une description de produit à partir de sa photo (déjà envoyée dans NOTRE bucket). */
export async function describeProductAction(imageUrl: string): Promise<Result> {
  const store = await getMyStore();
  if (!store) return { ok: false, error: 'Boutique introuvable' };

  // Anti-SSRF : on ne télécharge que des images de notre propre bucket, dans le dossier du marchand.
  const { data: { user } } = await createClient().auth.getUser();
  const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/products/${user?.id}/`;
  if (!user || !imageUrl.startsWith(prefix)) return { ok: false, error: 'Image non autorisée' };

  const { data: allowed } = await createClient().rpc('ai_take_quota', { p_limit: DAILY_LIMIT });
  if (allowed !== true) return { ok: false, error: `Limite atteinte : ${DAILY_LIMIT} suggestions par jour. Revenez demain.` };

  try {
    const img = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
    const size = Number(img.headers.get('content-length') ?? 0);
    if (!img.ok || size > 4_000_000) throw new Error('image');
    const text = await geminiDescribeImage({
      image: new Uint8Array(await img.arrayBuffer()),
      mimeType: img.headers.get('content-type')?.split(';')[0] || 'image/webp',
      prompt: `Tu aides un commerçant de Brazzaville à vendre en ligne. Regarde la photo du produit et réponds en français, uniquement avec ce format :
NOM: <nom court du produit, 2 à 6 mots>
DESCRIPTION: <2 à 3 phrases simples : ce que c'est, matière, couleur, usage. N'invente ni prix, ni marque, ni taille que tu ne vois pas.>`,
    });
    const nom = /NOM\s*:\s*(.+)/i.exec(text)?.[1]?.trim().slice(0, 120) ?? '';
    const description = /DESCRIPTION\s*:\s*([\s\S]+)/i.exec(text)?.[1]?.trim().slice(0, 600) ?? '';
    if (!nom && !description) return { ok: false, error: 'Aucune suggestion. Écrivez la description vous-même.' };
    return { ok: true, nom, description };
  } catch (e) {
    console.error('[kitala] assistant IA', e instanceof Error ? e.message : e);
    return { ok: false, error: 'L’assistant est indisponible pour le moment. Écrivez la description vous-même.' };
  }
}
