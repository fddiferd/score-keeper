#!/bin/bash
set -e

# Parse arguments
ENV=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --env) ENV="$2"; shift 2 ;;
    *) echo "Unknown option $1"; exit 1 ;;
  esac
done

# Validate environment
if [[ "$ENV" != "STAGING" && "$ENV" != "PROD" ]]; then
    echo "❌ Error: --env must be either STAGING or PROD"
    exit 1
fi

echo "🚀 Starting Cloud Run deployment..."
echo "📋 Environment: $ENV"

# Check required environment variables
required_vars=("CLIENT_ID" "CLIENT_SECRET" "APPLICATION_VANITY_DOMAIN" "APPLICATION_ID" "DOMAIN_NAME" "FIREBASE_SERVICE_ACCOUNT_KEY")
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Error: Required environment variable $var is not set"
    exit 1
  fi
done
echo "✅ All required environment variables are set"

# Set project and service variables
# Extract from Terraform config
PROJECT_ID=$(grep 'project_id' infrastructure/config.tfvars | cut -d'"' -f2)
if [ -z "$PROJECT_ID" ]; then
  echo "Error: Could not extract project_id from infrastructure/config.tfvars"
  exit 1
fi
API_NAME=$(grep 'api_name' infrastructure/config.tfvars | cut -d'"' -f2)
if [ -z "$PROJECT_ID" ]; then
  echo "Error: Could not extract api_name from infrastructure/config.tfvars"
  exit 1
fi
API_REPO_NAME=$(grep 'api_repo_name' infrastructure/config.tfvars | cut -d'"' -f2)
if [ -z "$API_REPO_NAME" ]; then
  echo "Error: Could not extract api_repo_name from infrastructure/config.tfvars"
  exit 1
fi
REGION=$(grep 'region' infrastructure/config.tfvars | cut -d'"' -f2)
if [ -z "$REGION" ]; then
  echo "Error: Could not extract region from infrastructure/config.tfvars"
  exit 1
fi


# Set service name based on environment
if [ "$ENV" = "STAGING" ]; then
  SERVICE_NAME="${PROJECT_ID}-${API_NAME}-staging"
else
  SERVICE_NAME="${PROJECT_ID}-${API_NAME}"
fi

# Use Artifact Registry instead of GCR
ARTIFACT_REGISTRY_REPO="${PROJECT_ID}-${API_REPO_NAME}"
IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REGISTRY_REPO}/${SERVICE_NAME}"

echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"
echo "Image Name: $IMAGE_NAME"

# Authenticate with Google Cloud
echo "🔐 Authenticating with Google Cloud..."
if gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
  echo "✅ Using existing gcloud authentication"
  gcloud config set project $PROJECT_ID
elif [ -n "$CLOUD_RUN_SERVICE_ACCOUNT_KEY" ]; then
  echo "Using service account key from environment variable"
  echo "$CLOUD_RUN_SERVICE_ACCOUNT_KEY" > /tmp/gcp-key.json
  if ! python3 -c "import json; json.load(open('/tmp/gcp-key.json'))" 2>/dev/null; then
    echo "❌ Error: CLOUD_RUN_SERVICE_ACCOUNT_KEY is not valid JSON"
    exit 1
  fi
  gcloud auth activate-service-account --key-file=/tmp/gcp-key.json
  gcloud config set project $PROJECT_ID
else
  echo "❌ Error: No authentication available. Either run 'gcloud auth login' or set CLOUD_RUN_SERVICE_ACCOUNT_KEY"
  exit 1
fi

# Configure Docker to use gcloud as credential helper for Artifact Registry
echo "Configuring Docker authentication for Artifact Registry..."
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet

# Build and push Docker image
echo "🐳 Building Docker image..."
docker build -t $IMAGE_NAME --platform linux/amd64 --build-arg ENVIRONMENT=$ENV -f backend/Dockerfile .

echo "📤 Pushing image to Artifact Registry..."
docker push $IMAGE_NAME

# Deploy to Cloud Run
echo "☁️  Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars ENVIRONMENT=$ENV \
  --set-env-vars CLIENT_ID="${CLIENT_ID}" \
  --set-env-vars CLIENT_SECRET="${CLIENT_SECRET}" \
  --set-env-vars APPLICATION_VANITY_DOMAIN="${APPLICATION_VANITY_DOMAIN}" \
  --set-env-vars APPLICATION_ID="${APPLICATION_ID}" \
  --set-env-vars DOMAIN_NAME="${DOMAIN_NAME}" \
  --set-env-vars FIREBASE_SERVICE_ACCOUNT_KEY="${FIREBASE_SERVICE_ACCOUNT_KEY}" \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10

# Get service URL and clean up
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')
rm -f /tmp/gcp-key.json

echo ""
echo "✅ Deployment completed!"
echo "🔗 Service URL: $SERVICE_URL"