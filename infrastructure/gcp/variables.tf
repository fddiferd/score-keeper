variable "project_id" {
  description = "The GCP project ID"
  type        = string
  default     = "your-gcp-project-id"
}

variable "billing_account_id" {
  description = "The GCP billing account ID"
  type        = string
  default     = "YOUR-BILLING-ACCOUNT-ID"
}

variable "region" {
  description = "The default GCP region for resources"
  type        = string
  default     = "us-central1"
}

variable "firestore_location" {
  description = "The location for Firestore database"
  type        = string
  default     = "us-central"
}

variable "app_name" {
  description = "The base name of the application (used in resource naming)"
  type        = string
  default     = "your-app-name"
}

variable "api_name" {
  description = "The name of the API component"
  type        = string
  default     = "api"
}

variable "api_repo_name" {
  description = "The name of the API repository"
  type        = string
  default     = "api-repo"
}

# Wristband variables for Staging
variable "wb_staging_application_vanity_domain" {
  description = "Wristband STAGING application vanity domain"
  type        = string
  default     = ""
}

variable "wb_staging_client_id" {
  description = "Wristband STAGING client ID"
  type        = string
  default     = ""
}

variable "wb_staging_client_secret" {
  description = "Wristband STAGING client secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "wb_staging_app_id" {
  description = "Wristband STAGING application ID"
  type        = string
  default     = ""
}

# Wristband variables for Production
variable "wb_prod_application_vanity_domain" {
  description = "Wristband PROD application vanity domain"
  type        = string
  default     = ""
}

variable "wb_prod_client_id" {
  description = "Wristband PROD client ID"
  type        = string
  default     = ""
}

variable "wb_prod_client_secret" {
  description = "Wristband PROD client secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "wb_prod_app_id" {
  description = "Wristband PROD application ID"
  type        = string
  default     = ""
}

# Vercel variables
variable "vercel_project_name" {
  description = "The name of the Vercel project"
  type        = string
  default     = ""
}

variable "vercel_domain_name" {
  description = "The custom domain for the Vercel project"
  type        = string
  default     = ""
}


