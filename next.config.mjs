const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://example.supabase.co').hostname;
/** @type {import('next').NextConfig} */
export default {
  images: { remotePatterns: [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }], formats: ['image/avif', 'image/webp'] },
};
