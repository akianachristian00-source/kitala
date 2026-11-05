import Link from 'next/link';

// Positions fixes (pas d'aléatoire : le serveur et le navigateur affichent la même chose).
const PIECES: { dx: number; dy: number; rot: number; c: string; w: number; h: number; r: string; d: number }[] = [
  { dx: -150, dy: -90, rot: -40, c: '#E8315B', w: 18, h: 10, r: '3px', d: 0 }, { dx: 140, dy: -100, rot: 50, c: '#FFC72C', w: 14, h: 14, r: '50%', d: 60 },
  { dx: -110, dy: 70, rot: 80, c: '#19A463', w: 16, h: 9, r: '3px', d: 120 }, { dx: 150, dy: 60, rot: -60, c: '#1D4ED8', w: 12, h: 12, r: '50%', d: 40 },
  { dx: -60, dy: -150, rot: 30, c: '#FFC72C', w: 20, h: 9, r: '3px', d: 90 }, { dx: 70, dy: -140, rot: -25, c: '#E8315B', w: 12, h: 12, r: '50%', d: 20 },
  { dx: -170, dy: -10, rot: 120, c: '#10173F', w: 12, h: 12, r: '50%', d: 150 }, { dx: 175, dy: -20, rot: -110, c: '#19A463', w: 18, h: 10, r: '3px', d: 100 },
  { dx: -30, dy: 130, rot: 70, c: '#E8315B', w: 16, h: 9, r: '3px', d: 70 }, { dx: 40, dy: 125, rot: -70, c: '#FFC72C', w: 14, h: 14, r: '50%', d: 130 },
  { dx: -125, dy: -50, rot: 200, c: '#1D4ED8', w: 18, h: 9, r: '3px', d: 30 }, { dx: 120, dy: 20, rot: 160, c: '#10173F', w: 10, h: 10, r: '50%', d: 80 },
];

/** Écran de félicitations affiché une seule fois, juste après la création de la boutique. */
export function Welcome({ slug, nom }: { slug: string; nom: string }) {
  return (
    <section className="grid justify-items-center gap-5 rounded-3xl border-2 border-nuit bg-white px-6 py-10 text-center shadow-[6px_6px_0_0_#10173F]">
      <div className="relative grid size-44 place-items-center">
        {PIECES.map((p, i) => (
          <span key={i} aria-hidden className="absolute left-1/2 top-1/2 animate-confetti"
            style={{ '--dx': `${p.dx}px`, '--dy': `${p.dy}px`, '--rot': `${p.rot}deg`, width: p.w, height: p.h, background: p.c, borderRadius: p.r, animationDelay: `${p.d + 250}ms` } as React.CSSProperties} />
        ))}
        <span className="relative grid size-28 animate-check place-items-center rounded-full bg-feuille shadow-[0_12px_30px_-10px_#19A463]">
          <svg viewBox="0 0 24 24" className="size-14" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </span>
      </div>
      <div>
        <h1 className="font-display text-4xl font-extrabold leading-tight">Boutique créée avec succès !</h1>
        <p className="mt-2 text-lg text-nuit/70">« {nom} » est prête à recevoir des commandes.</p>
      </div>
      <div className="grid w-full max-w-sm gap-3">
        <Link href="/dashboard/personnaliser" className="grid min-h-12 place-items-center rounded-full bg-soleil px-4 font-display text-lg font-extrabold shadow-[0_4px_0_0_rgba(16,23,63,.35)]">Choisir un thème</Link>
        <Link href={`/boutique/${slug}`} target="_blank" className="grid min-h-12 place-items-center rounded-full border-2 border-nuit/25 px-4 font-display text-lg font-extrabold hover:border-nuit">Voir ma boutique</Link>
        <Link href="/dashboard" className="min-h-11 content-center text-sm font-semibold underline decoration-2 underline-offset-4">Aller à mon tableau de bord</Link>
      </div>
    </section>
  );
}
