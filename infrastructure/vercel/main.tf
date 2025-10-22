# Vercel Infrastructure Module
# This module creates and configures the Vercel project for the Score Keeper frontend
# Note: Deployments are handled via GitHub Actions, not Git integration

# Create the Vercel project
resource "vercel_project" "frontend" {
  name      = var.vercel_project_name
  framework = "nextjs"
  
  # No git_repository - deployments are handled via GitHub Actions
}

# Configure environment variables for the Vercel project
resource "vercel_project_environment_variable" "api_url" {
  project_id = vercel_project.frontend.id
  key        = "NEXT_PUBLIC_API_URL"
  value      = var.cloud_run_url
  target     = ["production", "preview", "development"]
}

# Add custom domain to the Vercel project (production)
resource "vercel_project_domain" "custom_domain" {
  count = var.vercel_domain_name != "" ? 1 : 0
  
  project_id = vercel_project.frontend.id
  domain     = var.vercel_domain_name
}

# Note: Staging deployments create a consistent alias in the preview environment
# via the deployment script: staging-score-keeper.vercel.app

