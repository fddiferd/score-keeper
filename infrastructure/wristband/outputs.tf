output "application_id" {
  description = "Wristband application ID"
  value       = local.application_id
}

output "oauth2_client_id" {
  description = "OAuth2 client ID"
  value       = restapi_object.oauth2_client.id
}

output "oauth2_client_secret" {
  description = "OAuth2 client secret (SAVE SECURELY!)"
  value       = try(jsondecode(restapi_object.oauth2_client.create_response).secret, null)
  sensitive   = true
}

output "permission_group_ids" {
  description = "Map of permission group names to IDs"
  value       = local.all_permission_groups
}

output "role_ids" {
  description = "Map of role names to IDs"
  value       = local.all_roles
}

output "login_url" {
  description = "Configured login URL"
  value       = "${var.frontend_url}/api/auth/login"
}

output "logout_url" {
  description = "Configured logout URL"
  value       = var.frontend_url
}

