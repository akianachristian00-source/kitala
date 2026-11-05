import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient, getMyStore } from '@/lib/supabase/server';
import { signOutAction } from '@/actions/auth';
import { StoreSetupForm } from '@/components/dashboard/store-setup-form';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { Logo } from '@/components/brand/logo';
import { SubscriptionBanner } from '@/components/dashboard/subscription-banner';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) redirect('/login');
  const store = await getMyStore();
  if (!store) {
    return (
      <main className="grid min-h-screen content-center justify-items-center bg-pale px-5 py-10">
        <div className="grid w-full max-w-md gap-6"><Logo /><StoreSetupForm /></div>
      </main>
    );
  }

  const small = 'flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white';
  return (
    <div className="min-h-screen bg-pale/60 text-nuit lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="bg-nuit text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="flex items-center justify-between gap-2 px-4 py-3 lg:block lg:px-6 lg:py-7">
          <div className="min-w-0">
            <Logo light />
            <p className="mt-1 hidden truncate text-sm text-white/60 lg:block">{store.nom}</p>
          </div>
          <div className="flex shrink-0 items-center lg:hidden">
            <Link className={small} href={`/boutique/${store.slug}`} target="_blank">Ma boutique</Link>
            <form action={signOutAction}><button className={small}>Quitter</button></form>
          </div>
        </div>
        <DashboardNav />
        <div className="mt-auto hidden gap-1 border-t border-white/10 p-4 lg:grid">
          <Link className={small} href={`/boutique/${store.slug}`} target="_blank">Voir ma boutique ↗</Link>
          <form action={signOutAction}><button className={`${small} w-full`}>Déconnexion</button></form>
        </div>
      </aside>
      <div className="min-w-0 p-4 lg:p-8"><div className="mx-auto max-w-5xl"><SubscriptionBanner store={store} />{children}</div></div>
    </div>
  );
}
