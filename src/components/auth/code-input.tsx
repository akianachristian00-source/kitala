'use client';
import { useRef, useState } from 'react';

/**
 * Saisie d'un code à 6 chiffres en 6 cases : passage automatique à la case suivante, retour arrière,
 * collage du code complet (et remplissage automatique du code reçu par SMS/e-mail sur téléphone).
 * La valeur est exposée dans un champ caché « code » : les formulaires existants la lisent telle quelle.
 */
export function CodeInput({ name = 'code', autoFocus = true }: { name?: string; autoFocus?: boolean }) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const fill = (start: number, text: string) => {
    const clean = text.replace(/\D/g, '');
    if (!clean) return;
    setDigits((d) => { const n = [...d]; [...clean].slice(0, 6 - start).forEach((c, i) => { n[start + i] = c; }); return n; });
    refs.current[Math.min(start + clean.length, 5)]?.focus();
  };

  return (
    <div role="group" aria-label="Code à 6 chiffres" className="grid gap-2">
      <input type="hidden" name={name} value={digits.join('')} />
      <div className="flex justify-between gap-2">
        {digits.map((d, i) => (
          <input key={i} ref={(el) => { refs.current[i] = el; }} value={d} inputMode="numeric" pattern="[0-9]" maxLength={6}
            autoComplete={i === 0 ? 'one-time-code' : 'off'} autoFocus={autoFocus && i === 0} aria-label={`Chiffre ${i + 1} sur 6`}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '');
              if (v.length > 1) return fill(i, v);
              setDigits((x) => { const n = [...x]; n[i] = v; return n; });
              if (v && i < 5) refs.current[i + 1]?.focus();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !digits[i] && i > 0) { setDigits((x) => { const n = [...x]; n[i - 1] = ''; return n; }); refs.current[i - 1]?.focus(); }
              if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
              if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
            }}
            onPaste={(e) => { e.preventDefault(); fill(i, e.clipboardData.getData('text')); }}
            className="h-14 w-full min-w-0 rounded-xl border-2 border-nuit/20 bg-white text-center font-display text-2xl font-extrabold text-nuit outline-none transition focus:-translate-y-0.5 focus:border-rose focus:shadow-[0_6px_0_-2px_rgba(232,49,91,.35)]" />
        ))}
      </div>
    </div>
  );
}
