import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Détecte le quartier à partir de coordonnées GPS (OpenStreetMap / Nominatim, gratuit, sans clé). */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const lat = Number(sp.get('lat'));
  const lng = Number(sp.get('lng'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: 'Coordonnées invalides' }, { status: 400 });
  }
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=17&addressdetails=1&accept-language=fr&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Kitala/1.0 (kitala-delta.vercel.app)' }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`nominatim ${res.status}`);
    const a = ((await res.json()) as { address?: Record<string, string> }).address ?? {};
    const quartier = a.suburb || a.neighbourhood || a.quarter || a.city_district || a.village || a.town || '';
    const ville = a.city || a.town || a.municipality || a.county || '';
    const rue = a.road || '';
    return NextResponse.json({ quartier, ville, rue });
  } catch {
    return NextResponse.json({ error: 'Détection impossible' }, { status: 502 });
  }
}
