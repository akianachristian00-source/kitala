/** Redimensionne + convertit en WebP avant l'envoi : photos de 4 Mo -> ~150 Ko (crucial en 3G/4G). */
export async function compressImage(file: File, maxSide = 1000, quality = 0.82): Promise<File> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob: Blob = await new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Compression impossible'))), 'image/webp', quality));
  return new File([blob], 'image.webp', { type: 'image/webp' });
}
