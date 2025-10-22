output "vercel_project_id" {
  description = "The Vercel project ID"
  value       = vercel_project.frontend.id
}

output "vercel_project_name" {
  description = "The Vercel project name"
  value       = vercel_project.frontend.name
}

output "vercel_deployment_url" {
  description = "The production deployment URL"
  value       = var.vercel_domain_name != "" ? "https://${var.vercel_domain_name}" : "https://${vercel_project.frontend.name}.vercel.app"
}

output "vercel_staging_preview_url" {
  description = "Staging deployments use a consistent Vercel preview alias"
  value       = "https://staging-${vercel_project.frontend.name}.vercel.app"
}

output "vercel_domain" {
  description = "The custom domain linked to the project"
  value       = var.vercel_domain_name != "" ? var.vercel_domain_name : "No custom domain configured"
}

