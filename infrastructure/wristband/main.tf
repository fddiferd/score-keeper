# Wristband Infrastructure Module
# Automates the complete Wristband application setup via REST API

locals {
  base_url = "https://${var.application_vanity_domain}/api/v1"
  
  # Permission Groups Configuration
  permission_groups = {
    application = {
      name          = "application"
      display_name  = "Application Permissions"
      boundary_type = "APPLICATION"
      permissions   = ["tenant-discovery-workflow:execute", "tenant:read"]
    }
    personal = {
      name          = "personal"
      display_name  = "Personal Permissions"
      boundary_type = "SELF"
      permissions   = ["change-email-workflow:execute", "change-password-workflow:execute", "user:read", "user:update"]
    }
    tenant_viewer = {
      name          = "tenant-viewer"
      display_name  = "Tenant Viewer Permissions"
      boundary_type = "TENANT"
      permissions   = ["new-user-invitation-request:read", "role:read", "tenant:read", "user:read"]
    }
    tenant_admin = {
      name          = "tenant-admin"
      display_name  = "Tenant Admin Permissions"
      boundary_type = "TENANT"
      permissions = [
        "identity-provider:delete", "identity-provider:read", "identity-provider:view-protocol",
        "identity-provider:write", "new-user-invitation-workflow:execute", "tenant:create",
        "tenant:read", "tenant:update", "user:delete"
      ]
    }
  }
  
  # Roles Configuration
  roles = {
    account_admin = {
      name              = "account-admin"
      display_name      = "Account Admin"
      permission_groups = ["tenant-admin", "tenant-viewer", "personal", "application"]
    }
    admin = {
      name              = "admin"
      display_name      = "Admin"
      permission_groups = ["tenant-admin", "tenant-viewer", "personal", "application"]
    }
    standard = {
      name              = "standard"
      display_name      = "Standard"
      permission_groups = ["tenant-viewer", "personal", "application"]
    }
    viewer = {
      name              = "viewer"
      display_name      = "Viewer"
      permission_groups = ["tenant-viewer", "personal", "application"]
    }
  }
}

# Note: OAuth token is obtained at the root level and configured in the restapi provider
locals {
  # Application ID is passed as a variable from root configuration
  application_id = var.application_id
}

# Get permission boundaries using HTTP data source for better list handling
data "http" "permission_boundaries" {
  url    = "${local.base_url}/applications/${local.application_id}/permission-boundaries?query=name%20in%20(%22predefined:tenant%22,%22predefined:self%22,%22predefined:application%22)%20AND%20type%20eq%20%22PREDEFINED%22&include_predefined_permission_boundaries=true"
  method = "GET"
  
  request_headers = {
    "Authorization" = "Bearer ${var.access_token}"
    "Content-Type"  = "application/json"
  }
}

locals {
  boundaries_response = jsondecode(data.http.permission_boundaries.response_body)
  boundaries_items = try(local.boundaries_response.items, [])
  
  boundaries = {
    for boundary in local.boundaries_items :
    (
      strcontains(boundary.name, "tenant") ? "TENANT" :
      strcontains(boundary.name, "self") ? "SELF" :
      strcontains(boundary.name, "application") ? "APPLICATION" :
      "UNKNOWN"
    ) => boundary.id
  }
}

# Get existing permission groups to avoid duplicates
data "http" "existing_permission_groups" {
  url    = "${local.base_url}/applications/${local.application_id}/permission-groups"
  method = "GET"
  
  request_headers = {
    "Authorization" = "Bearer ${var.access_token}"
    "Content-Type"  = "application/json"
  }
  
  depends_on = [data.http.permission_boundaries]
}

locals {
  groups_response = try(jsondecode(data.http.existing_permission_groups.response_body), {})
  groups_items = try(local.groups_response.items, [])
  
  existing_groups = {
    for group in local.groups_items :
    group.name => group
  }
  
  # Note: Since app was cleared, create all groups
  groups_to_create = local.permission_groups
}

# Create Permission Groups
resource "restapi_object" "permission_groups" {
  
  for_each = local.groups_to_create
  
  path = "/permission-groups"
  
  data = jsonencode({
    name                  = each.value.name
    displayName           = each.value.display_name
    ownerId               = local.application_id
    ownerType             = "APPLICATION"
    permissionBoundaryId  = local.boundaries[each.value.boundary_type]
    tenantVisibility      = "ALL"
  })
  
  id_attribute = "id"
}

locals {
  # Create a lookup for existing groups by simple name
  existing_groups_by_simple_name = {
    for name, group in local.existing_groups :
    element(split(":", name), length(split(":", name)) - 1) => group.id
  }
  
  # Combine created and existing permission groups
  all_permission_groups = merge(
    # Existing groups that weren't created
    {
      for key, group in local.permission_groups :
      group.name => try(
        local.existing_groups[group.name].id,
        local.existing_groups_by_simple_name[group.name]
      )
      if contains(keys(local.existing_groups), group.name) ||
         contains(keys(local.existing_groups_by_simple_name), group.name)
    },
    # Newly created groups
    {
      for key, resource in restapi_object.permission_groups :
      local.permission_groups[key].name => resource.id
    }
  )
}

# Get permissions for each group and assign them
data "http" "permissions" {
  
  for_each = local.permission_groups
  
  url    = "${local.base_url}/applications/${local.application_id}/permissions?query=value%20in%20(${join(",", [for p in each.value.permissions : "%22${urlencode(p)}%22"])})%20AND%20type%20eq%20%22PREDEFINED%22&include_predefined_permissions=true"
  method = "GET"
  
  request_headers = {
    "Authorization" = "Bearer ${var.access_token}"
    "Content-Type"  = "application/json"
  }
  
  depends_on = [restapi_object.permission_groups]
}

# Assign permissions to groups
resource "restapi_object" "assign_permissions" {
  
  for_each = {
    for key, group in local.permission_groups :
    key => group
    if length(group.permissions) > 0
  }
  
  path = "/permission-groups/${local.all_permission_groups[each.value.name]}/assign-permissions"
  
  data = jsonencode({
    permissionIds = [
      for perm in try(jsondecode(data.http.permissions[each.key].response_body).items, []) :
      perm.id
    ]
  })
  
  # This is a one-time assignment action (doesn't return an ID)
  create_method = "POST"
  # Use a synthetic ID since the API doesn't return one
  object_id = "${each.key}-permissions-assigned"
  
  # Skip deletion - this is an action, not a deletable resource
  lifecycle {
    prevent_destroy = false
    ignore_changes = all
  }
  
  depends_on = [restapi_object.permission_groups, data.http.permissions]
}

# Get existing roles to avoid duplicates
data "http" "existing_roles" {
  url    = "${local.base_url}/applications/${local.application_id}/roles"
  method = "GET"
  
  request_headers = {
    "Authorization" = "Bearer ${var.access_token}"
    "Content-Type"  = "application/json"
  }
  
  depends_on = [restapi_object.assign_permissions]
}

locals {
  roles_response = try(jsondecode(data.http.existing_roles.response_body), {})
  roles_items = try(local.roles_response.items, [])
  
  existing_roles = {
    for role in local.roles_items :
    role.name => role
  }
  
  # Note: Since app was cleared, create all roles
  roles_to_create = local.roles
}

# Create Roles
resource "restapi_object" "roles" {
  
  for_each = local.roles_to_create
  
  path = "/roles"
  
  data = jsonencode({
    name             = each.value.name
    displayName      = each.value.display_name
    ownerId          = local.application_id
    ownerType        = "APPLICATION"
    tenantVisibility = "ALL"
  })
  
  id_attribute = "id"
  
  depends_on = [restapi_object.assign_permissions]
}

locals {
  # Create a lookup for existing roles by simple name
  existing_roles_by_simple_name = {
    for name, role in local.existing_roles :
    element(split(":", name), length(split(":", name)) - 1) => role.id
  }
  
  # Combine created and existing roles
  all_roles = merge(
    # Existing roles that weren't created
    {
      for key, role in local.roles :
      role.name => try(
        local.existing_roles[role.name].id,
        local.existing_roles_by_simple_name[role.name]
      )
      if contains(keys(local.existing_roles), role.name) ||
         contains(keys(local.existing_roles_by_simple_name), role.name)
    },
    # Newly created roles
    {
      for key, resource in restapi_object.roles :
      local.roles[key].name => resource.id
    }
  )
}

# Assign permission groups to roles
resource "restapi_object" "assign_permission_groups" {
  
  for_each = {
    for key, role in local.roles :
    key => role
    if length(role.permission_groups) > 0
  }
  
  path = "/roles/${restapi_object.roles[each.key].id}/assign-permission-groups"
  
  data = jsonencode({
    permissionGroupIds = [
      for group_name in each.value.permission_groups :
      local.all_permission_groups[group_name]
    ]
  })
  
  create_method = "POST"
  # Use a synthetic ID since the API doesn't return one
  object_id = "${each.key}-permission-groups-assigned"
  
  # Skip deletion - this is an action, not a deletable resource
  lifecycle {
    prevent_destroy = false
    ignore_changes = all
  }
  
  depends_on = [restapi_object.roles, restapi_object.permission_groups]
}

# Create OAuth2 Client (always creates new to get secret)
resource "restapi_object" "oauth2_client" {
  
  path = "/clients"
  
  data = jsonencode({
    type         = "BACKEND_SERVER"
    name         = "Backend Client ${var.environment} ${timestamp()}"
    ownerId      = local.application_id
    ownerType    = "APPLICATION"
    redirectUris = ["${var.frontend_url}/api/auth/callback"]
    grantTypes   = ["AUTHORIZATION_CODE", "REFRESH_TOKEN"]
  })
  
  id_attribute = "id"
  
  depends_on = [restapi_object.assign_permission_groups]
  
  lifecycle {
    ignore_changes = [data]
  }
}

# Setup role assignment policies (matching wristband_automation.py DEFAULT_ROLE_POLICIES)
# Per Wristband API docs:
#  - POST /role-assignment-policies?upsert=true (create/update)
#  - GET /role-assignment-policies/{id} (read)
# From wristband_automation.py lines 115-118:
#   DEFAULT_ROLE_POLICIES = [
#     RolePolicy("DEFAULT_SIGNUP_ROLES", ["account-admin"]),
#     RolePolicy("DEFAULT_IDP_USER_SYNC_ROLES", ["viewer"])
#   ]

# Role Assignment Policies - Single resource that configures both default role policies
resource "restapi_object" "role_assignment_policies" {
  
  path = "/role-assignment-policies"
  
  data = jsonencode({
    ownerId                 = local.application_id
    ownerType               = "APPLICATION"
    defaultSignupRoles      = [local.all_roles["account-admin"]]
    defaultIdpUserSyncRoles = [local.all_roles["viewer"]]
  })
  
  query_string  = "upsert=true"
  create_method = "POST"
  id_attribute  = "id"
  
  depends_on = [restapi_object.roles, restapi_object.oauth2_client]
}

# Configure application settings
resource "restapi_object" "app_settings" {
  
  path = "/applications/${local.application_id}"
  
  data = jsonencode({
    loginUrl      = "${var.frontend_url}/api/auth/login"
    logoutUrls    = [var.frontend_url]
    signupEnabled = var.self_signup_enabled
  })
  
  # Application already exists, just update it
  create_method = "PATCH"
  update_method = "PATCH"
  object_id     = local.application_id
  
  # Skip deletion - app settings are part of the application, not deletable separately
  lifecycle {
    prevent_destroy = false
    ignore_changes = all
  }
  
  depends_on = [restapi_object.role_assignment_policies]
}

