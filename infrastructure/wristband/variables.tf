variable "application_vanity_domain" {
  description = "Wristband application vanity domain"
  type        = string
}

variable "client_id" {
  description = "Wristband application client ID"
  type        = string
}

variable "client_secret" {
  description = "Wristband application client secret"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "frontend_url" {
  description = "Frontend URL for logout redirects"
  type        = string
}

variable "backend_url" {
  description = "Backend URL for OAuth callbacks and login"
  type        = string
}

variable "self_signup_enabled" {
  description = "Enable self-service signup"
  type        = bool
  default     = true
}

variable "application_id" {
  description = "Wristband application ID (extracted from OAuth token)"
  type        = string
}

variable "access_token" {
  description = "OAuth access token for Wristband API"
  type        = string
  sensitive   = true
}

