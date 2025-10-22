#!/bin/bash
set -e

# Parse arguments
ENV=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --env) ENV="$2"; shift 2 ;;
        *) echo "Unknown argument: $1"; exit 1 ;;
    esac
done

# Validate environment
if [[ "$ENV" != "STAGING" && "$ENV" != "PROD" ]]; then
    echo "❌ Error: --env must be either STAGING or PROD"
    exit 1
fi

echo "🚀 Starting Frontend deployment..."
echo "📋 Environment: $ENV"

# Check required environment variables
required_vars=("NEXT_PUBLIC_APPLICATION_SIGNUP_URL" "NEXT_PUBLIC_BACKEND_URL")
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Error: Required environment variable $var is not set"
    exit 1
  fi
done
echo "✅ All required environment variables are set"

# Function to extract project ID from config.tfvars
get_project_name() {
    local config_file="infrastructure/config.tfvars"
    if [[ -f "$config_file" ]]; then
        grep '^vercel_project_name' "$config_file" | cut -d'=' -f2 | cut -d'#' -f1 | tr -d ' "'
    else
        echo "❌ Error: config.tfvars not found" >&2
        exit 1
    fi
}

# Check Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel@latest
fi

# Install frontend dependencies if needed
if [[ ! -d "frontend/node_modules" ]]; then
    echo "📦 Installing dependencies..."
    (cd frontend && npm install)
fi

# Deploy
if [[ "$ENV" == "STAGING" ]]; then
    # Get project ID before changing directories
    PROJECT_NAME=$(get_project_name)
    
    echo "🏗️  Building for STAGING..."
    cd frontend
    
    # Ensure .vercel directory exists
    mkdir -p .vercel
    
    # Handle project linking - create project.json if we have the required IDs
    if [[ -n "$VERCEL_ORG_ID" ]] && [[ -n "$VERCEL_PROJECT_ID" ]]; then
        # We have the IDs (from CI/CD secrets or local env vars), create the project.json
        echo "🔗 Setting up Vercel project linkage..."
        echo "{\"projectId\":\"$VERCEL_PROJECT_ID\",\"orgId\":\"$VERCEL_ORG_ID\"}" > .vercel/project.json
    elif [[ ! -f ".vercel/project.json" ]] || [[ ! -s ".vercel/project.json" ]]; then
        # No project.json and no env vars - need manual linking
        echo "❌ Error: No Vercel project linkage found."
        echo ""
        echo "To fix this, either:"
        echo "  1. Run 'cd frontend && vercel link' to link your project manually, OR"
        echo "  2. Set these environment variables:"
        echo "     - VERCEL_ORG_ID (from Vercel team settings)"
        echo "     - VERCEL_PROJECT_ID (from Vercel project settings)"
        echo "     - VERCEL_TOKEN (optional, from Vercel account settings)"
        exit 1
    fi
    
    # Always pull the latest environment config for preview
    echo "📥 Pulling preview environment configuration..."
    vercel pull --yes --environment=preview ${VERCEL_TOKEN:+--token=$VERCEL_TOKEN}
    
    # Build for preview (no --prod flag)
    vercel build ${VERCEL_TOKEN:+--token=$VERCEL_TOKEN}
    
    echo "📤 Deploying to preview..."
    # Deploy without --prod to ensure it's a preview deployment
    DEPLOYMENT_URL=$(vercel deploy --prebuilt ${VERCEL_TOKEN:+--token=$VERCEL_TOKEN} | tail -n 1)
    
    # Create staging alias
    STAGING_ALIAS="staging-${PROJECT_NAME}.vercel.app"
    echo "🔗 Creating staging alias: $STAGING_ALIAS"
    vercel alias "$DEPLOYMENT_URL" "$STAGING_ALIAS" ${VERCEL_TOKEN:+--token=$VERCEL_TOKEN} || true
    
    echo ""
    echo "✅ Staging deployment completed!"
    echo "🔗 Deployment URL: $DEPLOYMENT_URL"
    echo "🔗 Staging Alias: https://$STAGING_ALIAS"
    
elif [[ "$ENV" == "PROD" ]]; then
    echo "🏗️  Building for PRODUCTION..."
    cd frontend
    
    # Ensure .vercel directory exists
    mkdir -p .vercel
    
    # Handle project linking - create project.json if we have the required IDs
    if [[ -n "$VERCEL_ORG_ID" ]] && [[ -n "$VERCEL_PROJECT_ID" ]]; then
        # We have the IDs (from CI/CD secrets or local env vars), create the project.json
        echo "🔗 Setting up Vercel project linkage..."
        echo "{\"projectId\":\"$VERCEL_PROJECT_ID\",\"orgId\":\"$VERCEL_ORG_ID\"}" > .vercel/project.json
    elif [[ ! -f ".vercel/project.json" ]] || [[ ! -s ".vercel/project.json" ]]; then
        # No project.json and no env vars - need manual linking
        echo "❌ Error: No Vercel project linkage found."
        echo ""
        echo "To fix this, either:"
        echo "  1. Run 'cd frontend && vercel link' to link your project manually, OR"
        echo "  2. Set these environment variables:"
        echo "     - VERCEL_ORG_ID (from Vercel team settings)"
        echo "     - VERCEL_PROJECT_ID (from Vercel project settings)"
        echo "     - VERCEL_TOKEN (optional, from Vercel account settings)"
        exit 1
    fi
    
    # Always pull the latest environment config for production
    echo "📥 Pulling production environment configuration..."
    vercel pull --yes --environment=production ${VERCEL_TOKEN:+--token=$VERCEL_TOKEN}
    
    # Build for production
    vercel build --prod ${VERCEL_TOKEN:+--token=$VERCEL_TOKEN}
    
    echo "📤 Deploying to production..."
    DEPLOYMENT_URL=$(vercel deploy --prebuilt --prod ${VERCEL_TOKEN:+--token=$VERCEL_TOKEN} | tail -n 1)
    
    echo ""
    echo "✅ Production deployment completed!"
    echo "🔗 URL: $DEPLOYMENT_URL"
fi
