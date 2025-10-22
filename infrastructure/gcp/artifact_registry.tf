# Enable Artifact Registry API
resource "google_project_service" "artifact_registry" {
  project = google_project.project.project_id
  service = "artifactregistry.googleapis.com"

  disable_dependent_services = true
  disable_on_destroy         = false
}

# Create Artifact Registry repository for Docker images
resource "google_artifact_registry_repository" "api_repo" {
  provider = google-beta
  
  project       = google_project.project.project_id
  location      = var.region
  repository_id = "${var.project_id}-${var.api_repo_name}"
  description   = "Docker repository for ${var.app_name} ${var.api_name}"
  format        = "DOCKER"

  depends_on = [google_project_service.artifact_registry]
}

# Grant Cloud Run service account permission to read/write to Artifact Registry
resource "google_artifact_registry_repository_iam_member" "cloud_run_sa_artifactregistry_writer" {
  project    = google_project.project.project_id
  location   = var.region
  repository = google_artifact_registry_repository.api_repo.repository_id
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}


