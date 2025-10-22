# Cloud Run service for the API (Production)
resource "google_cloud_run_service" "api_prod" {
  name     = "${var.project_id}-${var.api_name}"
  location = var.region
  project  = google_project.project.project_id

  template {
    spec {
      containers {
        # Use a placeholder image that exists by default
        image = "gcr.io/cloudrun/hello"
        
        ports {
          container_port = 8080
        }

        # Environment variables
        env {
          name  = "ENVIRONMENT"
          value = "PROD"
        }
        env {
          name  = "DOMAIN_NAME"
          value = var.vercel_domain_name
        }
        env {
          name  = "CLIENT_ID"
          value = var.wb_prod_client_id
        }
        env {
          name  = "CLIENT_SECRET"
          value = var.wb_prod_client_secret
        }
        env {
          name  = "APPLICATION_VANITY_DOMAIN"
          value = var.wb_prod_application_vanity_domain
        }
        env {
          name  = "APPLICATION_ID"
          value = var.wb_prod_app_id
        }
        env {
          name  = "FIREBASE_SERVICE_ACCOUNT_KEY"
          value = base64decode(google_service_account_key.firebase_key.private_key)
        }
      }

      # Use the service account for the Cloud Run service
      service_account_name = google_service_account.cloud_run_sa.email
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  autogenerate_revision_name = true

  depends_on = [
    google_project_service.services["run.googleapis.com"],
    google_artifact_registry_repository.api_repo
  ]

  # Add lifecycle block to prevent replacement when image changes
  lifecycle {
    ignore_changes = [
      template[0].spec[0].containers[0].image
    ]
  }
}

# Cloud Run service for the API (Staging)
resource "google_cloud_run_service" "api_staging" {
  name     = "${var.project_id}-${var.api_name}-staging"
  location = var.region
  project  = google_project.project.project_id

  template {
    spec {
      containers {
        # Use a placeholder image that exists by default
        image = "gcr.io/cloudrun/hello"
        
        ports {
          container_port = 8080
        }

        # Environment variables
        env {
          name  = "ENVIRONMENT"
          value = "STAGING"
        }
        env {
          name  = "DOMAIN_NAME"
          value = var.vercel_project_name != "" ? "staging-${var.vercel_project_name}.vercel.app" : ""
        }
        env {
          name  = "CLIENT_ID"
          value = var.wb_staging_client_id
        }
        env {
          name  = "CLIENT_SECRET"
          value = var.wb_staging_client_secret
        }
        env {
          name  = "APPLICATION_VANITY_DOMAIN"
          value = var.wb_staging_application_vanity_domain
        }
        env {
          name  = "APPLICATION_ID"
          value = var.wb_staging_app_id
        }
        env {
          name  = "FIREBASE_SERVICE_ACCOUNT_KEY"
          value = base64decode(google_service_account_key.firebase_key.private_key)
        }
      }

      # Use the service account for the Cloud Run service
      service_account_name = google_service_account.cloud_run_sa.email
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  autogenerate_revision_name = true

  depends_on = [
    google_project_service.services["run.googleapis.com"],
    google_artifact_registry_repository.api_repo
  ]

  # Add lifecycle block to prevent replacement when image changes
  lifecycle {
    ignore_changes = [
      template[0].spec[0].containers[0].image
    ]
  }
}

# Allow unauthenticated access to the Cloud Run service (Production)
resource "google_cloud_run_service_iam_member" "public_access_prod" {
  service  = google_cloud_run_service.api_prod.name
  location = google_cloud_run_service.api_prod.location
  project  = google_project.project.project_id
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Allow unauthenticated access to the Cloud Run service (Staging)
resource "google_cloud_run_service_iam_member" "public_access_staging" {
  service  = google_cloud_run_service.api_staging.name
  location = google_cloud_run_service.api_staging.location
  project  = google_project.project.project_id
  role     = "roles/run.invoker"
  member   = "allUsers"
}


