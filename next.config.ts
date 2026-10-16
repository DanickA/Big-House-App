import type { NextConfig } from "next";
import os from "os";

// Detectar dinámicamente todas las interfaces IPv4 locales para permitir desarrollo local y pruebas desde red LAN/móviles
const localIps = Object.values(os.networkInterfaces())
  .flat()
  .filter((i): i is os.NetworkInterfaceInfo => Boolean(i && i.family === 'IPv4'))
  .map((i) => i.address);

const allowedOriginsList = Array.from(
  new Set([
    'localhost',
    '127.0.0.1',
    ...localIps,
    ...localIps.map((ip) => `${ip}:3000`),
    'localhost:3000',
    '127.0.0.1:3000',
  ])
);

const nextConfig: NextConfig = {
  allowedDevOrigins: allowedOriginsList,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
      allowedOrigins: allowedOriginsList,
    },
  },
};

export default nextConfig;
