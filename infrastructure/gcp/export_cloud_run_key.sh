#!/bin/bash

# Script to export the Cloud Run service account key

# Ensure we're in the infrastructure directory
cd "$(dirname "$0")" || exit

# Create service accounts directory if it doesn't exist
mkdir -p ../../backend/.keys

# Export the Cloud Run service account key
terraform output -raw cloud_run_service_account_key | base64 --decode > ../backend/.keys/cloud-run-service-account-key.json

echo "Cloud Run service account key exported to backend/.keys/cloud-run-service-account-key.json" 