import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    const gatewayUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    return {
      beforeFiles: [
        { source: '/api/auth/:path*', destination: `${gatewayUrl}/api/auth/:path*` },
        { source: '/api/routes/:path*', destination: `${gatewayUrl}/api/routes/:path*` },
        { source: '/api/chat/:path*', destination: `${gatewayUrl}/api/chat/:path*` },
      ],
    };
  },
};
export default nextConfig;
