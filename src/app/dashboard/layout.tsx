import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient, getMyStore } from '@/lib/supabase/server';
import { signOutAction } from '@/actions/auth';
import { StoreSetupForm } from '@/components/dashboard/store-setup-form';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) redirect('/login');
  const store = await getMyStore();
  if (!store) return <main className="mx-auto max-w-md p-6"><StoreSetupForm /></main>;

  const link = 'min-h-11 content-center rounded-lg px-3 text-sm font-medium hover:bg-neutral-100';
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-3 py-1">
          <strong className="mr-3 shrink-0">{store.nom}</strong>
          <Link className={link} href="/dashboard">Commandes</Link>
          <Link className={link} href="/dashboard/produits">Produits</Link>
          <Link className={link} href="/dashboard/personnaliser">Personnaliser</Link>
          <Link className={link} href="/dashboard/securite">Sécurité</Link>
          <Link className={`${link} ml-auto shrink-0`} href={`/boutique/${store.slug}`} target="_blank">Voir ma boutique</Link>
          <form action={signOutAction}><button className={`${link} shrink-0`}>Déconnexion</button></form>
        </div>
      </header>
      <div className="mx-auto max-w-6xl p-4">{children}</div>
    </div>
  );
}
