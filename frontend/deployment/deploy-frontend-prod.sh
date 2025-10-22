#!/bin/bash
set -e

echo "⚠️  WARNING: This will deploy Frontend to PRODUCTION!"
read -p "Are you sure? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Load environment variables from .env.prod
ENV_FILE="frontend/.env.prod"
[ -f "$ENV_FILE" ] || ENV_FILE=".env.prod"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: .env.prod file not found"
    exit 1
fi

echo "📁 Loading environment variables from $ENV_FILE"
set -a
source "$ENV_FILE"
set +a

# Run main deployment script
chmod +x frontend/deployment/deploy-frontend.sh
./frontend/deployment/deploy-frontend.sh --env PROD
