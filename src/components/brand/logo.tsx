/** Logo Kitala : carré rose + mot-symbole. Même dessin que le site vitrine. */
export function Logo({ light = false, className = '' }: { light?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-nuit'} ${className}`}>
      <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-rose">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4v16M18 4L8 12l10 8" /></svg>
      </span>
      kitala
    </span>
  );
}
