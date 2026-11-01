import type { Metadata } from 'next';
import { Inter, Poppins, Playfair_Display, DM_Sans } from 'next/font/google';
import './globals.css';

// Seule la police par défaut est préchargée ; les autres se chargent à la demande (économie de data).
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-poppins', display: 'swap', preload: false });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap', preload: false });
const dmsans = DM_Sans({ subsets: ['latin'], variable: '--font-dmsans', display: 'swap', preload: false });

export const metadata: Metadata = { title: 'Kitala — votre boutique en ligne', description: 'Créez votre boutique et recevez vos commandes sur WhatsApp.' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${poppins.variable} ${playfair.variable} ${dmsans.variable}`}>
      <body className="font-[family-name:var(--font-inter)] antialiased">{children}</body>
    </html>
  );
}
