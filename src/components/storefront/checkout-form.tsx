'use client';
import { useRef, useState, useTransition } from 'react';
import { createOrderAction } from '@/actions/orders';
import { useCart } from './cart-provider';

export function CheckoutForm({ storeId, slug, onBack }: { storeId: string; slug: string; onBack: () => void }) {
  const { lines, clear } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [geo, setGeo] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const position = useRef<{ lat: number; lng: number } | undefined>(undefined);
  const quartierRef = useRef<HTMLInputElement>(null);

  function locate() {
    if (!('geolocation' in navigator)) { setGeo('error'); setGeoMsg('Votre téléphone ne permet pas la localisation. Tapez votre quartier.'); return; }
    setGeo('loading'); setGeoMsg(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        position.current = { lat, lng };
        try {
          const res = await fetch(`/api/quartier?lat=${lat}&lng=${lng}`);
          const d = (await res.json()) as { quartier?: string; ville?: string; rue?: string };
          if (!res.ok || !d.quartier) throw new Error();
          if (quartierRef.current) quartierRef.current.value = d.rue ? `${d.quartier}, ${d.rue}` : d.quartier;
          setGeo('ok'); setGeoMsg(`Quartier détecté : ${d.quartier}${d.ville ? ` (${d.ville})` : ''}. Corrigez-le si besoin.`);
        } catch {
          setGeo('ok'); setGeoMsg('Position enregistrée, mais le quartier n’a pas été reconnu. Tapez-le ci-dessous.');
        }
      },
      (err) => {
        setGeo('error');
        setGeoMsg(err.code === err.PERMISSION_DENIED ? 'Localisation refusée. Tapez votre quartier.' : 'Position introuvable. Tapez votre quartier.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    start(async () => {
      const res = await createOrderAction({
        storeId, nom: String(fd.get('nom')), telephone: String(fd.get('telephone')), quartier: String(fd.get('quartier')),
        position: position.current,
        items: lines.map((l) => ({ productId: l.productId, quantite: l.quantite })),
      }, slug);
      if (!res.ok) return setError(res.error);
      clear();
      window.location.href = res.whatsappUrl; // ouvre WhatsApp (app mobile ou web) avec le message pré-rempli
    });
  }

  const field = 'min-h-12 w-full rounded-k border border-k-line bg-k-bg px-3 text-base text-k-text placeholder:text-k-muted';
  return (
    <form onSubmit={submit} className="flex flex-col gap-3 p-4">
      <label className="grid gap-1 text-sm text-k-text">Nom complet
        <input name="nom" required minLength={2} autoComplete="name" className={field} placeholder="Ex. Grace Mbemba" /></label>
      <label className="grid gap-1 text-sm text-k-text">Téléphone (WhatsApp de préférence)
        <input name="telephone" required type="tel" inputMode="tel" autoComplete="tel" className={field} placeholder="+242 06 123 45 67" /></label>
      <div className="grid gap-1 text-sm text-k-text">
        <label htmlFor="quartier">Quartier de livraison</label>
        <input id="quartier" ref={quartierRef} name="quartier" required minLength={2} className={field} placeholder="Ex. Poto-Poto, près du marché" />
        <button type="button" onClick={locate} disabled={geo === 'loading'} className="min-h-11 rounded-k border border-k-line px-3 text-sm font-semibold text-k-text disabled:opacity-60">
          {geo === 'loading' ? 'Localisation…' : '📍 Utiliser ma position'}
        </button>
        {geoMsg && <p role="status" className={`text-xs ${geo === 'error' ? 'text-red-700' : 'text-k-muted'}`}>{geoMsg}</p>}
      </div>
      {error && <p role="alert" className="rounded-k bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={pending} className="min-h-12 rounded-k bg-k-primary font-semibold text-k-onprimary disabled:opacity-60">
        {pending ? 'Enregistrement…' : 'Commander sur WhatsApp'}
      </button>
      <button type="button" onClick={onBack} className="min-h-11 text-sm text-k-muted underline">Retour au panier</button>
    </form>
  );
}
