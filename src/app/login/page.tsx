'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { authErrorMessage, isSixDigits } from '@/lib/auth-errors';

type Step = 'in' | 'up' | 'code' | 'mfa';

const input = 'min-h-12 w-full rounded-lg border border-neutral-300 px-3 text-base';
const primary = 'min-h-12 rounded-lg bg-emerald-800 font-semibold text-white disabled:opacity-60';
const codeInput = `${input} text-center text-2xl tracking-[0.5em]`;

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('in');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const goDashboard = () => { router.replace('/dashboard'); router.refresh(); };

  // Renvoi de code : bouton bloqué 60 s pour éviter l'abus.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Arrivée depuis /dashboard : mot de passe déjà validé, il reste le code de l'application d'authentification.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('etape') !== '2fa') return;
    void startMfa();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Si le marchand a activé la double authentification, demande le code ; sinon entre dans le tableau de bord. */
  async function startMfa() {
    const sb = createClient();
    const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if (!aal || aal.nextLevel !== 'aal2' || aal.currentLevel === 'aal2') return goDashboard();
    const { data: f } = await sb.auth.mfa.listFactors();
    const totp = f?.totp?.[0];
    if (!totp) return goDashboard();
    setFactorId(totp.id); setStep('mfa'); setMsg(null);
  }

  async function submitCredentials(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const creds = { email: String(fd.get('email')).trim(), password: String(fd.get('password')) };
    setBusy(true); setMsg(null); setEmail(creds.email);
    const sb = createClient();

    if (step === 'in') {
      const { error } = await sb.auth.signInWithPassword(creds);
      if (error) {
        setBusy(false);
        if (error.code === 'email_not_confirmed') { // compte créé mais code jamais saisi : on renvoie un code
          await sb.auth.resend({ type: 'signup', email: creds.email });
          setCooldown(60); setStep('code');
          return setMsg('Votre e-mail n’est pas encore confirmé. Nous venons de vous envoyer un nouveau code.');
        }
        return setMsg(authErrorMessage(error));
      }
      await startMfa();
      return setBusy(false);
    }

    const { data, error } = await sb.auth.signUp(creds);
    setBusy(false);
    if (error) return setMsg(authErrorMessage(error));
    // Supabase masque les comptes existants : aucune identité = e-mail déjà utilisé.
    if (data.user && data.user.identities?.length === 0) return setMsg('Un compte existe déjà avec cet e-mail. Connectez-vous.');
    if (data.session) return goDashboard(); // confirmation par e-mail désactivée côté Supabase
    setCooldown(60); setStep('code');
    setMsg(`Un code à 6 chiffres vient d’être envoyé à ${creds.email}.`);
  }

  async function submitEmailCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get('code')).trim();
    if (!isSixDigits(code)) return setMsg('Le code contient exactement 6 chiffres.');
    setBusy(true); setMsg(null);
    const { error } = await createClient().auth.verifyOtp({ email, token: code, type: 'signup' });
    setBusy(false);
    if (error) return setMsg(authErrorMessage(error));
    goDashboard();
  }

  async function resendCode() {
    setMsg(null);
    const { error } = await createClient().auth.resend({ type: 'signup', email });
    if (error) return setMsg(authErrorMessage(error));
    setCooldown(60); setMsg('Nouveau code envoyé. Pensez à vérifier votre dossier spam.');
  }

  async function submitMfa(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get('code')).trim();
    if (!factorId) return;
    if (!isSixDigits(code)) return setMsg('Le code contient exactement 6 chiffres.');
    setBusy(true); setMsg(null);
    const { error } = await createClient().auth.mfa.challengeAndVerify({ factorId, code });
    setBusy(false);
    if (error) return setMsg(authErrorMessage(error));
    goDashboard();
  }

  async function cancelMfa() {
    await createClient().auth.signOut();
    setStep('in'); setFactorId(null); setMsg(null);
  }

  const codeFieldProps = { name: 'code', inputMode: 'numeric' as const, pattern: '[0-9]{6}', maxLength: 6, required: true, autoComplete: 'one-time-code', autoFocus: true, placeholder: '000000', 'aria-label': 'Code à 6 chiffres' };

  return (
    <main className="mx-auto grid min-h-screen max-w-sm content-center gap-4 p-6">
      {(step === 'in' || step === 'up') && (
        <>
          <h1 className="text-2xl font-semibold">{step === 'in' ? 'Connexion à Kitala' : 'Créer votre compte marchand'}</h1>
          <form onSubmit={submitCredentials} className="grid gap-3">
            <input name="email" type="email" required autoComplete="email" placeholder="E-mail" className={input} />
            <input name="password" type="password" required minLength={8} autoComplete={step === 'in' ? 'current-password' : 'new-password'} placeholder="Mot de passe (8 caractères min.)" className={input} />
            <button disabled={busy} className={primary}>{step === 'in' ? 'Se connecter' : 'Créer mon compte'}</button>
          </form>
          <button onClick={() => { setStep(step === 'in' ? 'up' : 'in'); setMsg(null); }} className="min-h-11 text-sm underline">
            {step === 'in' ? 'Pas encore de boutique ? Créer un compte' : 'J’ai déjà un compte'}
          </button>
        </>
      )}

      {step === 'code' && (
        <>
          <h1 className="text-2xl font-semibold">Confirmez votre e-mail</h1>
          <p className="text-sm text-neutral-600">Saisissez le code à 6 chiffres reçu à <strong>{email}</strong>. <strong>Pas de message ? Vérifiez votre dossier spam.</strong></p>
          <form onSubmit={submitEmailCode} className="grid gap-3">
            <input {...codeFieldProps} className={codeInput} />
            <button disabled={busy} className={primary}>Confirmer</button>
          </form>
          <button onClick={resendCode} disabled={cooldown > 0} className="min-h-11 text-sm underline disabled:no-underline disabled:opacity-60">
            {cooldown > 0 ? `Renvoyer un code (${cooldown} s)` : 'Renvoyer un code'}
          </button>
          <button onClick={() => { setStep('in'); setMsg(null); }} className="min-h-11 text-sm underline">Retour</button>
        </>
      )}

      {step === 'mfa' && (
        <>
          <h1 className="text-2xl font-semibold">Vérification en deux étapes</h1>
          <p className="text-sm text-neutral-600">Ouvrez votre application d’authentification (Google Authenticator, Authy…) et saisissez le code à 6 chiffres affiché pour Kitala.</p>
          <form onSubmit={submitMfa} className="grid gap-3">
            <input {...codeFieldProps} className={codeInput} />
            <button disabled={busy} className={primary}>Valider</button>
          </form>
          <button onClick={cancelMfa} className="min-h-11 text-sm underline">Annuler et me déconnecter</button>
        </>
      )}

      {msg && <p role="alert" className="text-sm text-neutral-700">{msg}</p>}
    </main>
  );
}
