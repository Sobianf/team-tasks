# ---------- build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps deterministically
COPY package.json package-lock.json ./
#install exact package lock json reproduc build
RUN npm ci      

# Copy source and build
COPY . .
ENV NODE_ENV=production
RUN npm run build

# ---------- runtime stage ----------
FROM node:20-alpine
WORKDIR /app

# Non-root user for security
RUN addgroup -S app && adduser -S app -G app

# Only runtime deps we want packahe and package lock json from build step
COPY --from=builder /app/package.json /app/package-lock.json ./
# installs only prod depenedencies 
RUN npm ci --omit=dev

# allow Next.js to see public envs during build
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
# persist inside container
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

# App artifacts
COPY --from=builder /app/.next ./.next
#static assets like images etc
COPY --from=builder /app/public ./public

# Next.js app listens on 3000 by default
EXPOSE 3000

# Healthcheck hits your Next.js API route
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/healthz || exit 1

USER app
ENV NODE_ENV=production
CMD ["npm", "start"]

#Why this structure is good
#✅ Multi-stage build → smaller final image.
#✅ Cache-friendly → only reinstall deps when package.json changes.
#✅ Security → non-root user.
#✅ Environment vars handled cleanly for public Next.js envs.
#✅ Healthcheck → lets Docker know if the container is healthy.
