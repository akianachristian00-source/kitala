import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type CookieToSet = { name: string; value: string; options: CookieOptions };

// Ne s'exécute QUE sur /dashboard : les vitrines restent statiques/ISR (ultra-rapides, sans cookies).
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list: CookieToSet[]) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));

  // Double authentification activée par le marchand : mot de passe seul (aal1) = pas d'accès au tableau de bord.
  // (La base de données applique la même règle : voir 0004_mfa_enforcement.sql.)
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
    return NextResponse.redirect(new URL('/login?etape=2fa', request.url));
  }
  return response;
}
export const config = { matcher: ['/dashboard/:path*'] };
