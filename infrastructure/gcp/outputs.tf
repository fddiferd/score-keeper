output "project_id" {
  description = "The GCP project ID"
  value       = google_project.project.project_id
}

output "project_number" {
  description = "The GCP project number"
  value       = google_project.project.number
}

output "firebase_admin_service_account" {
  description = "The Firebase Admin SDK service account email"
  value       = google_service_account.firebase_admin.email
}

output "firebase_service_account_key" {
  description = "The Firebase service account key (base64-encoded)"
  value       = google_service_account_key.firebase_key.private_key
  sensitive   = true
}

output "cloud_run_service_account" {
  description = "The Cloud Run service account email"
  value       = google_service_account.cloud_run_sa.email
}

output "cloud_run_service_account_key" {
  description = "The Cloud Run service account key (base64-encoded)"
  value       = google_service_account_key.cloud_run_key.private_key
  sensitive   = true
}

output "firestore_database_id" {
  description = "The default Firestore database ID"
  value       = google_app_engine_application.firestore_default.id
}

output "firestore_database_dev_id" {
  description = "The dev Firestore database ID"
  value       = google_firestore_database.dev.name
}

output "firestore_database_staging_id" {
  description = "The staging Firestore database ID"
  value       = google_firestore_database.staging.name
}

output "firestore_database_prod_id" {
  description = "The prod Firestore database ID"
  value       = google_firestore_database.prod.name
}

output "firebase_project" {
  description = "The Firebase project"
  value       = google_project.project.project_id
}

output "firebase_project_location" {
  description = "The Firebase project location (from App Engine)"
  value       = google_app_engine_application.firestore_default.location_id
}

output "firebase_project_number" {
  description = "The Firebase project number (needed for App Messaging configuration)"
  value       = google_project.project.number
}

output "fcm_sender_id" {
  description = "The FCM Sender ID (same as project number)"
  value       = google_project.project.number
}

output "artifact_registry_repository_id" {
  description = "The Artifact Registry repository ID"
  value       = google_artifact_registry_repository.api_repo.repository_id
}

output "artifact_registry_repository_url" {
  description = "The Artifact Registry repository URL"
  value       = "${var.region}-docker.pkg.dev/${google_project.project.project_id}/${google_artifact_registry_repository.api_repo.repository_id}"
}

output "cloud_run_prod_url" {
  description = "The URL of the deployed Cloud Run service (Production)"
  value       = google_cloud_run_service.api_prod.status[0].url
}

output "cloud_run_staging_url" {
  description = "The URL of the deployed Cloud Run service (Staging)"
  value       = google_cloud_run_service.api_staging.status[0].url
}

output "cloud_run_prod_service_name" {
  description = "The name of the Cloud Run service (Production)"
  value       = google_cloud_run_service.api_prod.name
}

output "cloud_run_staging_service_name" {
  description = "The name of the Cloud Run service (Staging)"
  value       = google_cloud_run_service.api_staging.name
}


