'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import { createOrderAction } from '@/actions/orders';
import { formatFCFA } from '@/lib/utils';
import { useCart } from './cart-provider';
import { WhatsAppIcon } from './icons';
import { QUARTIERS_PAR_DEFAUT, matchQuartier, type QuartierGroups } from '@/lib/quartiers';

const AUTRE = '__autre';

export function CheckoutForm({ storeId, slug, onBack }: { storeId: string; slug: string; onBack: () => void }) {
  const { lines, total, clear } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [geo, setGeo] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const position = useRef<{ lat: number; lng: number } | undefined>(undefined);
  const [groups, setGroups] = useState<QuartierGroups>(QUARTIERS_PAR_DEFAUT);
  const [choice, setChoice] = useState(''); // « Ville|Quartier » choisi dans la liste, ou AUTRE
  const [autre, setAutre] = useState('');
  const adresseRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/quartiers').then((r) => r.json()).then((d: { groups?: QuartierGroups }) => { if (d.groups && Object.keys(d.groups).length) setGroups(d.groups); }).catch(() => {});
  }, []);

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
          const m = matchQuartier(groups, d.quartier, d.ville);
          if (m) { setChoice(`${m.ville}|${m.nom}`); setAutre(''); } else { setChoice(AUTRE); setAutre(d.quartier); }
          if (adresseRef.current && d.rue && !adresseRef.current.value) adresseRef.current.value = d.rue;
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
    const quartier = (choice === AUTRE ? autre : choice.split('|')[1] ?? '').trim();
    if (quartier.length < 2) return setError('Choisissez votre quartier dans la liste.');
    const adresse = String(fd.get('adresse')).trim();
    const lieu = (adresse ? `${quartier} — ${adresse}` : quartier).slice(0, 120);
    setError(null);
    start(async () => {
      const res = await createOrderAction({
        storeId, nom: String(fd.get('nom')), telephone: String(fd.get('telephone')), quartier: lieu,
        position: position.current,
        items: lines.map((l) => ({ productId: l.productId, quantite: l.quantite })),
      }, slug);
      if (!res.ok) return setError(res.error);
      clear();
      window.location.href = res.whatsappUrl; // ouvre WhatsApp (app mobile ou web) avec le message pré-rempli
    });
  }

  const field = 'min-h-12 w-full rounded-k border border-k-line bg-white/70 px-3 text-base text-k-text placeholder:text-k-muted outline-none focus:border-k-primary';
  return (
    <form onSubmit={submit} className="flex flex-col gap-3 p-4">
      <label className="grid gap-1 text-sm font-medium text-k-text">Nom complet
        <input name="nom" required minLength={2} autoComplete="name" className={field} placeholder="Ex. Grace Mbemba" /></label>
      <label className="grid gap-1 text-sm font-medium text-k-text">Téléphone WhatsApp
        <input name="telephone" required type="tel" inputMode="tel" autoComplete="tel" className={field} placeholder="+242 06 123 45 67" /></label>
      <div className="grid gap-1 text-sm font-medium text-k-text">
        <label htmlFor="quartier">Quartier de livraison</label>
        <select id="quartier" value={choice} onChange={(e) => setChoice(e.target.value)} required className={field}>
          <option value="" disabled>Choisissez votre quartier</option>
          {Object.entries(groups).map(([ville, noms]) => (
            <optgroup key={ville} label={ville}>{noms.map((n) => <option key={`${ville}|${n}`} value={`${ville}|${n}`}>{n}</option>)}</optgroup>
          ))}
          <option value={AUTRE}>Autre quartier (je le tape)…</option>
        </select>
        {choice === AUTRE && <input value={autre} onChange={(e) => setAutre(e.target.value)} required minLength={2} maxLength={60} autoComplete="off" className={field} placeholder="Écrivez votre quartier" />}
        <button type="button" onClick={locate} disabled={geo === 'loading'} className="min-h-11 rounded-k border border-k-line px-3 text-sm font-semibold text-k-text disabled:opacity-60">
          {geo === 'loading' ? 'Localisation…' : '📍 Utiliser ma position'}
        </button>
        {geoMsg && <p role="status" className={`text-xs font-normal ${geo === 'error' ? 'text-red-700' : 'text-k-muted'}`}>{geoMsg}</p>}
      </div>
      <label className="grid gap-1 text-sm font-medium text-k-text"><span>Adresse précise <span className="font-normal text-k-muted">(facultatif)</span></span>
        <input ref={adresseRef} name="adresse" maxLength={80} className={field} placeholder="Ex. Rue de la Mairie, près du marché, porte bleue" /></label>

      <div className="rounded-k bg-k-tint p-3 text-sm">
        <p className="mb-1 font-semibold">Récapitulatif</p>
        <ul className="grid gap-0.5">
          {lines.map((l) => <li key={l.productId} className="flex justify-between gap-3"><span className="truncate">{l.quantite} × {l.nom}</span><span className="shrink-0 tabular-nums">{formatFCFA(l.prix * l.quantite)}</span></li>)}
        </ul>
        <p className="mt-2 flex justify-between border-t border-k-line pt-2 text-base font-bold"><span>Total</span><span>{formatFCFA(total)}</span></p>
      </div>

      {error && <p role="alert" className="rounded-k bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={pending} className="flex min-h-12 items-center justify-center gap-2 rounded-k bg-k-primary font-semibold text-k-onprimary disabled:opacity-60">
        <WhatsAppIcon /> {pending ? 'Enregistrement…' : 'Commander sur WhatsApp'}
      </button>
      <p className="rounded-k border border-k-line bg-white/50 p-2.5 text-center text-xs text-k-muted">Le paiement se règle directement avec le vendeur sur WhatsApp.</p>
      <button type="button" onClick={onBack} className="min-h-11 text-sm text-k-muted underline">Retour au panier</button>
    </form>
  );
}
