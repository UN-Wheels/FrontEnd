# ── Stage 1: dependencias + build ─────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Variables públicas que Next.js bake en el bundle del cliente en build time.
# Apuntan a los puertos expuestos del host (accesibles desde el browser).
ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# URL interna del API Gateway via la red Docker.  Next.js evalua rewrites()
# en build time, asi que esta variable DEBE ser un ARG (no solo un ENV en runtime)
# para que los rewrites server-side queden horneados apuntando al gateway privado.
ARG INTERNAL_GATEWAY_URL=http://api-gateway:8080
ENV INTERNAL_GATEWAY_URL=$INTERNAL_GATEWAY_URL

COPY package*.json ./
RUN npm ci

COPY . .

# Asegurar que public/ exista (Next.js lo requiere aunque esté vacío)
RUN mkdir -p public

RUN npm run build

# ── Stage 2: runtime mínimo (Node.js standalone) ──────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# El build standalone incluye su propio node_modules mínimo
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# server.js es el entry point generado por output: 'standalone'
CMD ["node", "server.js"]
