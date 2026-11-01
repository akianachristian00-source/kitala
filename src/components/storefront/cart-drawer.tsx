'use client';
import Image from 'next/image';
import { useState } from 'react';
import { cn, formatFCFA } from '@/lib/utils';
import { useCart } from './cart-provider';
import { CheckoutForm } from './checkout-form';

export function CartDrawer({ storeId, slug, preview }: { storeId: string; slug: string; preview: boolean }) {
  const { lines, total, count, open, setOpen, setQty } = useCart();
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const pos = preview ? 'absolute' : 'fixed';

  return (
    <>
      {/* Barre flottante : accès panier à portée de pouce */}
      {count > 0 && !open && (
        <button onClick={() => { setStep('cart'); setOpen(true); }}
          className={cn(pos, 'inset-x-3 bottom-3 z-30 flex min-h-12 items-center justify-between rounded-k bg-k-primary px-4 font-medium text-k-onprimary shadow-lg md:left-auto md:w-80')}>
          <span>Panier · {count} article{count > 1 ? 's' : ''}</span><span>{formatFCFA(total)}</span>
        </button>
      )}

      {open && (
        <div className={cn(pos, 'inset-0 z-40')} role="dialog" aria-modal="true" aria-label="Panier">
          <div className="absolute inset-0 bg-black/45" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[88%] animate-sheet flex-col rounded-t-[var(--k-radius)] bg-k-bg text-k-text md:inset-x-auto md:right-0 md:top-0 md:max-h-full md:w-[420px] md:rounded-none">
            <header className="flex items-center justify-between border-b border-k-line p-4">
              <h2 className="font-semibold">{step === 'cart' ? 'Votre panier' : 'Vos informations'}</h2>
              <button onClick={() => setOpen(false)} aria-label="Fermer" className="size-11 text-2xl leading-none">×</button>
            </header>

            <div className="overflow-y-auto">
              {step === 'cart' ? (
                lines.length === 0 ? <p className="p-8 text-center text-k-muted">Votre panier est vide. Ajoutez un article pour commencer.</p> : (
                  <ul className="divide-y divide-k-line">
                    {lines.map((l) => (
                      <li key={l.productId} className="flex gap-3 p-4">
                        <div className="relative size-16 shrink-0 overflow-hidden rounded-k bg-k-tint">
                          {l.image_url && <Image src={l.image_url} alt="" fill sizes="64px" className="object-cover" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{l.nom}</p>
                          <p className="text-sm text-k-muted">{formatFCFA(l.prix)}</p>
                          <div className="mt-1 inline-flex items-center rounded-k border border-k-line">
                            <button aria-label="Retirer un" className="size-10" onClick={() => setQty(l.productId, l.quantite - 1)}>−</button>
                            <span className="w-8 text-center text-sm tabular-nums">{l.quantite}</span>
                            <button aria-label="Ajouter un" disabled={l.quantite >= l.stock} className="size-10 disabled:opacity-30" onClick={() => setQty(l.productId, l.quantite + 1)}>+</button>
                          </div>
                        </div>
                        <p className="text-sm font-semibold tabular-nums">{formatFCFA(l.prix * l.quantite)}</p>
                      </li>
                    ))}
                  </ul>
                )
              ) : preview ? (
                <p className="p-6 text-center text-sm text-k-muted">Le formulaire de commande est désactivé dans l’aperçu.</p>
              ) : (
                <CheckoutForm storeId={storeId} slug={slug} onBack={() => setStep('cart')} />
              )}
            </div>

            {step === 'cart' && lines.length > 0 && (
              <footer className="border-t border-k-line p-4">
                <div className="mb-3 flex justify-between font-semibold"><span>Total</span><span>{formatFCFA(total)}</span></div>
                <button onClick={() => setStep('checkout')} className="min-h-12 w-full rounded-k bg-k-primary font-semibold text-k-onprimary">Continuer</button>
              </footer>
            )}
          </div>
        </div>
      )}
    </>
  );
}
