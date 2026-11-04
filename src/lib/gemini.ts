import 'server-only';

/** Appel serveur à l'API Gemini. La clé reste dans GEMINI_API_KEY (Vercel), jamais envoyée au navigateur. */
const MODELS = [process.env.GEMINI_MODEL, 'gemini-flash-lite-latest', 'gemini-flash-latest'].filter(Boolean) as string[];

export async function geminiDescribeImage(opts: { image: Uint8Array; mimeType: string; prompt: string }): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY manquante');
  const body = JSON.stringify({
    contents: [{ parts: [
      { text: opts.prompt },
      { inline_data: { mime_type: opts.mimeType, data: Buffer.from(opts.image).toString('base64') } },
    ] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 400 },
  });
  let lastErr = 'inconnue';
  for (const model of MODELS) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body, signal: AbortSignal.timeout(25000),
    });
    if (res.status === 404) { lastErr = `modèle ${model} introuvable`; continue; } // essaie le modèle suivant
    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim();
    if (!text) throw new Error('Réponse vide');
    return text;
  }
  throw new Error(lastErr);
}
