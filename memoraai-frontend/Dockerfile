# ════════════════════════════════════════════════════════════════
# 🎨 Frontend Production Build
# ════════════════════════════════════════════════════════════════
# Multi-stage build for optimized production image
# ════════════════════════════════════════════════════════════════

# ════════════════════════════════════════════════════════════════
# Stage 1: Build
# ════════════════════════════════════════════════════════════════
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_API_URL=http://localhost:8000

# Set environment variables during build
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL

# Build the application
RUN pnpm run build

# ════════════════════════════════════════════════════════════════
# Stage 2: Runtime (Nginx)
# ════════════════════════════════════════════════════════════════
FROM nginx:alpine

# Labels for metadata
LABEL maintainer="MemoraAI Team"
LABEL description="MemoraAI Frontend - React + Vite"
LABEL version="1.0"

# Install curl for health check
RUN apk add --no-cache curl

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf /etc/nginx/conf.d/default.conf

# Create non-root user for security
RUN addgroup -g 1001 -S nginx_user && \
    adduser -S nginx_user -u 1001 && \
    chown -R nginx_user:nginx_user /var/cache/nginx && \
    chown -R nginx_user:nginx_user /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx_user:nginx_user /var/run/nginx.pid

# Copy built application from builder stage
COPY --from=builder --chown=nginx_user:nginx_user /app/dist /usr/share/nginx/html

# Switch to non-root user
USER nginx_user

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
