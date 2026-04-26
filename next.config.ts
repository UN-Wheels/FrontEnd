import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',

  // Rewrites actúan como proxy server-side.
  // En desarrollo (NEXT_PUBLIC_API_URL vacío) proxean /api/* → localhost:8080.
  // En producción NEXT_PUBLIC_API_URL se bake en build time apuntando al gateway.
  async rewrites() {
    const gatewayUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
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
