import Link from 'next/link';
import { createClient, getMyStore } from '@/lib/supabase/server';
import { OrdersList } from '@/components/dashboard/orders-list';
import { CopyLink } from '@/components/dashboard/copy-link';
import { Welcome } from '@/components/dashboard/welcome';

function StepCard({ n, done, title, text, color, children }: { n: number; done: boolean; title: string; text: string; color: string; children: React.ReactNode }) {
  return (
    <div className="grid content-start gap-3 rounded-2xl border-2 border-nuit bg-white p-5 shadow-[4px_4px_0_0_#10173F]">
      <div className="flex items-center justify-between">
        <span className={`grid h-10 w-10 place-items-center rounded-full font-display text-lg font-extrabold text-white ${done ? 'bg-feuille' : color}`}>{done ? '✓' : n}</span>
        {done && <span className="rounded-full bg-feuille/15 px-3 py-1 text-xs font-bold text-emerald-900">Fait</span>}
      </div>
      <h3 className="font-display text-xl font-extrabold">{title}</h3>
      <p className="text-sm text-nuit/70">{text}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export default async function DashboardHome({ searchParams }: { searchParams: { bienvenue?: string } }) {
  const store = (await getMyStore())!;
  // Filtre explicite : la lecture des produits actifs est publique, on ne compte que ceux de CETTE boutique.
  const { count } = await createClient().from('products').select('id', { count: 'exact', head: true }).eq('store_id', store.id);
  const hasProducts = (count ?? 0) > 0;
  const themeDone = typeof store.theme_config === 'object' && store.theme_config !== null && Object.keys(store.theme_config).length > 0;
  const today = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeZone: 'Africa/Brazzaville' }).format(new Date());
  const cta = 'grid min-h-11 w-full place-items-center rounded-xl px-3 font-display text-base font-extrabold';

  if (searchParams.bienvenue === '1') return <Welcome slug={store.slug} nom={store.nom} />;

  return (
    <div className="grid gap-8">
      <header>
        <h1 className="font-display text-3xl font-extrabold">Bonjour, {store.nom}</h1>
        <p className="text-nuit/70 first-letter:uppercase">{today}</p>
      </header>

      <section aria-labelledby="guide" className="grid gap-4">
        <div>
          <h2 id="guide" className="font-display text-2xl font-extrabold">Guide de démarrage</h2>
          <p className="text-nuit/70">Trois étapes pour lancer votre boutique.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <StepCard n={1} done={hasProducts} color="bg-rose" title="Ajoutez un produit" text="Photo, prix en FCFA et stock : vos clients pourront commander.">
            <Link href="/dashboard/produits" className={`${cta} ${hasProducts ? 'border-2 border-nuit text-nuit' : 'bg-nuit text-white'}`}>{hasProducts ? 'Gérer mes produits' : 'Commencer'}</Link>
          </StepCard>
          <StepCard n={2} done={themeDone} color="bg-soleil !text-nuit" title="Choisissez un thème" text="Mode, beauté, alimentation ou électronique : un style prêt à l’emploi.">
            <Link href="/dashboard/personnaliser" className={`${cta} ${themeDone ? 'border-2 border-nuit text-nuit' : 'bg-nuit text-white'}`}>Explorer les thèmes</Link>
          </StepCard>
          <StepCard n={3} done={false} color="bg-feuille" title="Partagez votre lien" text="Envoyez votre boutique à vos clients sur WhatsApp et vos réseaux.">
            <CopyLink slug={store.slug} nom={store.nom} />
          </StepCard>
        </div>
      </section>

      <section aria-labelledby="dernieres" className="grid gap-4">
        <div className="flex items-end justify-between gap-3">
          <h2 id="dernieres" className="font-display text-2xl font-extrabold">Dernières commandes</h2>
          <Link href="/dashboard/commandes" className="min-h-11 content-center text-sm font-bold underline decoration-2 underline-offset-4">Voir toutes</Link>
        </div>
        <OrdersList limit={5} />
      </section>
    </div>
  );
}
