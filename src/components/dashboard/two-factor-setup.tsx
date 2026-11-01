'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { authErrorMessage, isSixDigits } from '@/lib/auth-errors';

type View = 'idle' | 'enroll' | 'disable';
const btn = 'min-h-11 rounded-lg px-4 text-sm font-medium disabled:opacity-60';
const codeInput = 'min-h-12 w-full rounded-lg border border-neutral-300 px-3 text-center text-2xl tracking-[0.5em]';

export function TwoFactorSetup({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [view, setView] = useState<View>('idle');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [enroll, setEnroll] = useState<{ factorId: string; qr: string; secret: string } | null>(null);

  const field = { name: 'code', inputMode: 'numeric' as const, pattern: '[0-9]{6}', maxLength: 6, required: true, autoComplete: 'one-time-code', autoFocus: true, placeholder: '000000', 'aria-label': 'Code à 6 chiffres' };

  async function startEnroll() {
    setBusy(true); setMsg(null);
    const sb = createClient();
    // Nettoie une activation précédente jamais terminée.
    const { data: lf } = await sb.auth.mfa.listFactors();
    for (const f of lf?.all ?? []) if (f.factor_type === 'totp' && f.status === 'unverified') await sb.auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await sb.auth.mfa.enroll({ factorType: 'totp', issuer: 'Kitala', friendlyName: `Kitala ${Date.now()}` });
    setBusy(false);
    if (error || !data) return setMsg(error ? authErrorMessage(error) : 'Activation impossible. Réessayez.');
    setEnroll({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    setView('enroll');
  }

  async function confirmEnroll(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get('code')).trim();
    if (!enroll) return;
    if (!isSixDigits(code)) return setMsg('Le code contient exactement 6 chiffres.');
    setBusy(true); setMsg(null);
    const { error } = await createClient().auth.mfa.challengeAndVerify({ factorId: enroll.factorId, code });
    setBusy(false);
    if (error) return setMsg(authErrorMessage(error));
    setEnroll(null); setView('idle'); router.refresh();
  }

  async function cancelEnroll() {
    if (enroll) await createClient().auth.mfa.unenroll({ factorId: enroll.factorId });
    setEnroll(null); setView('idle'); setMsg(null);
  }

  async function confirmDisable(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get('code')).trim();
    if (!isSixDigits(code)) return setMsg('Le code contient exactement 6 chiffres.');
    setBusy(true); setMsg(null);
    const sb = createClient();
    const { data: lf } = await sb.auth.mfa.listFactors();
    const factor = lf?.totp?.[0];
    if (!factor) { setBusy(false); router.refresh(); return; }
    // On redemande un code valide avant de désactiver (protège contre un téléphone laissé ouvert).
    const v = await sb.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
    if (v.error) { setBusy(false); return setMsg(authErrorMessage(v.error)); }
    const u = await sb.auth.mfa.unenroll({ factorId: factor.id });
    if (u.error) { setBusy(false); return setMsg(authErrorMessage(u.error)); }
    await sb.auth.refreshSession();
    setBusy(false); setView('idle'); router.refresh();
  }

  return (
    <section className="grid gap-4 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">Double authentification (application)</h2>
        <span className={`rounded-full px-2 py-0.5 text-xs ${enabled ? 'bg-emerald-100 text-emerald-900' : 'bg-neutral-200 text-neutral-700'}`}>{enabled ? 'Activée' : 'Désactivée'}</span>
      </div>

      {view === 'idle' && (
        <>
          <p className="text-sm text-neutral-600">
            {enabled
              ? 'À chaque connexion, un code à 6 chiffres de votre application d’authentification est demandé en plus du mot de passe.'
              : 'Facultatif. Protège vos commandes et les coordonnées de vos clients, même si quelqu’un découvre votre mot de passe.'}
          </p>
          {enabled
            ? <button onClick={() => { setView('disable'); setMsg(null); }} className={`${btn} justify-self-start border border-red-300 text-red-700`}>Désactiver</button>
            : <button onClick={startEnroll} disabled={busy} className={`${btn} justify-self-start bg-neutral-900 text-white`}>{busy ? '…' : 'Activer la double authentification'}</button>}
        </>
      )}

      {view === 'enroll' && enroll && (
        <div className="grid gap-4">
          <ol className="grid list-decimal gap-1 pl-5 text-sm text-neutral-700">
            <li>Installez une application d’authentification (Google Authenticator, Authy, Microsoft Authenticator…).</li>
            <li>Scannez ce QR code, ou saisissez la clé ci-dessous.</li>
            <li>Entrez le code à 6 chiffres affiché pour terminer.</li>
          </ol>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enroll.qr} alt="QR code à scanner avec votre application d’authentification" width={200} height={200} className="justify-self-center rounded-lg border" />
          <div className="rounded-lg bg-neutral-100 p-3 text-sm">
            <p className="text-neutral-600">Clé secrète (si vous ne pouvez pas scanner) :</p>
            <p className="mt-1 break-all font-mono text-base select-all">{enroll.secret}</p>
          </div>
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <strong>Important :</strong> notez cette clé dans un endroit sûr. Si vous perdez votre téléphone sans cette clé, vous ne pourrez plus vous connecter à votre boutique.
          </p>
          <form onSubmit={confirmEnroll} className="grid gap-3">
            <input {...field} className={codeInput} />
            <div className="flex gap-2">
              <button disabled={busy} className={`${btn} flex-1 bg-emerald-800 text-white`}>{busy ? '…' : 'Activer'}</button>
              <button type="button" onClick={cancelEnroll} className={`${btn} border`}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      {view === 'disable' && (
        <form onSubmit={confirmDisable} className="grid gap-3">
          <p className="text-sm text-neutral-700">Pour désactiver, saisissez le code actuel de votre application d’authentification.</p>
          <input {...field} className={codeInput} />
          <div className="flex gap-2">
            <button disabled={busy} className={`${btn} flex-1 bg-red-700 text-white`}>{busy ? '…' : 'Désactiver'}</button>
            <button type="button" onClick={() => { setView('idle'); setMsg(null); }} className={`${btn} border`}>Annuler</button>
          </div>
        </form>
      )}

      {msg && <p role="alert" className="text-sm text-red-700">{msg}</p>}
    </section>
  );
}
