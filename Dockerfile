# ═══════════════════════════════════════════════════════════════
#  SineLog — Dockerfile  (Production / Kubernetes ready)
#
#  Multi-stage build:
#    Stage 1 (builder) — copies + validates static assets
#    Stage 2 (runtime) — minimal nginx:alpine, non-root user
#
#  Build:  docker build -t sinelog:latest .
#  Tag:    docker tag sinelog:latest <registry>/sinelog:v1.0.0
#  Push:   docker push <registry>/sinelog:v1.0.0
# ═══════════════════════════════════════════════════════════════

# ── Stage 1: builder ─────────────────────────────────────────────
FROM alpine:3.19 AS builder

WORKDIR /app

# Copy all static assets
COPY index.html      ./
COPY styles.css      ./
COPY app.js          ./
COPY tmdb.js         ./
COPY auth.js         ./
COPY store.js        ./
COPY nav.js          ./
COPY modal.js        ./
COPY manifest.json   ./
COPY ui/             ./ui/

# Verify critical files exist (fails build if missing)
RUN test -f index.html  || (echo "MISSING: index.html"  && exit 1) && \
    test -f app.js      || (echo "MISSING: app.js"      && exit 1) && \
    test -f styles.css  || (echo "MISSING: styles.css"  && exit 1) && \
    echo "All required files present"

# ── Stage 2: runtime ─────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Remove default content and configs
RUN rm -rf /usr/share/nginx/html/* \
           /etc/nginx/conf.d/default.conf

# Copy built assets from stage 1
COPY --from=builder /app /usr/share/nginx/html

# Copy nginx config (injected via ConfigMap in K8s, used directly in Docker)
COPY k8s/nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser  -u 1001 -S appuser -G appgroup && \
    touch /var/run/nginx.pid && \
    chown -R appuser:appgroup \
      /var/run/nginx.pid \
      /var/cache/nginx \
      /var/log/nginx \
      /usr/share/nginx/html \
      /etc/nginx/conf.d

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
