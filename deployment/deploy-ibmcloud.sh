#!/usr/bin/env bash
# ============================================================================
# IBM Cloud Code Engine Deployment Script
# Intelligent Shopping Agentic AI – Llama 3.3 70B via IBM watsonx.ai
# ============================================================================
set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────────────
RESOURCE_GROUP="shopping-ai-rg"
REGION="au-syd"
CE_PROJECT="intelligent-shopping-ai"
REGISTRY="au.icr.io"
REGISTRY_NS="shopping-ai"
BACKEND_IMAGE="${REGISTRY}/${REGISTRY_NS}/backend:latest"
FRONTEND_IMAGE="${REGISTRY}/${REGISTRY_NS}/frontend:latest"

# IBM Cloud API Key (set as env var or replace below)
IBM_API_KEY="${IBM_API_KEY:-dsu7tVLUTDPIWqmRU7yDfN9IqwrvlUpZUgm_i37FOmTi}"

echo "==> 1. Logging into IBM Cloud"
ibmcloud login --apikey "${IBM_API_KEY}" -r "${REGION}" -g "${RESOURCE_GROUP}"

echo "==> 2. Targeting Code Engine project"
ibmcloud ce project select --name "${CE_PROJECT}" || \
  ibmcloud ce project create --name "${CE_PROJECT}" --region "${REGION}"

echo "==> 3. Logging into IBM Container Registry"
ibmcloud cr login --client docker

echo "==> 4. Creating registry namespace (if needed)"
ibmcloud cr namespace-add "${REGISTRY_NS}" 2>/dev/null || true

echo "==> 5. Building and pushing backend image"
docker build -t "${BACKEND_IMAGE}" ./backend
docker push "${BACKEND_IMAGE}"

echo "==> 6. Building and pushing frontend image"
docker build -t "${FRONTEND_IMAGE}" ./frontend
docker push "${FRONTEND_IMAGE}"

echo "==> 7. Creating/updating IBM Code Engine secrets"
ibmcloud ce secret create \
  --name shopping-ai-secrets \
  --from-literal WATSONX_API_KEY="${IBM_API_KEY}" \
  --from-literal WATSONX_PROJECT_ID="7396b694-7544-4ab3-a0ef-98f74b1ea489" \
  --from-literal WATSONX_URL="https://au-syd.ml.cloud.ibm.com" \
  --from-literal SECRET_KEY="$(openssl rand -hex 32)" \
  2>/dev/null || \
ibmcloud ce secret update \
  --name shopping-ai-secrets \
  --from-literal WATSONX_API_KEY="${IBM_API_KEY}" \
  --from-literal WATSONX_PROJECT_ID="7396b694-7544-4ab3-a0ef-98f74b1ea489" \
  --from-literal WATSONX_URL="https://au-syd.ml.cloud.ibm.com"

echo "==> 8. Deploying backend application"
ibmcloud ce application create \
  --name shopping-ai-backend \
  --image "${BACKEND_IMAGE}" \
  --registry-secret icr-secret \
  --env-from-secret shopping-ai-secrets \
  --env DATABASE_URL="postgresql+asyncpg://shopping_user:shopping_pass@\${DB_HOST}:5432/shopping_ai_db" \
  --env APP_ENV=production \
  --min-scale 1 \
  --max-scale 5 \
  --cpu 1 \
  --memory 4G \
  --port 8000 \
  2>/dev/null || \
ibmcloud ce application update \
  --name shopping-ai-backend \
  --image "${BACKEND_IMAGE}" \
  --env-from-secret shopping-ai-secrets

echo "==> 9. Getting backend URL"
BACKEND_URL=$(ibmcloud ce application get --name shopping-ai-backend --output json | python3 -c "import sys,json; print(json.load(sys.stdin)['status']['url'])")
echo "    Backend URL: ${BACKEND_URL}"

echo "==> 10. Deploying frontend application"
ibmcloud ce application create \
  --name shopping-ai-frontend \
  --image "${FRONTEND_IMAGE}" \
  --registry-secret icr-secret \
  --env REACT_APP_API_URL="${BACKEND_URL}/api/v1" \
  --min-scale 1 \
  --max-scale 3 \
  --cpu 0.25 \
  --memory 0.5G \
  --port 80 \
  2>/dev/null || \
ibmcloud ce application update \
  --name shopping-ai-frontend \
  --image "${FRONTEND_IMAGE}"

FRONTEND_URL=$(ibmcloud ce application get --name shopping-ai-frontend --output json | python3 -c "import sys,json; print(json.load(sys.stdin)['status']['url'])")

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║       🛍️  Intelligent Shopping AI – Deployment Complete      ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  Frontend URL : ${FRONTEND_URL}"
echo "║  Backend URL  : ${BACKEND_URL}"
echo "║  API Docs     : ${BACKEND_URL}/api/docs"
echo "║  Region       : ${REGION}"
echo "║  AI Model     : Llama 3.3 70B Instruct (IBM watsonx.ai)"
echo "╚══════════════════════════════════════════════════════════════╝"
