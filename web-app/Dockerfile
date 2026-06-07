# Stage 1 : build
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat python3 make g++ openssl
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
ARG NEXT_PUBLIC_SOCKET_URL=http://localhost:3002
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
RUN npm run build

# Stage 2 : runner
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/scripts ./scripts

EXPOSE 3000 3001
