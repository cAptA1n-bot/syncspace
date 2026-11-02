# ─── Production Dockerfile for SyncSpace Backend ────────────────────────────
FROM node:20-alpine AS base

# Install curl for container health check
RUN apk add --no-cache curl

WORKDIR /app

# Install dependencies in a separate layer for caching
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy application source
COPY src/ ./src/

# Set production environment defaults
ENV NODE_ENV=production \
    PORT=3000

# Run as non-root user for security
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

CMD ["node", "src/server.js"]

