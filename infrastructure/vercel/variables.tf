variable "vercel_api_token" {
  description = "Vercel API token for authentication"
  type        = string
  sensitive   = true
}

variable "vercel_project_name" {
  description = "The name of the Vercel project"
  type        = string
}

variable "vercel_domain_name" {
  description = "The custom domain to link to the Vercel project"
  type        = string
}

variable "cloud_run_url" {
  description = "The Cloud Run API URL (from GCP infrastructure)"
  type        = string
}

