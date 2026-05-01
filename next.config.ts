import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',

  // Rewrites actuan como proxy server-side: corren DENTRO del contenedor de Next.js.
  // Por eso NO se puede usar NEXT_PUBLIC_API_URL aqui — esa variable apunta al
  // gateway desde el navegador del usuario (http://localhost:8080), pero
  // dentro del contenedor "localhost" es el propio contenedor del frontend.
  // INTERNAL_GATEWAY_URL debe apuntar al gateway via la red de Docker
  // (ej. http://api-gateway:8080) para que los rewrites SSR funcionen.
  async rewrites() {
    const gatewayUrl =
      process.env.INTERNAL_GATEWAY_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:8080';
    return {
      beforeFiles: [
        { source: '/api/auth/:path*',          destination: `${gatewayUrl}/api/auth/:path*` },
        { source: '/api/routes/:path*',        destination: `${gatewayUrl}/api/routes/:path*` },
        { source: '/api/vehicles/:path*',      destination: `${gatewayUrl}/api/vehicles/:path*` },
        { source: '/api/chat/:path*',          destination: `${gatewayUrl}/api/chat/:path*` },
        { source: '/api/notifications/:path*', destination: `${gatewayUrl}/api/notifications/:path*` },
      ],
    };
  },
};

export default nextConfig;
