'use client';
import Image from 'next/image';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { compressImage } from '@/lib/image';
import { formatFCFA } from '@/lib/utils';
import { saveProductAction, deleteProductAction } from '@/actions/products';
import { describeProductAction } from '@/actions/ai';
import type { Product } from '@/types';

type Draft = { id?: string; nom: string; description: string; prix: string; stock: string; image_url: string | null };
const EMPTY: Draft = { nom: '', description: '', prix: '', stock: '1', image_url: null };

export function ProductManager({ userId, products }: { userId: string; products: Product[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();
  const [aiBusy, setAiBusy] = useState(false);
  const input = 'min-h-12 w-full rounded-lg border border-neutral-300 bg-white px-3 text-base';

  async function onFile(file: File | undefined) {
    if (!file || !draft) return;
    setUploading(true); setError(null);
    try {
      const small = await compressImage(file);
      const path = `${userId}/${crypto.randomUUID()}.webp`; // dossier = uid : exigé par la policy Storage
      const sb = createClient();
      const { error } = await sb.storage.from('products').upload(path, small, { contentType: 'image/webp', cacheControl: '31536000' });
      if (error) throw error;
      setDraft({ ...draft, image_url: sb.storage.from('products').getPublicUrl(path).data.publicUrl });
    } catch { setError('Envoi de l’image impossible. Vérifiez votre connexion.'); }
    setUploading(false);
  }

  async function suggest() {
    if (!draft?.image_url) return;
    setAiBusy(true); setError(null);
    const res = await describeProductAction(draft.image_url);
    setAiBusy(false);
    if (!res.ok) return setError(res.error);
    // On ne remplace jamais ce que le marchand a déjà écrit.
    setDraft({ ...draft, nom: draft.nom.trim() ? draft.nom : res.nom, description: draft.description.trim() ? draft.description : res.description });
  }

  function save() {
    if (!draft) return;
    setError(null);
    start(async () => {
      const res = await saveProductAction({
        id: draft.id, nom: draft.nom, description: draft.description, prix: Number(draft.prix), stock: Number(draft.stock), image_url: draft.image_url,
      });
      if (!res.ok) return setError(res.error);
      setDraft(null); router.refresh();
    });
  }

  function remove(p: Product) {
    if (!confirm(`Supprimer « ${p.nom} » ?`)) return;
    start(async () => { const res = await deleteProductAction(p.id); if (!res.ok) setError(res.error); router.refresh(); });
  }

  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Produits ({products.length})</h1>
        <button onClick={() => setDraft(EMPTY)} className="min-h-11 rounded-lg bg-nuit px-4 text-sm font-semibold text-white">Ajouter un produit</button>
      </div>

      {draft && (
        <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="font-semibold">{draft.id ? 'Modifier le produit' : 'Nouveau produit'}</h2>
          <input className={input} placeholder="Nom du produit" value={draft.nom} onChange={(e) => setDraft({ ...draft, nom: e.target.value })} />
          <textarea className={`${input} py-2`} rows={3} placeholder="Description (matière, taille, couleur…)" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input className={input} type="number" inputMode="numeric" min={0} placeholder="Prix (FCFA)" value={draft.prix} onChange={(e) => setDraft({ ...draft, prix: e.target.value })} />
            <input className={input} type="number" inputMode="numeric" min={0} placeholder="Stock" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: e.target.value })} />
          </div>
          <div className="flex items-center gap-3">
            {draft.image_url && <Image src={draft.image_url} alt="" width={64} height={64} className="size-16 rounded-lg object-cover" />}
            <label className="min-h-11 content-center rounded-lg border border-dashed border-neutral-400 px-4 text-sm">
              {uploading ? 'Envoi…' : draft.image_url ? 'Changer la photo' : 'Ajouter une photo'}
              <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
          </div>
          {draft.image_url && (
            <button type="button" onClick={suggest} disabled={aiBusy || uploading} className="min-h-11 rounded-lg border-2 border-rose px-4 text-sm font-semibold text-rose disabled:opacity-60">
              {aiBusy ? 'Réflexion…' : '✨ Remplir avec l’assistant Kitala'}
            </button>
          )}
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <div className="flex gap-2">
            <button onClick={save} disabled={pending || uploading} className="min-h-12 flex-1 rounded-lg bg-nuit font-semibold text-white disabled:opacity-60">{pending ? 'Enregistrement…' : 'Enregistrer'}</button>
            <button onClick={() => setDraft(null)} className="min-h-12 rounded-lg border px-4">Annuler</button>
          </div>
        </div>
      )}

      {!draft && error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {products.length === 0 && !draft && <p className="rounded-xl bg-white p-8 text-center text-neutral-600">Ajoutez votre premier produit avec une belle photo : c’est lui qui fait vendre.</p>}

      <ul className="grid gap-2">
        {products.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">{p.image_url && <Image src={p.image_url} alt="" fill sizes="64px" className="object-cover" />}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{p.nom}</p>
              <p className="text-sm text-neutral-600">{formatFCFA(p.prix)} · stock {p.stock}</p>
            </div>
            <button className="min-h-11 px-2 text-sm underline" onClick={() => setDraft({ id: p.id, nom: p.nom, description: p.description ?? '', prix: String(p.prix), stock: String(p.stock), image_url: p.image_url })}>Modifier</button>
            <button className="min-h-11 px-2 text-sm text-red-700 underline" onClick={() => remove(p)}>Supprimer</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
