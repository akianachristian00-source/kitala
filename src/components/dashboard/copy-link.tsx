'use client';
import { useState } from 'react';

/** Copie le lien public de la boutique, ou le partage directement sur WhatsApp. */
export function CopyLink({ slug, nom }: { slug: string; nom: string }) {
  const [copied, setCopied] = useState(false);
  const url = () => `${window.location.origin}/boutique/${slug}`;

  async function copy() {
    try { await navigator.clipboard.writeText(url()); setCopied(true); setTimeout(() => setCopied(false), 2500); }
    catch { window.prompt('Copiez ce lien :', url()); }
  }
  function whatsapp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Découvrez ma boutique ${nom} : ${url()}`)}`, '_blank', 'noopener');
  }

  const btn = 'min-h-11 w-full rounded-xl border-2 border-nuit px-3 font-display text-base font-extrabold text-nuit hover:bg-nuit hover:text-white';
  return (
    <div className="grid gap-2">
      <button type="button" onClick={copy} className={btn} aria-live="polite">{copied ? 'Lien copié ✓' : 'Copier le lien'}</button>
      <button type="button" onClick={whatsapp} className={`${btn} border-feuille text-feuille hover:bg-feuille hover:text-white`}>Partager sur WhatsApp</button>
    </div>
  );
}
