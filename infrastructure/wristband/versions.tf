terraform {
  required_providers {
    restapi = {
      source  = "Mastercard/restapi"
      version = "~> 1.18"
      configuration_aliases = [ restapi ]
    }
    http = {
      source = "hashicorp/http"
      version = "~> 3.4"
    }
  }
}

