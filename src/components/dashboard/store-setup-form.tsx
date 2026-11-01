'use client';
import { useFormState, useFormStatus } from 'react-dom';
import { createStoreAction } from '@/actions/store';

function Submit() { const { pending } = useFormStatus(); return <button disabled={pending} className="min-h-12 rounded-lg bg-emerald-800 font-semibold text-white disabled:opacity-60">{pending ? 'Création…' : 'Créer ma boutique'}</button>; }

export function StoreSetupForm() {
  const [state, action] = useFormState(createStoreAction, undefined);
  const input = 'min-h-12 w-full rounded-lg border border-neutral-300 px-3 text-base';
  return (
    <form action={action} className="grid gap-3 rounded-2xl bg-white p-5 shadow-sm">
      <h1 className="text-xl font-semibold">Créez votre boutique</h1>
      <input name="nom" required placeholder="Nom de la boutique" className={input} />
      <input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="adresse-boutique (ex. chez-grace)" className={input} />
      <input name="whatsapp" required inputMode="tel" placeholder="WhatsApp avec indicatif (242 06 123 4567)" className={input} />
      <input name="email" type="email" required placeholder="E-mail pour les notifications" className={input} />
      {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      <Submit />
    </form>
  );
}
