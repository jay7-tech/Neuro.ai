import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Self-contained server bundle for a small Docker image.
  output: 'standalone',
  poweredByHeader: false,
  // Native/Node-only packages stay external to the server bundle.
  serverExternalPackages: ['pg', 'pino', 'bcryptjs', '@genkit-ai/googleai', 'genkit'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
    ],
  },
};

export default nextConfig;
