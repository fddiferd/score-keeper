# Create Firebase Admin SDK service account
resource "google_service_account" "firebase_admin" {
  account_id   = "firebase-admin"
  display_name = "Firebase Admin SDK"
  description  = "Service account for Firebase Admin SDK access"
  project      = google_project.project.project_id

  depends_on = [google_app_engine_application.firestore_default]
}

# Grant Firebase Admin role
resource "google_project_iam_member" "firebase_admin_role" {
  project = google_project.project.project_id
  role    = "roles/firebase.admin"
  member  = "serviceAccount:${google_service_account.firebase_admin.email}"
}

# Grant Firestore Admin role
resource "google_project_iam_member" "firestore_admin_role" {
  project = google_project.project.project_id
  role    = "roles/datastore.owner"
  member  = "serviceAccount:${google_service_account.firebase_admin.email}"
}

# Firebase Cloud Messaging permissions are included in the firebase.admin role above

# Grant Service Account Token Creator role for advanced token management
resource "google_project_iam_member" "firebase_token_creator" {
  project = google_project.project.project_id
  role    = "roles/iam.serviceAccountTokenCreator"
  member  = "serviceAccount:${google_service_account.firebase_admin.email}"
}

# Create Firebase service account key
resource "google_service_account_key" "firebase_key" {
  service_account_id = google_service_account.firebase_admin.name
}

# Create service account for Cloud Run
resource "google_service_account" "cloud_run_sa" {
  account_id   = "cloud-run-service"
  display_name = "Cloud Run Service Account"
  description  = "Service account for Cloud Run services"
  project      = google_project.project.project_id
}

# Create Cloud Run service account key
resource "google_service_account_key" "cloud_run_key" {
  service_account_id = google_service_account.cloud_run_sa.name
}

# Grant Cloud Run Invoker role
resource "google_project_iam_member" "cloud_run_invoker_role" {
  project = google_project.project.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# Grant Firestore User role to Cloud Run service account
resource "google_project_iam_member" "cloud_run_firestore_role" {
  project = google_project.project.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# Grant service usage consumer role
resource "google_project_iam_member" "cloud_run_service_usage_consumer" {
  project = google_project.project.project_id
  role    = "roles/serviceusage.serviceUsageConsumer"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# Grant Cloud Run Admin role (to deploy services)
resource "google_project_iam_member" "cloud_run_admin" {
  project = google_project.project.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# Grant the service account Project IAM Admin role for Cloud Run service creation
resource "google_project_iam_member" "cloud_run_iam_admin" {
  project = google_project.project.project_id
  role    = "roles/resourcemanager.projectIamAdmin"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# Grant IAM Service Account User role to allow the service account to act as itself
resource "google_project_iam_member" "service_account_user" {
  project = google_project.project.project_id
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# Grant Cloud Build Editor role
resource "google_project_iam_member" "cloud_build_editor" {
  project = google_project.project.project_id
  role    = "roles/cloudbuild.builds.editor"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}