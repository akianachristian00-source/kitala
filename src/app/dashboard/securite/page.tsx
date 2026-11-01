import { createClient } from '@/lib/supabase/server';
import { TwoFactorSetup } from '@/components/dashboard/two-factor-setup';

export default async function SecurityPage() {
  const { data } = await createClient().auth.mfa.listFactors();
  const enabled = (data?.totp?.length ?? 0) > 0; // totp = facteurs vérifiés uniquement

  return (
    <section className="grid max-w-xl gap-4">
      <h1 className="text-xl font-semibold">Sécurité</h1>
      <TwoFactorSetup enabled={enabled} />
    </section>
  );
}
