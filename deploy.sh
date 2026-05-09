#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  SineLog — deploy.sh
#
#  Full deployment script: build → push → apply to K8s
#
#  Usage:
#    chmod +x deploy.sh
#    ./deploy.sh                        # build + deploy (latest)
#    ./deploy.sh --tag v1.2.0           # build + deploy with tag
#    ./deploy.sh --registry myrepo.io   # push to custom registry
#    ./deploy.sh --skip-build           # K8s apply only (no rebuild)
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# ── Defaults ─────────────────────────────────────────────────────
REGISTRY=""          # e.g. "docker.io/yourusername" or "gcr.io/your-project"
IMAGE_NAME="sinelog"
TAG="latest"
NAMESPACE="sinelog"
SKIP_BUILD=false
SKIP_PUSH=false

# ── Parse args ────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case $1 in
    --registry)   REGISTRY="$2";   shift 2 ;;
    --tag)        TAG="$2";        shift 2 ;;
    --skip-build) SKIP_BUILD=true; shift   ;;
    --skip-push)  SKIP_PUSH=true;  shift   ;;
    *)            echo "Unknown option: $1"; exit 1 ;;
  esac
done

# ── Computed values ───────────────────────────────────────────────
if [[ -n "$REGISTRY" ]]; then
  FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${TAG}"
else
  FULL_IMAGE="${IMAGE_NAME}:${TAG}"
  SKIP_PUSH=true   # Can't push without a registry
fi

echo ""
echo "╔══════════════════════════════════════╗"
echo "║        SineLog Deployment         ║"
echo "╚══════════════════════════════════════╝"
echo "  Image:     ${FULL_IMAGE}"
echo "  Namespace: ${NAMESPACE}"
echo "  Skip build: ${SKIP_BUILD}"
echo "  Skip push:  ${SKIP_PUSH}"
echo ""

# ── Step 1: Build Docker image ────────────────────────────────────
if [[ "$SKIP_BUILD" == "false" ]]; then
  echo "▶ [1/5] Building Docker image..."
  docker build \
    --tag "${FULL_IMAGE}" \
    --label "build.version=${TAG}" \
    --label "build.date=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    .
  echo "  ✓ Image built: ${FULL_IMAGE}"
else
  echo "  ⏭  Skipping build"
fi

# ── Step 2: Push to registry ──────────────────────────────────────
if [[ "$SKIP_PUSH" == "false" ]]; then
  echo ""
  echo "▶ [2/5] Pushing image to registry..."
  docker push "${FULL_IMAGE}"
  echo "  ✓ Pushed: ${FULL_IMAGE}"
else
  echo "  ⏭  Skipping push (no registry or --skip-push)"
fi

# ── Step 3: Apply namespace ───────────────────────────────────────
echo ""
echo "▶ [3/5] Applying Kubernetes manifests..."
kubectl apply -f k8s/namespace.yaml
echo "  ✓ Namespace"

# ── Step 4: Apply all K8s resources ──────────────────────────────
kubectl apply -f k8s/configmap.yaml
echo "  ✓ ConfigMap"

# Patch the deployment image if a registry was provided
if [[ -n "$REGISTRY" ]]; then
  sed "s|image: sinelog:latest|image: ${FULL_IMAGE}|g" \
    k8s/deployment.yaml | kubectl apply -f -
else
  kubectl apply -f k8s/deployment.yaml
fi
echo "  ✓ Deployment"

kubectl apply -f k8s/service.yaml
echo "  ✓ Service"

kubectl apply -f k8s/ingress.yaml
echo "  ✓ Ingress"

kubectl apply -f k8s/hpa.yaml
echo "  ✓ HPA"

kubectl apply -f k8s/pdb.yaml
echo "  ✓ PodDisruptionBudget"

# ── Step 5: Wait for rollout ───────────────────────────────────────
echo ""
echo "▶ [4/5] Waiting for rollout to complete..."
kubectl rollout status deployment/sinelog \
  --namespace="${NAMESPACE}" \
  --timeout=120s
echo "  ✓ Rollout complete"

# ── Step 6: Status summary ────────────────────────────────────────
echo ""
echo "▶ [5/5] Deployment status:"
echo ""
kubectl get pods      -n "${NAMESPACE}" -l app=sinelog
echo ""
kubectl get service   -n "${NAMESPACE}"
echo ""
kubectl get ingress   -n "${NAMESPACE}"
echo ""
echo "╔══════════════════════════════════════╗"
echo "║      ✓ Deploy successful!            ║"
echo "╚══════════════════════════════════════╝"
echo ""
