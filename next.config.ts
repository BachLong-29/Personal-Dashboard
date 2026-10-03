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

  /**
   * Let the Expo client call this API from its dev server.
   *
   * A single named origin rather than `*`, and no `Allow-Credentials`: the
   * clients send their token in an Authorization header, so the browser never
   * needs to attach cookies — and a wildcard origin would be refused if it
   * ever did.
   */
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'http://localhost:8081' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
