# GCP Outputs
output "gcp_project_id" {
  description = "The GCP project ID"
  value       = var.deployment_enabled && length(module.gcp) > 0 ? module.gcp[0].project_id : "Deployment not enabled"
}

output "gcp_project_number" {
  description = "The GCP project number"
  value       = var.deployment_enabled && length(module.gcp) > 0 ? module.gcp[0].project_number : "Deployment not enabled"
}

output "cloud_run_prod_url" {
  description = "The URL of the deployed Cloud Run service (Production)"
  value       = var.deployment_enabled && length(module.gcp) > 0 ? module.gcp[0].cloud_run_prod_url : "Deployment not enabled"
}

output "cloud_run_staging_url" {
  description = "The URL of the deployed Cloud Run service (Staging)"
  value       = var.deployment_enabled && length(module.gcp) > 0 ? module.gcp[0].cloud_run_staging_url : "Deployment not enabled"
}

output "cloud_run_prod_service_name" {
  description = "The name of the Cloud Run service (Production)"
  value       = var.deployment_enabled && length(module.gcp) > 0 ? module.gcp[0].cloud_run_prod_service_name : "Deployment not enabled"
}

output "cloud_run_staging_service_name" {
  description = "The name of the Cloud Run service (Staging)"
  value       = var.deployment_enabled && length(module.gcp) > 0 ? module.gcp[0].cloud_run_staging_service_name : "Deployment not enabled"
}

output "artifact_registry_repository_url" {
  description = "The Artifact Registry repository URL"
  value       = var.deployment_enabled && length(module.gcp) > 0 ? module.gcp[0].artifact_registry_repository_url : "Deployment not enabled"
}

output "firebase_admin_service_account" {
  description = "The Firebase Admin SDK service account email"
  value       = var.deployment_enabled && length(module.gcp) > 0 ? module.gcp[0].firebase_admin_service_account : "Deployment not enabled"
}

output "cloud_run_service_account" {
  description = "The Cloud Run service account email"
  value       = var.deployment_enabled && length(module.gcp) > 0 ? module.gcp[0].cloud_run_service_account : "Deployment not enabled"
}

output "firestore_databases" {
  description = "Firestore database IDs"
  value = var.deployment_enabled && length(module.gcp) > 0 ? {
    default = module.gcp[0].firestore_database_id
    dev     = module.gcp[0].firestore_database_dev_id
    staging = module.gcp[0].firestore_database_staging_id
    prod    = module.gcp[0].firestore_database_prod_id
  } : { default = "Deployment not enabled", dev = "Deployment not enabled", staging = "Deployment not enabled", prod = "Deployment not enabled" }
}

output "firebase_project_number" {
  description = "The Firebase project number (needed for App Messaging configuration)"
  value       = var.deployment_enabled && length(module.gcp) > 0 ? module.gcp[0].firebase_project_number : "Deployment not enabled"
}

output "fcm_sender_id" {
  description = "The FCM Sender ID (same as project number)"
  value       = var.deployment_enabled && length(module.gcp) > 0 ? module.gcp[0].fcm_sender_id : "Deployment not enabled"
}

# Sensitive outputs
output "firebase_service_account_key" {
  description = "The Firebase service account key (base64-encoded)"
  value       = var.deployment_enabled && length(module.gcp) > 0 ? module.gcp[0].firebase_service_account_key : null
  sensitive   = true
}

output "cloud_run_service_account_key" {
  description = "The Cloud Run service account key (base64-encoded)"
  value       = var.deployment_enabled && length(module.gcp) > 0 ? module.gcp[0].cloud_run_service_account_key : null
  sensitive   = true
}

# Vercel Outputs (only if deployment enabled)
output "vercel_project_id" {
  description = "The Vercel project ID"
  value       = var.deployment_enabled && length(module.vercel) > 0 ? module.vercel[0].vercel_project_id : "Deployment not enabled"
}

output "vercel_deployment_url" {
  description = "The production deployment URL"
  value       = var.deployment_enabled && length(module.vercel) > 0 ? module.vercel[0].vercel_deployment_url : "Deployment not enabled"
}

output "vercel_staging_preview_url" {
  description = "Staging deployments use a consistent Vercel preview alias"
  value       = var.deployment_enabled && length(module.vercel) > 0 ? module.vercel[0].vercel_staging_preview_url : "Deployment not enabled"
}

# Wristband DEV Outputs
output "wristband_dev_application_id" {
  description = "Wristband DEV application ID"
  value       = length(module.wristband_dev) > 0 ? module.wristband_dev[0].application_id : "Not configured"
}

output "wristband_dev_oauth2_client_id" {
  description = "Wristband DEV OAuth2 client ID"
  value       = length(module.wristband_dev) > 0 ? module.wristband_dev[0].oauth2_client_id : "Not configured"
}

output "wristband_dev_oauth2_client_secret" {
  description = "Wristband DEV OAuth2 client secret"
  value       = length(module.wristband_dev) > 0 ? module.wristband_dev[0].oauth2_client_secret : null
  sensitive   = true
}

# Wristband STAGING Outputs
output "wristband_staging_application_id" {
  description = "Wristband STAGING application ID"
  value       = length(module.wristband_staging) > 0 ? module.wristband_staging[0].application_id : "Not configured"
}

output "wristband_staging_oauth2_client_id" {
  description = "Wristband STAGING OAuth2 client ID"
  value       = length(module.wristband_staging) > 0 ? module.wristband_staging[0].oauth2_client_id : "Not configured"
}

output "wristband_staging_oauth2_client_secret" {
  description = "Wristband STAGING OAuth2 client secret"
  value       = length(module.wristband_staging) > 0 ? module.wristband_staging[0].oauth2_client_secret : null
  sensitive   = true
}

# Wristband PROD Outputs
output "wristband_prod_application_id" {
  description = "Wristband PROD application ID"
  value       = length(module.wristband_prod) > 0 ? module.wristband_prod[0].application_id : "Not configured"
}

output "wristband_prod_oauth2_client_id" {
  description = "Wristband PROD OAuth2 client ID"
  value       = length(module.wristband_prod) > 0 ? module.wristband_prod[0].oauth2_client_id : "Not configured"
}

output "wristband_prod_oauth2_client_secret" {
  description = "Wristband PROD OAuth2 client secret"
  value       = length(module.wristband_prod) > 0 ? module.wristband_prod[0].oauth2_client_secret : null
  sensitive   = true
}

# Summary output for convenience
output "deployment_summary" {
  description = "Summary of all deployment URLs"
  value = {
    backend_api_prod    = var.deployment_enabled && length(module.gcp) > 0 ? module.gcp[0].cloud_run_prod_url : "Deployment not enabled (local dev only)"
    backend_api_staging = var.deployment_enabled && length(module.gcp) > 0 ? module.gcp[0].cloud_run_staging_url : "Deployment not enabled (local dev only)"
    frontend_production = var.deployment_enabled && length(module.vercel) > 0 ? module.vercel[0].vercel_deployment_url : "Deployment not enabled"
    frontend_staging    = var.deployment_enabled && length(module.vercel) > 0 ? module.vercel[0].vercel_staging_preview_url : "Deployment not enabled"
    wristband_dev       = length(module.wristband_dev) > 0 ? "Configured (local dev)" : "Not configured"
    wristband_staging   = length(module.wristband_staging) > 0 ? "Configured" : "Deployment not enabled"
    wristband_prod      = length(module.wristband_prod) > 0 ? "Configured" : "Deployment not enabled"
  }
}

