#!/bin/bash

# Script to export service account keys (Cloud Run and Firebase)

# Ensure we're in the infrastructure directory (where terraform state is)
cd "$(dirname "$0")/.." || exit

# Create service accounts directory if it doesn't exist
mkdir -p ../backend/.keys

# Export the Cloud Run service account key
echo "Exporting Cloud Run service account key..."
terraform output -raw cloud_run_service_account_key | base64 --decode > ../backend/.keys/cloud-run-service-account-key.json

# Export the Firebase service account key
echo "Exporting Firebase service account key..."
terraform output -raw firebase_service_account_key | base64 --decode > ../backend/.keys/firebase-service-account-key.json

echo ""
echo "✓ Keys exported successfully:"
echo "  - backend/.keys/cloud-run-service-account-key.json"
echo "  - backend/.keys/firebase-service-account-key.json"

