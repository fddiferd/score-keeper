#!/bin/bash
set -e

echo "🚀 Deploying Backend to STAGING..."

# Load environment variables from .env.staging
ENV_FILE="backend/.env.staging"
[ -f "$ENV_FILE" ] || ENV_FILE=".env.staging"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: .env.staging file not found"
    exit 1
fi

echo "📁 Loading environment variables from $ENV_FILE"
export $(cat "$ENV_FILE" | grep -v '^#' | grep -v '^$' | xargs)

# Run main deployment script
chmod +x backend/deployment/deploy-backend.sh
./backend/deployment/deploy-backend.sh --env STAGING