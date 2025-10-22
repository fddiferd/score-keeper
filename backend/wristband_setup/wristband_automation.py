#!/usr/bin/env python3
"""
Wristband Setup Automation

Automates the complete Wristband application setup process with configurable models.
Based on WRISTBAND_SETUP.md documentation.

Usage:
    from wristband_automation import WristbandSetup, setup_default_wristband
    
    # Default setup
    result = await setup_default_wristband(client_id, client_secret, domain)
    
    # Custom setup
    setup = WristbandSetup(client_id, client_secret, domain)
    setup.permission_groups = [...]  # customize as needed
    result = await setup.run()
"""

import asyncio
import json
import logging
import base64
from typing import Dict, List, Optional, Any, Literal
import httpx
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)

# =============================================================================
# Models
# =============================================================================

@dataclass
class PermissionGroup:
    name: str
    display_name: str
    boundary_type: Literal["APPLICATION", "SELF", "TENANT"]
    permissions: List[str] = field(default_factory=list)

@dataclass
class Role:
    name: str
    display_name: str
    permission_groups: List[str] = field(default_factory=list)

@dataclass
class OAuth2Client:
    name: str = "Python Backend Client"
    client_type: str = "BACKEND_SERVER"
    redirect_uris: List[str] = field(default_factory=lambda: ["http://localhost:6001/api/auth/callback"])

@dataclass
class RolePolicy:
    policy_type: Literal["DEFAULT_SIGNUP_ROLES", "DEFAULT_IDP_USER_SYNC_ROLES"]
    role_names: List[str]

@dataclass
class AppSettings:
    login_url: str = "http://localhost:6001/api/auth/login"
    logout_url: str = "http://localhost:3001"
    self_signup_enabled: bool = True

@dataclass
class SetupResult:
    success: bool = False
    application_id: str = ""
    permission_group_ids: Dict[str, str] = field(default_factory=dict)
    role_ids: Dict[str, str] = field(default_factory=dict)
    oauth2_client_id: Optional[str] = None
    oauth2_client_secret: Optional[str] = None
    errors: List[str] = field(default_factory=list)

# =============================================================================
# Default Configurations from WRISTBAND_SETUP.md
# =============================================================================

DEFAULT_PERMISSION_GROUPS = [
    PermissionGroup(
        name="application",
        display_name="Application Permissions",
        boundary_type="APPLICATION",
        permissions=["tenant-discovery-workflow:execute", "tenant:read"]
    ),
    PermissionGroup(
        name="personal",
        display_name="Personal Permissions",
        boundary_type="SELF",
        permissions=["change-email-workflow:execute", "change-password-workflow:execute", "user:read", "user:update"]
    ),
    PermissionGroup(
        name="tenant-viewer",
        display_name="Tenant Viewer Permissions",
        boundary_type="TENANT",
        permissions=["new-user-invitation-request:read", "role:read", "tenant:read", "user:read"]
    ),
    PermissionGroup(
        name="tenant-admin",
        display_name="Tenant Admin Permissions",
        boundary_type="TENANT",
        permissions=["identity-provider:delete", "identity-provider:read", "identity-provider:view-protocol", 
                    "identity-provider:write", "new-user-invitation-workflow:execute", "tenant:create", 
                    "tenant:read", "tenant:update", "user:delete"]
    )
]

DEFAULT_ROLES = [
    Role("account-admin", "Account Admin", ["tenant-admin", "tenant-viewer", "personal", "application"]),
    Role("admin", "Admin", ["tenant-admin", "tenant-viewer", "personal", "application"]),
    Role("standard", "Standard", ["tenant-viewer", "personal", "application"]),
    Role("viewer", "Viewer", ["tenant-viewer", "personal", "application"])
]

DEFAULT_ROLE_POLICIES = [
    RolePolicy("DEFAULT_SIGNUP_ROLES", ["account-admin"]),
    RolePolicy("DEFAULT_IDP_USER_SYNC_ROLES", ["viewer"])
]

# =============================================================================
# Main Setup Class
# =============================================================================

class WristbandSetup:
    """Main class for Wristband setup automation"""
    
    def __init__(self, client_id: str, client_secret: str, application_domain: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.application_domain = application_domain
        self.base_url = f"https://{application_domain}/api/v1"
        
        # Configurable components - set to defaults
        self.permission_groups = DEFAULT_PERMISSION_GROUPS.copy()
        self.roles = DEFAULT_ROLES.copy()
        self.oauth2_client = OAuth2Client()
        self.role_policies = DEFAULT_ROLE_POLICIES.copy()
        self.app_settings = AppSettings()
        
        # Internal state
        self._client = httpx.AsyncClient()
        self._access_token: Optional[str] = None
        self._application_id: Optional[str] = None
        self._result = SetupResult()
    
    async def __aenter__(self):
        await self._authenticate()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self._client.aclose()
    
    async def run(self) -> SetupResult:
        """Run the complete setup process"""
        logger.info("Starting Wristband application setup...")
        
        try:
            async with self:
                self._result.application_id = self._application_id
                
                await self._create_permission_groups()
                await self._create_roles()
                await self._create_oauth2_client()
                await self._setup_role_policies()
                await self._configure_app_settings()
                
                self._result.success = len(self._result.errors) == 0
                logger.info("✅ Setup completed!" if self._result.success else "❌ Setup completed with errors")
                
        except Exception as e:
            error_msg = f"Setup failed: {str(e)}"
            logger.error(error_msg)
            self._result.errors.append(error_msg)
        
        return self._result
    
    async def _authenticate(self):
        """Authenticate and get application ID"""
        try:
            response = await self._client.post(
                f"{self.base_url}/oauth2/token",
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                auth=(self.client_id, self.client_secret),
                data={"grant_type": "client_credentials"}
            )
            response.raise_for_status()
            
            self._access_token = response.json()["access_token"]
            
            # Extract application ID from JWT
            payload = self._access_token.split('.')[1]
            payload += '=' * (4 - len(payload) % 4)
            token_data = json.loads(base64.b64decode(payload))
            self._application_id = token_data.get('aud') or token_data.get('app_id') or token_data.get('application_id')
            
            logger.info(f"Authenticated successfully. App ID: {self._application_id}")
            
        except Exception as e:
            raise Exception(f"Authentication failed: {e}")
    
    async def _request(self, method: str, endpoint: str, data: Optional[Dict] = None, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Make authenticated API request"""
        try:
            response = await self._client.request(
                method=method,
                url=f"{self.base_url}{endpoint}",
                headers={"Authorization": f"Bearer {self._access_token}", "Content-Type": "application/json"},
                json=data,
                params=params
            )
            response.raise_for_status()
            return response.json() if response.content else {}
        except httpx.HTTPStatusError as e:
            # Log the detailed error response for debugging
            logger.error(f"API Error {e.response.status_code}: {e.response.text}")
            raise
    
    async def _get_permission_boundaries(self) -> Dict[str, str]:
        """Get permission boundary IDs"""
        response = await self._request(
            "GET",
            f"/applications/{self._application_id}/permission-boundaries",
            params={
                "query": 'name in ("predefined:tenant","predefined:self","predefined:application") AND type eq "PREDEFINED"',
                "include_predefined_permission_boundaries": "true"
            }
        )
        
        boundaries = {}
        for boundary in response.get("items", []):
            if "tenant" in boundary["name"]:
                boundaries["TENANT"] = boundary["id"]
            elif "self" in boundary["name"]:
                boundaries["SELF"] = boundary["id"]
            elif "application" in boundary["name"]:
                boundaries["APPLICATION"] = boundary["id"]
        
        return boundaries
    
    async def _get_existing_permission_groups(self) -> Dict[str, Dict]:
        """Get existing permission groups"""
        try:
            response = await self._request("GET", f"/applications/{self._application_id}/permission-groups")
            groups = {}
            for group in response.get("items", []):
                groups[group["name"]] = group
            return groups
        except Exception as e:
            logger.warning(f"Could not fetch existing permission groups: {e}")
            return {}
    
    async def _get_existing_roles(self) -> Dict[str, Dict]:
        """Get existing roles"""
        try:
            response = await self._request("GET", f"/applications/{self._application_id}/roles")
            roles = {}
            for role in response.get("items", []):
                roles[role["name"]] = role
            return roles
        except Exception as e:
            logger.warning(f"Could not fetch existing roles: {e}")
            return {}
    
    async def _get_existing_clients(self) -> Dict[str, Dict]:
        """Get existing OAuth2 clients"""
        try:
            response = await self._request("GET", f"/applications/{self._application_id}/clients")
            clients = {}
            for client in response.get("items", []):
                clients[client["name"]] = client
            return clients
        except Exception as e:
            logger.warning(f"Could not fetch existing clients: {e}")
            return {}
    
    async def _get_existing_role_policies(self) -> Dict[str, Dict]:
        """Get existing role assignment policies"""
        try:
            response = await self._request("GET", f"/applications/{self._application_id}/role-assignment-policies")
            policies = {}
            for policy in response.get("items", []):
                policies[policy["type"]] = policy
            return policies
        except Exception as e:
            logger.warning(f"Could not fetch existing role policies: {e}")
            # Since we can't query existing policies, we'll use upsert mode
            return {}
    
    async def _create_permission_groups(self):
        """Create permission groups (or use existing ones)"""
        if not self.permission_groups:
            return
        
        logger.info(f"Setting up {len(self.permission_groups)} permission groups...")
        boundaries = await self._get_permission_boundaries()
        
        # First, check what permission groups already exist
        existing_groups = await self._get_existing_permission_groups()
        
        for group in self.permission_groups:
            try:
                # Check if group already exists (check both exact name and prefixed name)
                existing_group = existing_groups.get(group.name)
                if not existing_group:
                    # Try with app prefix format: app:domain:name
                    # Extract just the first part before any dash (automationtest from automationtest-donato)
                    domain_prefix = self.application_domain.split('.')[0].split('-')[0]
                    prefixed_name = f"app:{domain_prefix}:{group.name}"
                    existing_group = existing_groups.get(prefixed_name)
                
                if existing_group:
                    self._result.permission_group_ids[group.name] = existing_group["id"]
                    logger.info(f"✅ Permission group already exists: {group.display_name}")
                    continue
                
                boundary_id = boundaries.get(group.boundary_type)
                if not boundary_id:
                    logger.warning(f"Skipping {group.name} - boundary {group.boundary_type} not found")
                    continue
                
                # Create group
                response = await self._request("POST", "/permission-groups", {
                    "name": group.name,
                    "displayName": group.display_name,
                    "ownerId": self._application_id,
                    "ownerType": "APPLICATION",
                    "permissionBoundaryId": boundary_id,
                    "tenantVisibility": "ALL"
                })
                
                group_id = response["id"]
                self._result.permission_group_ids[group.name] = group_id
                logger.info(f"✅ Created permission group: {group.display_name}")
                
                # Assign permissions
                if group.permissions:
                    await self._assign_permissions_to_group(group_id, group.permissions)
                    
            except Exception as e:
                error_msg = f"Failed to create permission group {group.name}: {e}"
                logger.error(error_msg)
                self._result.errors.append(error_msg)
    
    async def _assign_permissions_to_group(self, group_id: str, permissions: List[str]):
        """Assign permissions to a group"""
        permission_values = ', '.join(f'"{perm}"' for perm in permissions)
        response = await self._request(
            "GET",
            f"/applications/{self._application_id}/permissions",
            params={
                "query": f'value in ({permission_values}) AND type eq "PREDEFINED"',
                "include_predefined_permissions": "true"
            }
        )
        
        permission_ids = [perm["id"] for perm in response.get("items", [])]
        if permission_ids:
            await self._request("POST", f"/permission-groups/{group_id}/assign-permissions", 
                               {"permissionIds": permission_ids})
    
    async def _create_roles(self):
        """Create roles (or use existing ones)"""
        if not self.roles:
            return
        
        logger.info(f"Setting up {len(self.roles)} roles...")
        
        # Check existing roles
        existing_roles = await self._get_existing_roles()
        
        for role in self.roles:
            try:
                # Check if role already exists (check both exact name and prefixed name)
                existing_role = existing_roles.get(role.name)
                if not existing_role:
                    # Try with app prefix format: app:domain:name
                    # Extract just the first part before any dash (automationtest from automationtest-donato)
                    domain_prefix = self.application_domain.split('.')[0].split('-')[0]
                    prefixed_name = f"app:{domain_prefix}:{role.name}"
                    existing_role = existing_roles.get(prefixed_name)
                
                if existing_role:
                    self._result.role_ids[role.name] = existing_role["id"]
                    logger.info(f"✅ Role already exists: {role.display_name}")
                    continue
                
                response = await self._request("POST", "/roles", {
                    "name": role.name,
                    "displayName": role.display_name,
                    "ownerId": self._application_id,
                    "ownerType": "APPLICATION",
                    "tenantVisibility": "ALL"
                })
                
                role_id = response["id"]
                self._result.role_ids[role.name] = role_id
                logger.info(f"✅ Created role: {role.display_name}")
                
                # Assign permission groups
                if role.permission_groups:
                    group_ids = [self._result.permission_group_ids[name] 
                               for name in role.permission_groups 
                               if name in self._result.permission_group_ids]
                    
                    if group_ids:
                        await self._request("POST", f"/roles/{role_id}/assign-permission-groups",
                                           {"permissionGroupIds": group_ids})
                        
            except Exception as e:
                error_msg = f"Failed to create role {role.name}: {e}"
                logger.error(error_msg)
                self._result.errors.append(error_msg)
    
    async def _create_oauth2_client(self):
        """Create OAuth2 client (always creates new client to get secret)"""
        if not self.oauth2_client:
            return
        
        logger.info("Setting up OAuth2 client...")
        
        try:
            # Always create a new client to ensure we get the client secret
            import time
            unique_name = f"{self.oauth2_client.name} {int(time.time())}"
            
            logger.info(f"Creating new OAuth2 client: {unique_name}")
            response = await self._request("POST", "/clients", {
                "type": self.oauth2_client.client_type,
                "name": unique_name,
                "ownerId": self._application_id,
                "ownerType": "APPLICATION",
                "redirectUris": self.oauth2_client.redirect_uris,
                "grantTypes": ["AUTHORIZATION_CODE", "REFRESH_TOKEN"]
            })
            
            self._result.oauth2_client_id = response.get("clientId") or response.get("id")
            self._result.oauth2_client_secret = response.get("clientSecret") or response.get("secret")
            
            logger.info(f"✅ Created OAuth2 client: {self._result.oauth2_client_id}")
            if self._result.oauth2_client_secret:
                logger.info(f"🔑 Client Secret: {self._result.oauth2_client_secret}")
                logger.warning("⚠️  Save your Client Secret securely!")
            else:
                logger.warning("⚠️  Client secret not found in response")
                
        except Exception as e:
            error_msg = f"Failed to create OAuth2 client: {e}"
            logger.error(error_msg)
            self._result.errors.append(error_msg)
    
    async def _setup_role_policies(self):
        """Setup role assignment policies (or use existing ones)"""
        if not self.role_policies:
            return
        
        logger.info("Setting up role assignment policies...")
        
        # Get existing policies
        existing_policies = await self._get_existing_role_policies()
        
        for policy in self.role_policies:
            try:
                # Check if policy already exists
                if policy.policy_type in existing_policies:
                    logger.info(f"✅ Role assignment policy already exists: {policy.policy_type}")
                    continue
                
                role_ids = [self._result.role_ids[name] for name in policy.role_names 
                           if name in self._result.role_ids]
                
                if role_ids:
                    # Use upsert=true to handle existing policies gracefully
                    await self._request("POST", "/role-assignment-policies", {
                        "type": policy.policy_type,
                        "ownerId": self._application_id,
                        "ownerType": "APPLICATION",
                        "roleIds": role_ids
                    }, params={"upsert": "true"})
                    logger.info(f"✅ Created/Updated policy: {policy.policy_type}")
                    
            except Exception as e:
                error_msg = f"Failed to create policy {policy.policy_type}: {e}"
                logger.error(error_msg)
                self._result.errors.append(error_msg)
    
    async def _configure_app_settings(self):
        """Configure application settings"""
        if not self.app_settings:
            return
        
        logger.info("Configuring application settings...")
        
        try:
            # Apply the settings
            await self._request("PATCH", f"/applications/{self._application_id}", {
                "loginUrl": self.app_settings.login_url,
                "logoutUrls": [self.app_settings.logout_url],  # Note: logoutUrls is an array
                "signupEnabled": self.app_settings.self_signup_enabled  # Note: signupEnabled not selfSignUpEnabled
            })
            
            # Verify the settings were actually applied
            current_settings = await self._request("GET", f"/applications/{self._application_id}")
            
            # Check each setting
            verification_errors = []
            
            if current_settings.get("loginUrl") != self.app_settings.login_url:
                verification_errors.append(f"Login URL not updated: expected '{self.app_settings.login_url}', got '{current_settings.get('loginUrl')}'")
            
            expected_logout_urls = [self.app_settings.logout_url]
            if current_settings.get("logoutUrls") != expected_logout_urls:
                verification_errors.append(f"Logout URLs not updated: expected '{expected_logout_urls}', got '{current_settings.get('logoutUrls')}'")
            
            if current_settings.get("signupEnabled") != self.app_settings.self_signup_enabled:
                verification_errors.append(f"Signup enabled not updated: expected '{self.app_settings.self_signup_enabled}', got '{current_settings.get('signupEnabled')}'")
            
            if verification_errors:
                error_msg = f"Application settings verification failed: {'; '.join(verification_errors)}"
                logger.error(error_msg)
                self._result.errors.append(error_msg)
            else:
                logger.info("✅ Configured and verified application settings")
            
        except Exception as e:
            error_msg = f"Failed to configure application settings: {e}"
            logger.error(error_msg)
            self._result.errors.append(error_msg)
    
    def print_summary(self):
        """Print setup summary"""
        print("\n" + "="*50)
        print("🎉 WRISTBAND SETUP COMPLETE!" if self._result.success else "⚠️  SETUP COMPLETED WITH ERRORS")
        print("="*50)
        
        print(f"\n📱 Application ID: {self._result.application_id}")
        
        if self._result.permission_group_ids:
            print(f"\n📋 Permission Groups ({len(self._result.permission_group_ids)}):")
            for name, id in self._result.permission_group_ids.items():
                print(f"  • {name}: {id}")
        
        if self._result.role_ids:
            print(f"\n👥 Roles ({len(self._result.role_ids)}):")
            for name, id in self._result.role_ids.items():
                print(f"  • {name}: {id}")
        
        if self._result.oauth2_client_id:
            print(f"\n🔑 OAuth2 Client:")
            print(f"  • Client ID: {self._result.oauth2_client_id}")
            if self._result.oauth2_client_secret:
                print(f"  • Client Secret: {self._result.oauth2_client_secret}")
                print("  ⚠️  IMPORTANT: Save these credentials securely!")
            else:
                print("  • Client Secret: (not available)")
        
        if self._result.errors:
            print(f"\n❌ Errors ({len(self._result.errors)}):")
            for error in self._result.errors:
                print(f"  • {error}")
        
        print("\n" + "="*50)

# =============================================================================
# Convenience Functions
# =============================================================================

async def setup_default_wristband(client_id: str, client_secret: str, application_domain: str) -> SetupResult:
    """Setup Wristband with default configuration"""
    setup = WristbandSetup(client_id, client_secret, application_domain)
    result = await setup.run()
    setup.print_summary()
    return result

async def setup_production_wristband(
    client_id: str, 
    client_secret: str, 
    application_domain: str,
    production_domain: str
) -> SetupResult:
    """Setup Wristband for production with custom URLs"""
    setup = WristbandSetup(client_id, client_secret, application_domain)
    
    # Customize for production
    setup.oauth2_client.redirect_uris = [f"https://{production_domain}/api/auth/callback"]
    setup.app_settings.login_url = f"https://{production_domain}/api/auth/login"
    setup.app_settings.logout_url = f"https://{production_domain}"
    
    result = await setup.run()
    setup.print_summary()
    return result

# =============================================================================
# Example Usage
# =============================================================================

async def main():
    """Example usage"""
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    
    # Replace with your actual credentials
    client_id = 'xghrqd3olza7dghx4uynrv4iue'
    client_secret = 'a5b15333445f30e81a683dbd6b5d964d'
    application_domain = 'scorekeeperdev-scorekeeper.us.wristband.dev'
    
    # Option 1: Default setup
    result = await setup_default_wristband(client_id, client_secret, application_domain)
    
    # Option 2: Custom setup
    # setup = WristbandSetup(client_id, client_secret, application_domain)
    # setup.roles = [Role("admin", "Administrator", ["tenant-admin", "personal"])]  # Custom roles
    # result = await setup.run()
    # setup.print_summary()

if __name__ == "__main__":
    asyncio.run(main())
