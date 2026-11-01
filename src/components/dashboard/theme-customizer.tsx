'use client';
import { useState, useTransition } from 'react';
import { CARD_STYLES, FONTS, DEFAULT_THEME, type ThemeConfig } from '@/lib/theme';
import { saveThemeAction } from '@/actions/store';
import { StorefrontView } from '@/components/storefront/storefront-view';
import type { Product, PublicStore } from '@/types';

export function ThemeCustomizer({ store, products, initial }: { store: Pick<PublicStore, 'id' | 'nom' | 'slug'>; products: Product[]; initial: ThemeConfig }) {
  const [theme, setTheme] = useState<ThemeConfig>(initial);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof ThemeConfig>(k: K, v: ThemeConfig[K]) => { setTheme((t) => ({ ...t, [k]: v })); setStatus(null); };
  const dirty = JSON.stringify(theme) !== JSON.stringify(initial);

  function save() {
    start(async () => { const r = await saveThemeAction(theme); setStatus(r.ok ? 'Modifications publiées' : r.error ?? 'Erreur'); });
  }

  const colors: [keyof ThemeConfig, string][] = [['primary', 'Couleur principale'], ['background', 'Fond'], ['text', 'Texte']];
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      <section className="grid content-start gap-5 rounded-2xl bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold">Personnaliser ma boutique</h1>

        <label className="grid gap-1 text-sm font-medium">Titre d’accueil
          <input className="min-h-12 rounded-lg border px-3 text-base font-normal" maxLength={80} placeholder={store.nom} value={theme.heroTitle ?? ''} onChange={(e) => set('heroTitle', e.target.value)} />
        </label>

        <div className="grid grid-cols-3 gap-3">
          {colors.map(([key, label]) => (
            <label key={key} className="grid gap-1 text-xs font-medium">{label}
              <input type="color" className="h-12 w-full cursor-pointer rounded-lg border" value={theme[key] as string} onChange={(e) => set(key, e.target.value as never)} />
            </label>
          ))}
        </div>

        <label className="grid gap-1 text-sm font-medium">Typographie
          <select className="min-h-12 rounded-lg border bg-white px-3 text-base font-normal" value={theme.font} onChange={(e) => set('font', e.target.value as ThemeConfig['font'])}>
            {Object.entries(FONTS).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}
          </select>
        </label>

        <fieldset className="grid gap-2"><legend className="text-sm font-medium">Style des cartes</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.entries(CARD_STYLES) as [ThemeConfig['cardStyle'], string][]).map(([k, label]) => (
              <button key={k} type="button" aria-pressed={theme.cardStyle === k} onClick={() => set('cardStyle', k)}
                className={`min-h-11 rounded-lg border text-sm ${theme.cardStyle === k ? 'border-emerald-800 bg-emerald-50 font-semibold' : ''}`}>{label}</button>
            ))}
          </div>
        </fieldset>

        <label className="grid gap-1 text-sm font-medium">Arrondi des angles ({theme.radius}px)
          <input type="range" min={0} max={32} value={theme.radius} onChange={(e) => set('radius', Number(e.target.value))} />
        </label>

        <div className="flex items-center gap-3">
          <button onClick={save} disabled={pending || !dirty} className="min-h-12 rounded-lg bg-emerald-800 px-5 font-semibold text-white disabled:opacity-50">{pending ? 'Publication…' : 'Publier'}</button>
          <button onClick={() => { setTheme(DEFAULT_THEME); setStatus(null); }} className="min-h-12 px-3 text-sm underline">Réinitialiser</button>
          {status && <span role="status" className="text-sm text-neutral-700">{status}</span>}
        </div>
      </section>

      {/* Simulateur mobile : réagit instantanément (état local, aucun rechargement) */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="mx-auto h-[720px] w-[360px] max-w-full overflow-hidden rounded-[2.5rem] border-[10px] border-neutral-900 bg-white shadow-xl">
          <StorefrontView store={store} products={products} theme={theme} preview />
        </div>
        <p className="mt-2 text-center text-xs text-neutral-500">Aperçu en direct · le panier est actif, la commande est désactivée</p>
      </aside>
    </div>
  );
}
