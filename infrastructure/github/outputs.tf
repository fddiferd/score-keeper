output "repository_name" {
  description = "GitHub repository name"
  value       = var.repository_name
}

output "secrets_uploaded" {
  description = "Summary of uploaded secrets"
  value = {
    repository_secrets = "5 secrets uploaded"
    staging_secrets    = "7 environment secrets uploaded"
    prod_secrets       = "7 environment secrets uploaded"
    total              = "19 secrets uploaded"
  }
}

