#!/bin/bash
set -e

echo "⚠️  WARNING: This will deploy Backend to PRODUCTION!"
read -p "Are you sure? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Load environment variables from .env.prod
ENV_FILE="backend/.env.prod"
[ -f "$ENV_FILE" ] || ENV_FILE=".env.prod"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: .env.prod file not found"
    exit 1
fi

echo "📁 Loading environment variables from $ENV_FILE"
export $(cat "$ENV_FILE" | grep -v '^#' | grep -v '^$' | xargs)

# Run main deployment script
chmod +x backend/deployment/deploy-backend.sh
./backend/deployment/deploy-backend.sh --env PROD
