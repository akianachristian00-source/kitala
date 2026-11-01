/** Messages d'erreur d'authentification en français simple (jamais de texte technique anglais pour le marchand). */
export function authErrorMessage(error: { code?: string; message?: string }): string {
  const code = error.code ?? '';
  const msg = (error.message ?? '').toLowerCase();
  if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) return 'E-mail ou mot de passe incorrect.';
  if (code === 'user_already_exists' || msg.includes('already registered')) return 'Un compte existe déjà avec cet e-mail. Connectez-vous.';
  if (code === 'otp_expired' || msg.includes('expired') || msg.includes('invalid')) return 'Code incorrect ou expiré. Vérifiez le code ou demandez-en un nouveau.';
  if (code === 'mfa_verification_failed' || code === 'mfa_challenge_expired') return 'Code incorrect. Ouvrez votre application d’authentification et saisissez le code actuel.';
  if (code === 'weak_password') return 'Mot de passe trop faible. Utilisez au moins 8 caractères.';
  if (code.includes('rate_limit') || msg.includes('rate limit') || msg.includes('too many')) return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.';
  if (code === 'email_not_confirmed') return 'Votre e-mail n’est pas encore confirmé.';
  return 'Une erreur est survenue. Réessayez dans un instant.';
}

export const isSixDigits = (s: string) => /^[0-9]{6}$/.test(s);
