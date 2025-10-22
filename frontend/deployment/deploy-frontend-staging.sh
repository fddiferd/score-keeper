#!/bin/bash
set -e

echo "🚀 Deploying Frontend to STAGING..."

# Load environment variables from .env.staging
ENV_FILE="frontend/.env.staging"
[ -f "$ENV_FILE" ] || ENV_FILE=".env.staging"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: .env.staging file not found"
    exit 1
fi

echo "📁 Loading environment variables from $ENV_FILE"
set -a
source "$ENV_FILE"
set +a

# Run main deployment script
chmod +x frontend/deployment/deploy-frontend.sh
./frontend/deployment/deploy-frontend.sh --env STAGING
