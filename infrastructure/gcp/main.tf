# GCP Infrastructure Module
# This module creates all GCP resources for the Score Keeper application

# Create the project if it doesn't exist
resource "google_project" "project" {
  name            = "${var.app_name} App"
  project_id      = var.project_id
  billing_account = var.billing_account_id
}

# Link the project to the billing account
resource "google_billing_project_info" "billing_link" {
  project         = google_project.project.project_id
  billing_account = var.billing_account_id
  
  depends_on = [google_project.project]
}

# Enable required APIs
resource "google_project_service" "services" {
  for_each = toset([
    "cloudresourcemanager.googleapis.com",
    "serviceusage.googleapis.com",
    "run.googleapis.com",
    "firebase.googleapis.com",
    "firestore.googleapis.com",
    "identitytoolkit.googleapis.com",
    "cloudbilling.googleapis.com",
    "iam.googleapis.com",
    "fcm.googleapis.com",
    "fcmregistrations.googleapis.com",
    "mobilecrashreporting.googleapis.com",
    "domains.googleapis.com"
  ])

  project = google_project.project.project_id
  service = each.key

  disable_dependent_services = true
  disable_on_destroy         = false
  
  depends_on = [google_billing_project_info.billing_link]
}

# Create the default Firestore database (required)
# Note: App Engine application enables Firestore without needing explicit Firebase project resource
resource "google_app_engine_application" "firestore_default" {
  project       = google_project.project.project_id
  location_id   = var.firestore_location
  database_type = "CLOUD_FIRESTORE"
  
  depends_on = [
    google_project_service.services
  ]
}

# Create separate Firestore databases for each environment
resource "google_firestore_database" "dev" {
  provider    = google-beta
  project     = google_project.project.project_id
  name        = "dev-db"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"
  
  point_in_time_recovery_enablement = "POINT_IN_TIME_RECOVERY_DISABLED"
  deletion_policy                   = "ABANDON"
  
  depends_on = [
    google_app_engine_application.firestore_default
  ]
}

resource "google_firestore_database" "staging" {
  provider    = google-beta
  project     = google_project.project.project_id
  name        = "staging-db"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"
  
  point_in_time_recovery_enablement = "POINT_IN_TIME_RECOVERY_DISABLED"
  deletion_policy                   = "ABANDON"
  
  depends_on = [
    google_app_engine_application.firestore_default
  ]
}

resource "google_firestore_database" "prod" {
  provider    = google-beta
  project     = google_project.project.project_id
  name        = "prod-db"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"
  
  point_in_time_recovery_enablement = "POINT_IN_TIME_RECOVERY_DISABLED"
  deletion_policy                   = "ABANDON"
  
  depends_on = [
    google_app_engine_application.firestore_default
  ]
}

# Firebase location is set by the App Engine application above
# No additional location resource needed for FCM

