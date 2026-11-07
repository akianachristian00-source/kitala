import { NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/public';
import { QUARTIERS_PAR_DEFAUT, type QuartierGroups } from '@/lib/quartiers';

export const dynamic = 'force-dynamic'; // lue à la demande : pas figée au moment du déploiement
const CACHE = { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' };

export async function GET() {
  try {
    const { data, error } = await createPublicClient().from('quartiers').select('ville,nom').order('ville').order('nom');
    if (error || !data?.length) throw new Error('vide');
    const groups: QuartierGroups = {};
    for (const r of data) (groups[r.ville] ??= []).push(r.nom);
    return NextResponse.json({ groups }, { headers: CACHE });
  } catch {
    return NextResponse.json({ groups: QUARTIERS_PAR_DEFAUT }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
