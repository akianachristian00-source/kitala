'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const creds = { email: String(fd.get('email')), password: String(fd.get('password')) };
    setBusy(true); setMsg(null);
    const sb = createClient();
    const { error } = mode === 'in' ? await sb.auth.signInWithPassword(creds) : await sb.auth.signUp(creds);
    setBusy(false);
    if (error) return setMsg(error.message);
    if (mode === 'up') return setMsg('Compte créé. Vérifiez votre e-mail pour confirmer, puis connectez-vous.');
    router.replace('/dashboard'); router.refresh();
  }

  const input = 'min-h-12 w-full rounded-lg border border-neutral-300 px-3 text-base';
  return (
    <main className="mx-auto grid min-h-screen max-w-sm content-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">{mode === 'in' ? 'Connexion à Kitala' : 'Créer votre compte marchand'}</h1>
      <form onSubmit={submit} className="grid gap-3">
        <input name="email" type="email" required autoComplete="email" placeholder="E-mail" className={input} />
        <input name="password" type="password" required minLength={8} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} placeholder="Mot de passe (8 caractères min.)" className={input} />
        <button disabled={busy} className="min-h-12 rounded-lg bg-emerald-800 font-semibold text-white disabled:opacity-60">{mode === 'in' ? 'Se connecter' : 'Créer mon compte'}</button>
      </form>
      {msg && <p role="alert" className="text-sm text-neutral-700">{msg}</p>}
      <button onClick={() => setMode(mode === 'in' ? 'up' : 'in')} className="min-h-11 text-sm underline">
        {mode === 'in' ? 'Pas encore de boutique ? Créer un compte' : 'J’ai déjà un compte'}
      </button>
    </main>
  );
}
