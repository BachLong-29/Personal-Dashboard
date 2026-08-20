import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        // Google profile picture (payload.picture) saved as the avatar on Google sign-up.
        hostname: '*.googleusercontent.com',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
