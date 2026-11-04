'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { authErrorMessage, isSixDigits } from '@/lib/auth-errors';
import { Logo } from '@/components/brand/logo';

type Step = 'in' | 'up' | 'code' | 'mfa';

const input = 'min-h-12 w-full rounded-xl border-2 border-nuit/15 bg-white px-4 text-base text-nuit outline-none placeholder:text-nuit/40 focus:border-nuit';
const primary = 'min-h-12 rounded-xl bg-nuit px-4 font-display text-lg font-extrabold text-white shadow-[0_4px_0_0_rgba(16,23,63,.35)] active:translate-y-0.5 active:shadow-none disabled:opacity-60';
const accent = 'min-h-12 rounded-xl bg-rose px-4 font-display text-lg font-extrabold text-white shadow-[0_4px_0_0_rgba(16,23,63,.35)] active:translate-y-0.5 active:shadow-none disabled:opacity-60';
const link = 'min-h-11 text-sm font-semibold text-nuit underline decoration-2 underline-offset-4 disabled:no-underline disabled:opacity-60';
const codeInput = `${input} text-center font-display text-3xl tracking-[0.4em]`;

/** Champ mot de passe avec bouton « afficher / masquer » (utile sur téléphone : moins de fautes de frappe). */
function PasswordField({ autoComplete }: { autoComplete: string }) {
  const [shown, setShown] = useState(false);
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-nuit">Mot de passe
      <span className="relative block">
        <input name="password" type={shown ? 'text' : 'password'} required minLength={8} autoComplete={autoComplete} placeholder="8 caractères minimum" className={`${input} pr-14 font-normal`} />
        <button type="button" onClick={() => setShown((s) => !s)} aria-label={shown ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={shown}
          className="absolute inset-y-0 right-0 grid w-12 place-items-center text-nuit/60 hover:text-nuit">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {shown ? <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.8 9.8 0 0112 5c5 0 9 4.5 10 7a11.6 11.6 0 01-3.2 4.2M6.6 6.6A11.7 11.7 0 002 12c1 2.5 5 7 10 7a9.7 9.7 0 004.1-.9" /> : <><path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7S3 14.5 2 12z" /><circle cx="12" cy="12" r="3" /></>}
          </svg>
        </button>
      </span>
    </label>
  );
}

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

  const title = 'font-display text-4xl font-extrabold leading-tight tracking-tight text-nuit';
  const sub = 'text-base text-nuit/70';

  return (
    <main className="min-h-screen bg-pale lg:grid lg:grid-cols-2">
      {/* Photo : visible à partir de la tablette ; sur téléphone on garde la page légère. */}
      <aside className="relative hidden lg:block">
        <Image src="/auth-hero.webp" alt="Une couturière sourit en regardant son téléphone dans son atelier" fill priority sizes="50vw" className="object-cover" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-nuit/85 via-nuit/10 to-transparent" />
        <p className="absolute inset-x-10 bottom-10 font-display text-4xl font-extrabold leading-tight text-white">Ouvrez votre boutique.<br />Recevez vos commandes sur WhatsApp.</p>
      </aside>

      <section className="grid min-h-screen content-center justify-items-center px-5 py-10">
        <div className="grid w-full max-w-sm gap-5">
          <Logo className="mb-2" />

          {(step === 'in' || step === 'up') && (
            <>
              <div>
                <h1 className={title}>{step === 'in' ? 'Bon retour' : 'Créez votre compte'}</h1>
                <p className={`${sub} mt-1`}>{step === 'in' ? 'Connectez-vous à votre compte Kitala.' : 'Ouvrez votre boutique en quelques minutes.'}</p>
              </div>
              <form onSubmit={submitCredentials} className="grid gap-4">
                <label className="grid gap-1.5 text-sm font-semibold text-nuit">E-mail
                  <input name="email" type="email" required autoComplete="email" placeholder="email@exemple.com" className={`${input} font-normal`} />
                </label>
                <PasswordField autoComplete={step === 'in' ? 'current-password' : 'new-password'} />
                <button disabled={busy} className={step === 'in' ? primary : accent}>{busy ? 'Un instant…' : step === 'in' ? 'Se connecter' : 'Créer mon compte'}</button>
              </form>
              <p className="text-center text-sm text-nuit/70">
                {step === 'in' ? 'Pas encore de compte ? ' : 'Déjà un compte ? '}
                <button onClick={() => { setStep(step === 'in' ? 'up' : 'in'); setMsg(null); }} className={link}>{step === 'in' ? 'Inscription' : 'Se connecter'}</button>
              </p>
            </>
          )}

          {step === 'code' && (
            <>
              <div>
                <h1 className={title}>Vérifiez votre e-mail</h1>
                <p className={`${sub} mt-1`}>Saisissez le code à 6 chiffres envoyé à <strong className="text-nuit">{email}</strong>.</p>
              </div>
              <p className="rounded-xl border-2 border-soleil bg-soleil/25 px-4 py-3 text-sm font-semibold text-nuit">Pas de message ? Regardez dans votre dossier spam.</p>
              <form onSubmit={submitEmailCode} className="grid gap-4">
                <input {...codeFieldProps} className={codeInput} />
                <button disabled={busy} className={primary}>{busy ? 'Vérification…' : 'Confirmer'}</button>
              </form>
              <div className="flex flex-wrap items-center justify-between">
                <button onClick={resendCode} disabled={cooldown > 0} className={link}>
                  {cooldown > 0 ? `Renvoyer un code (${cooldown} s)` : 'Renvoyer un code'}
                </button>
                <button onClick={() => { setStep('in'); setMsg(null); }} className={link}>Retour</button>
              </div>
            </>
          )}

          {step === 'mfa' && (
            <>
              <div>
                <h1 className={title}>Vérification en deux étapes</h1>
                <p className={`${sub} mt-1`}>Ouvrez votre application d’authentification (Google Authenticator, Authy…) et saisissez le code à 6 chiffres affiché pour Kitala.</p>
              </div>
              <form onSubmit={submitMfa} className="grid gap-4">
                <input {...codeFieldProps} className={codeInput} />
                <button disabled={busy} className={primary}>{busy ? 'Vérification…' : 'Valider'}</button>
              </form>
              <button onClick={cancelMfa} className={link}>Annuler et me déconnecter</button>
            </>
          )}

          {msg && <p role="alert" className="rounded-xl border-2 border-nuit/15 bg-white px-4 py-3 text-sm text-nuit">{msg}</p>}
        </div>
      </section>
    </main>
  );
}
