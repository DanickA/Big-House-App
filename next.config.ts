import type { NextConfig } from 'next';
import os from 'os';

const isDev = process.env.NODE_ENV !== 'production';

// Detectar dinámicamente interfaces IPv4 locales únicamente en desarrollo para pruebas LAN/móviles
const localIps = isDev
  ? Object.values(os.networkInterfaces())
      .flat()
      .filter((i): i is os.NetworkInterfaceInfo => Boolean(i && i.family === 'IPv4'))
      .map((i) => i.address)
  : [];

const devOriginsList = Array.from(
  new Set([
    'localhost',
    '127.0.0.1',
    ...localIps,
    ...localIps.map((ip) => `${ip}:3000`),
    'localhost:3000',
    '127.0.0.1:3000',
  ])
);

const prodAllowedOrigins = process.env.NEXT_PUBLIC_APP_ORIGIN
  ? [process.env.NEXT_PUBLIC_APP_ORIGIN]
  : undefined;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  ...(isDev ? { allowedDevOrigins: devOriginsList } : {}),
  experimental: {
    serverActions: {
      bodySizeLimit: '6mb',
      ...(isDev
        ? { allowedOrigins: devOriginsList }
        : prodAllowedOrigins
        ? { allowedOrigins: prodAllowedOrigins }
        : {}),
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
