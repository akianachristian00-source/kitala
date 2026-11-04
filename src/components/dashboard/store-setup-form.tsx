'use client';
import { useFormState, useFormStatus } from 'react-dom';
import { createStoreAction } from '@/actions/store';

function Submit() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="min-h-12 rounded-xl bg-rose px-4 font-display text-lg font-extrabold text-white shadow-[0_4px_0_0_rgba(16,23,63,.35)] active:translate-y-0.5 active:shadow-none disabled:opacity-60">{pending ? 'Création…' : 'Créer ma boutique'}</button>;
}

export function StoreSetupForm() {
  const [state, action] = useFormState(createStoreAction, undefined);
  const input = 'min-h-12 w-full rounded-xl border-2 border-nuit/15 bg-white px-4 text-base font-normal text-nuit outline-none placeholder:text-nuit/40 focus:border-nuit';
  const label = 'grid gap-1.5 text-sm font-semibold text-nuit';
  return (
    <form action={action} className="grid gap-4 rounded-2xl border-2 border-nuit bg-white p-6 shadow-[5px_5px_0_0_#10173F]">
      <div>
        <h1 className="font-display text-3xl font-extrabold leading-tight text-nuit">Créez votre boutique</h1>
        <p className="mt-1 text-nuit/70">Quatre informations, et vous êtes prêt à vendre.</p>
      </div>
      <label className={label}>Nom de la boutique
        <input name="nom" required placeholder="Ex. Atelier Grâce" className={input} />
      </label>
      <label className={label}>Adresse de la boutique
        <input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="atelier-grace" className={input} />
        <span className="text-xs font-normal text-nuit/60">Lettres minuscules, chiffres et tirets uniquement. C’est la fin du lien de votre boutique.</span>
      </label>
      <label className={label}>WhatsApp (avec l’indicatif)
        <input name="whatsapp" required inputMode="tel" placeholder="242 06 123 4567" className={input} />
        <span className="text-xs font-normal text-nuit/60">Vos commandes arriveront sur ce numéro.</span>
      </label>
      <label className={label}>E-mail pour les notifications
        <input name="email" type="email" required placeholder="email@exemple.com" className={input} />
      </label>
      {state?.error && <p role="alert" className="rounded-xl border-2 border-rose bg-rose/10 px-4 py-3 text-sm font-semibold text-rose">{state.error}</p>}
      <Submit />
    </form>
  );
}
