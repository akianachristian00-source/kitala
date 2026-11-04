'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/dashboard', label: 'Accueil', exact: true, icon: <path d="M3 11l9-8 9 8M5 10v10h14V10" /> },
  { href: '/dashboard/commandes', label: 'Commandes', icon: <path d="M9 4h6v3H9zM7 5H5v16h14V5h-2M9 12h6M9 16h6" /> },
  { href: '/dashboard/produits', label: 'Produits', icon: <path d="M3 8l9-5 9 5-9 5zM3 8v8l9 5 9-5V8M12 13v8" /> },
  { href: '/dashboard/personnaliser', label: 'Thèmes', icon: <><circle cx="12" cy="12" r="9" /><circle cx="8" cy="10" r="1.2" /><circle cx="12" cy="7.5" r="1.2" /><circle cx="16" cy="10" r="1.2" /><path d="M12 21c-2 0-2-2 0-3s2-3 0-4" /></> },
  { href: '/dashboard/securite', label: 'Sécurité', icon: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /> },
];

/** Menu : défilement horizontal sur téléphone, colonne dans la barre latérale sur ordinateur. */
export function DashboardNav() {
  const path = usePathname();
  return (
    <nav aria-label="Menu du tableau de bord" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:grid lg:overflow-visible lg:px-4 lg:pb-0">
      {ITEMS.map((i) => {
        const active = i.exact ? path === i.href : path.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} aria-current={active ? 'page' : undefined}
            className={`flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${active ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{i.icon}</svg>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
