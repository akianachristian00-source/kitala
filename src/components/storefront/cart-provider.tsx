'use client';
import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';

export type CartLine = { productId: string; nom: string; prix: number; image_url: string | null; stock: number; quantite: number };
type Action =
  | { type: 'hydrate'; lines: CartLine[] }
  | { type: 'add'; line: Omit<CartLine, 'quantite'> }
  | { type: 'qty'; productId: string; quantite: number }
  | { type: 'clear' };

function reducer(state: CartLine[], a: Action): CartLine[] {
  switch (a.type) {
    case 'hydrate': return a.lines;
    case 'clear': return [];
    case 'add': {
      const ex = state.find((l) => l.productId === a.line.productId);
      if (!ex) return a.line.stock > 0 ? [...state, { ...a.line, quantite: 1 }] : state;
      return state.map((l) => (l === ex ? { ...l, quantite: Math.min(l.quantite + 1, l.stock) } : l));
    }
    case 'qty':
      return state.flatMap((l) => (l.productId !== a.productId ? [l] : a.quantite <= 0 ? [] : [{ ...l, quantite: Math.min(a.quantite, l.stock) }]));
  }
}

type Ctx = {
  lines: CartLine[]; count: number; total: number; open: boolean; setOpen: (v: boolean) => void;
  add: (l: Omit<CartLine, 'quantite'>) => void; setQty: (id: string, q: number) => void; clear: () => void;
};
const CartCtx = createContext<Ctx | null>(null);
export const useCart = () => { const c = useContext(CartCtx); if (!c) throw new Error('useCart hors CartProvider'); return c; };

export function CartProvider({ storageKey, persist = true, children }: { storageKey: string; persist?: boolean; children: React.ReactNode }) {
  const [lines, dispatch] = useReducer(reducer, []);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const key = `kitala:cart:${storageKey}`;

  // Hydratation après le premier rendu : le HTML serveur et client restent identiques.
  useEffect(() => {
    if (persist) { try { const raw = localStorage.getItem(key); if (raw) dispatch({ type: 'hydrate', lines: JSON.parse(raw) }); } catch {} }
    setReady(true);
  }, [key, persist]);
  useEffect(() => { if (ready && persist) { try { localStorage.setItem(key, JSON.stringify(lines)); } catch {} } }, [lines, ready, key, persist]);

  const value = useMemo<Ctx>(() => ({
    lines, open, setOpen,
    count: lines.reduce((s, l) => s + l.quantite, 0),
    total: lines.reduce((s, l) => s + l.quantite * l.prix, 0),
    add: (line) => dispatch({ type: 'add', line }),
    setQty: (productId, quantite) => dispatch({ type: 'qty', productId, quantite }),
    clear: () => dispatch({ type: 'clear' }),
  }), [lines, open]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}
