import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',

  // No redirigir automaticamente cuando llega una URL con trailing slash.
  // Algunos clientes (vehiclesService) llaman /vehicles/, /routes/, etc.
  // Sin esto, Next.js responde 308 quitando el slash, el browser reintenta
  // sin slash, y el gateway NestJS no matchea su route /api/vehicles/* (el
  // wildcard requiere algo despues del slash).  Manteniendo el slash, la URL
  // original llega intacta al gateway.
  skipTrailingSlashRedirect: true,

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
        // Catch-all regex que preserva la URL exacta incluyendo trailing slash.
        // El patron :rest* con sintaxis path-to-regexp pierde el slash final
        // cuando el path es vacio (ej. /api/vehicles/ → /api/vehicles), lo que
        // rompia routes del gateway que requieren ese slash.  Usar :rest(.*)
        // captura TODO lo que viene despues de /api/ como un solo grupo regex,
        // y la sustitucion preserva los slashes literales.
        { source: '/api/:rest(.*)', destination: `${gatewayUrl}/api/:rest` },
      ],
    };
  },
};

export default nextConfig;
