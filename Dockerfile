# ---------- build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps deterministically
COPY package.json package-lock.json ./
RUN npm ci

# App source
COPY . .

# Make available at build time (for client bundle)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NODE_ENV=production
RUN npm run build

# ---------- runtime stage ----------
FROM node:20-alpine
WORKDIR /app

# Non-root user for security
RUN addgroup -S app && adduser -S app -G app

# Install only prod deps
COPY --from=builder /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev

# App artifacts
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Next.js defaults
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

# Healthcheck (alpine has busybox wget)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/healthz || exit 1

USER app
CMD ["npm", "start"]
