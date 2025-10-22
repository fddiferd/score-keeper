from typing import Any
import httpx
import logging
import os

from models.wristband.user import User, UsersResponse, UserProfileUpdate
from models.wristband.role import Role, RoleList
from models.wristband.tenant import Tenant, TenantUpdateRequest, TenantOption
from models.wristband.idp import IdentityProvider, IdentityProviderRequest, IdpOverrideToggle, IdpRedirectUrlConfig, UpsertGoogleSamlMetadata
from models.wristband.invite import NewUserInvitationRequest, NewUserInvitationRequestsResponse

logger = logging.getLogger(__name__)

class WristbandClient:
    def __init__(self) -> None:
        application_vanity_domain = os.getenv("APPLICATION_VANITY_DOMAIN")
        if not application_vanity_domain:
            raise ValueError('wristband_application_vanity_domain required for WristbandApiClient')

        self.base_url: str = f'https://{application_vanity_domain}/api/v1'
        self.headers: dict[str, str] = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }

        self.client = httpx.AsyncClient()

    ############################################################################################
    # MARK: User APIs
    ############################################################################################
    async def get_user_info(self, user_id: str, access_token: str, include_roles: bool = False) -> User:
        # Get User API - https://docs.wristband.dev/reference/getuserv1
        response: httpx.Response = await self.client.get(
            self.base_url + f'/users/{user_id}',
            headers={
                **self.headers,
                'Authorization': f'Bearer {access_token}'
            }
        )

        if response.status_code != 200:
            raise ValueError(f'Error calling get_user_info: {response.status_code} - {response.text}')

        data = response.json() if response.content else {}

        if include_roles:
            roles_list = await self.resolve_assigned_roles_for_users([user_id], access_token)
            data['roles'] = [role.sku for role in roles_list.items[0].roles]

        return User(**data)

    async def update_user(self, user_id: str, user_data: UserProfileUpdate, access_token: str) -> User:
        # Update User API - https://docs.wristband.dev/reference/patchuserv1
        # Build payload from only the fields that are provided (not None)
        payload = {}
        if user_data.givenName is not None:
            payload['givenName'] = user_data.givenName
        if user_data.familyName is not None:
            payload['familyName'] = user_data.familyName
        if user_data.nickname is not None:
            payload['nickname'] = user_data.nickname

        response: httpx.Response = await self.client.patch(
            self.base_url + f'/users/{user_id}',
            headers={
                **self.headers,
                'Authorization': f'Bearer {access_token}'
            },
            json=payload,
        )

        if response.status_code != 200:
            raise ValueError(f'Error calling update_user: {response.status_code} - {response.text}')

        data = response.json() if response.content else {}
        return User(**data)

    async def change_password(self, user_id: str, current_password: str, new_password: str, access_token: str) -> None:
        # Change Password API - https://docs.wristband.dev/reference/changepasswordv1
        response: httpx.Response = await self.client.post(
            self.base_url + '/change-password',
            headers={
                **self.headers,
                'Authorization': f'Bearer {access_token}'
            },
            json={
                'userId': user_id,
                'currentPassword': current_password,
                'newPassword': new_password
            },
        )

        if response.status_code != 200:
            raise ValueError(f'Error changing password: {response.status_code} - {response.text}')

    async def deactivate_user(self, user_id: str, access_token: str) -> User:
        # Deactivate User API - https://docs.wristband.dev/reference/patchuserv1
        response: httpx.Response = await self.client.patch(
            self.base_url + f'/users/{user_id}',
            headers={
                **self.headers,
                'Authorization': f'Bearer {access_token}'
            },
            json={
                'status': 'INACTIVE'
            },
        )

        if response.status_code != 200:
            raise ValueError(f'Error deactivating user: {response.status_code} - {response.text}')

        data = response.json() if response.content else {}
        return User(**data)

    async def delete_user(self, user_id: str, access_token: str) -> None:
        # Delete User API - https://docs.wristband.dev/reference/deleteuserv1
        response: httpx.Response = await self.client.delete(
            self.base_url + f'/users/{user_id}',
            headers={
                **self.headers,
                'Authorization': f'Bearer {access_token}'
            }
        )

        if response.status_code != 204:
            raise ValueError(f'Error deleting user: {response.status_code} - {response.text}')

    ############################################################################################
    # MARK: User Invitation APIs
    ############################################################################################
    async def invite_user(self, tenant_id: str, email: str, roles_to_assign: list[str], access_token: str) -> None:
        # Invite New User API - https://docs.wristband.dev/reference/inviteuserv1
        response: httpx.Response = await self.client.post(
            self.base_url + '/new-user-invitation/invite-user',
            headers={
                **self.headers,
                'Authorization': f'Bearer {access_token}'
            },
            json={
                'tenantId': tenant_id,
                'email': email,
                'rolesToAssign': roles_to_assign
            }
        )

        if response.status_code not in [200, 201, 204]:
            raise ValueError(f'Error calling invite_user: {response.status_code} - {response.text}')


    async def query_new_user_invitation_requests(self, tenant_id: str, access_token: str, start_index: int = 1, count: int = 50) -> list[NewUserInvitationRequest]:
        # Query New User Invitation Requests API - https://docs.wristband.dev/reference/querynewuserinvitationrequestsfilteredbytenantv1
        all_invitations = []
        current_start_index = start_index
        
        while True:
            params = {
                'startIndex': current_start_index,
                'count': count,
            }
            
            response: httpx.Response = await self.client.get(
                self.base_url + f'/tenants/{tenant_id}/new-user-invitation-requests',
                headers={
                    **self.headers,
                    'Authorization': f'Bearer {access_token}'
                },
                params=params
            )
            
            if response.status_code != 200:
                raise ValueError(f'Error calling query_new_user_invitation_requests: {response.status_code} - {response.text}')
            
            data = response.json() if response.content else {}
            invitation_response = NewUserInvitationRequestsResponse(**data)
            
            # Collect invitations from this page
            all_invitations.extend(invitation_response.items)
            
            # Check if we have more pages to fetch
            if current_start_index + invitation_response.itemsPerPage >= invitation_response.totalResults:
                break
                
            # Move to next page (startIndex is 1-based)
            current_start_index += invitation_response.itemsPerPage
        
        return all_invitations

    async def cancel_new_user_invitation(self, invitation_id: str, access_token: str) -> None:
        # Cancel New User Invite API - https://docs.wristband.dev/reference/cancelnewuserinvitev1
        response: httpx.Response = await self.client.post(
            self.base_url + '/new-user-invitation/cancel-invite',
            headers={
                **self.headers,
                'Authorization': f'Bearer {access_token}'
            },
            json={
                'newUserInvitationRequestId': invitation_id
            }
        )

        if response.status_code not in [200, 201, 204]:
            raise ValueError(f'Error calling cancel_new_user_invitation: {response.status_code} - {response.text}')

    ############################################################################################
    # MARK: Tenant Users APIs
    ############################################################################################
    async def query_tenant_users(self, tenant_id: str, access_token: str, include_roles: bool = False) -> list[User]:
        # Query Tenant Users API - https://docs.wristband.dev/reference/querytenantusersv1
        start_index = 0
        count = 50
        all_users = []
        
        while True:
            params = {
                'startIndex': start_index,
                'count': count,
            }
            
            response: httpx.Response = await self.client.get(
                self.base_url + f'/tenants/{tenant_id}/users',
                headers={
                    **self.headers,
                    'Authorization': f'Bearer {access_token}'
                },
                params=params
            )

            if response.status_code != 200:
                raise ValueError(f'Error calling query_tenant_users: {response.status_code} - {response.text}')

            data = response.json() if response.content else {}
            user_list = UsersResponse(**data)
            
            # Collect users from this page
            all_users.extend(user_list.items)
            
            # Check if we have more pages to fetch
            if start_index + user_list.itemsPerPage >= user_list.totalResults:
                break
                
            # Move to next page
            start_index += user_list.itemsPerPage

        if not include_roles:
            return all_users
        else:
            # Get user ids from user list
            user_ids = [user.id for user in all_users]
            # Get roles for users
            roles = await self.resolve_assigned_roles_for_users(user_ids, access_token)
            # Add roles to users
            for user in all_users:
                # Find the UserRoles object for this user
                user_roles = next((ur for ur in roles.items if ur.userId == user.id), None)
                if user_roles:
                    # Extract role names from the roles list
                    user.roles = [role.displayName for role in user_roles.roles]
                else:
                    user.roles = []
            return all_users

    ############################################################################################
    # MARK: Role APIs
    ############################################################################################
    async def resolve_assigned_roles_for_users(self, user_ids: list[str], access_token: str) -> RoleList:
        # Resolve Assigned Roles For Users API - https://docs.wristband.dev/reference/resolveassignedrolesforusersv1
        response: httpx.Response = await self.client.post(
            self.base_url + '/users/resolve-assigned-roles',
            headers={
                **self.headers,
                'Authorization': f'Bearer {access_token}'
            },
            json={
                'userIds': user_ids
            }
        )

        if response.status_code != 200:
            raise ValueError(f'Error calling resolve_assigned_roles_for_users: {response.status_code} - {response.text}')
        data = response.json() if response.content else {}
        return RoleList(**data)

    async def resolve_assignable_roles_for_user(self, user_id: str, access_token: str) -> list[Role]:
        # Resolve Assignable Roles for a User API - https://docs.wristband.dev/reference/resolveassignablerolesforuserv1
        response: httpx.Response = await self.client.post(
            self.base_url + f'/users/{user_id}/resolve-assignable-roles',
            headers={
                **self.headers,
                'Authorization': f'Bearer {access_token}'
            }
        )

        if response.status_code != 200:
            raise ValueError(f'Error calling resolve_assignable_roles_for_user: {response.status_code} - {response.text}')

        data = response.json() if response.content else {}
        # The API returns a list with items property
        items = data.get('items', []) if isinstance(data, dict) else data
        return [Role(**item) for item in items]

    async def get_user_assigned_roles(self, user_id: str, access_token: str) -> list[Role]:
        # Get user's currently assigned roles using the existing resolve_assigned_roles_for_users method
        roles_response = await self.resolve_assigned_roles_for_users([user_id], access_token)
        user_roles = next((user_role for user_role in roles_response.items if user_role.userId == user_id), None)
        return user_roles.roles if user_roles else []

    async def query_tenant_roles(self, tenant_id: str, access_token: str) -> list[Role]:
        # Query Tenant Roles API - https://docs.wristband.dev/reference/querytenantrolesv1
        response: httpx.Response = await self.client.get(
            self.base_url + f'/tenants/{tenant_id}/roles',
            headers={
                **self.headers,
                'Authorization': f'Bearer {access_token}',
            },
            params={
                'include_application_roles': 'true'
            }
        )

        if response.status_code != 200:
            raise ValueError(f'Error calling query_tenant_roles: {response.status_code} - {response.text}')

        data = response.json() if response.content else {}
        # The API returns a list with items property
        items = data.get('items', []) if isinstance(data, dict) else data
        return [Role(**item) for item in items]

    ############################################################################################
    # MARK: Tenant APIs
    ############################################################################################
    async def get_tenant(self, tenant_id: str, access_token: str) -> Tenant:
        # Get Tenant API - https://docs.wristband.dev/reference/gettenantv1
        response: httpx.Response = await self.client.get(
            self.base_url + f'/tenants/{tenant_id}',
            headers={
                **self.headers,
                'Authorization': f'Bearer {access_token}'
            }
        )

        if response.status_code != 200:
            raise ValueError(f'Error calling get_tenant: {response.status_code} - {response.text}')

        data = response.json() if response.content else {}
        return Tenant(**data)

    async def update_tenant(self, tenant_id: str, tenant_data: TenantUpdateRequest, access_token: str) -> Tenant:
        # Update Tenant API - https://docs.wristband.dev/reference/patchtenantv1
        response: httpx.Response = await self.client.patch(
            self.base_url + f'/tenants/{tenant_id}',
            headers={
                **self.headers,
                'Authorization': f'Bearer {access_token}'
            },
            json=tenant_data.model_dump(),
        )

        if response.status_code != 200:
            raise ValueError(f'Error calling update_tenant: {response.status_code} - {response.text}')

        data = response.json() if response.content else {}
        return Tenant(**data)

    ############################################################################################
    # MARK: Identity Provider APIs
    ############################################################################################
    async def upsert_idp_override_toggle(self, tenant_id: str, access_token: str) -> None:
        # Upsert IDP Override Toggle API - enables tenant-level IDP override
        payload = {
            'ownerType': 'TENANT',
            'ownerId': tenant_id,
            'status': 'ENABLED'
        }

        response: httpx.Response = await self.client.post(
            self.base_url + '/identity-provider-override-toggles?upsert=true',
            headers={
                **self.headers,
                'Authorization': f'Bearer {access_token}'
            },
            json=payload,
        )

        if response.status_code not in [200, 201, 204]:
            raise ValueError(f'Error calling upsert_idp_override_toggle: {response.status_code} - {response.text}')

    async def upsert_identity_provider(self, idp_data: IdentityProviderRequest, access_token: str) -> IdentityProvider:
        # Upsert Identity Provider API - https://docs.wristband.dev/reference/upsertidentityproviderv1
        response: httpx.Response = await self.client.post(
            self.base_url + '/identity-providers?upsert=true',
            headers={
                **self.headers,
                'Authorization': f'Bearer {access_token}'
            },
            json=idp_data.model_dump(exclude_none=True),
        )

        if response.status_code not in [200, 201]:
            raise ValueError(f'Error calling upsert_identity_provider: {response.status_code} - {response.text}')

        data = response.json() if response.content else {}
        return IdentityProvider(**data)
    
    async def upsert_google_saml_identity_provider(self, tenant_id: str, access_token: str, metadata: UpsertGoogleSamlMetadata) -> IdentityProvider:
        """Upsert a Google SSO (SAML) identity provider using Wristband API (upsert=true).
        Reference: https://docs.wristband.dev/reference/createidentityprovidersv1
        """
        protocol: dict[str, Any] = {
            'type': 'SAML2',
            'idpEntityId': metadata.idpEntityId,
            'idpSsoUrl': metadata.idpSsoUrl,
        }
        # Optional fields: only include when provided
        def ensure_pem_certificate(cert_value: str) -> str:
            value = cert_value.strip()
            if 'BEGIN CERTIFICATE' in value:
                return value
            # Remove all whitespace and wrap at 64 chars
            b64 = ''.join(value.split())
            wrapped = '\n'.join([b64[i:i+64] for i in range(0, len(b64), 64)])
            return f"-----BEGIN CERTIFICATE-----\n{wrapped}\n-----END CERTIFICATE-----"

        signing_certs_raw = [metadata.idpSigningCert01, metadata.idpSigningCert02]
        signing_certs_clean = [c for c in signing_certs_raw if c and c.strip()]
        if signing_certs_clean:
            protocol['idpSigningCerts'] = [ensure_pem_certificate(c) for c in signing_certs_clean]
        if metadata.idpMetadataUrl:
            protocol['idpMetadataUrl'] = metadata.idpMetadataUrl

        payload: dict[str, Any] = {
            'ownerType': 'TENANT',
            'ownerId': tenant_id,
            'type': 'GOOGLE_WORKSPACE',
            'name': 'google-workspace',
            'displayName': 'Google Workspace',
            'domainName': metadata.idpEntityId,
            'protocol': protocol,
            'jitProvisioningEnabled': True,
            'status': 'ENABLED',
        }

        response: httpx.Response = await self.client.post(
            self.base_url + '/identity-providers?upsert=true',
            headers={
                **self.headers,
                'Authorization': f'Bearer {access_token}'
            },
            json=payload,
        )

        if response.status_code not in [200, 201]:
            raise ValueError(f'Error calling upsert_google_saml_identity_provider: {response.status_code} - {response.text}')

        data = response.json() if response.content else {}
        return IdentityProvider(**data)
    
    async def get_identity_providers(self, tenant_id: str, access_token: str) -> list[IdentityProvider]:
        # Query Tenant Identity Providers API - https://docs.wristband.dev/reference/querytenantidentityprovidersv1
        response = await self.client.get(
            f"{self.base_url}/tenants/{tenant_id}/identity-providers",
            headers={
                'Authorization': f'Bearer {access_token}',
                'Accept': 'application/json',
            }
        )

        if response.status_code != 200:
            raise ValueError(f'Error calling get_identity_providers: {response.status_code} - {response.text}')

        data = response.json() if response.content else []
        items = data.get('items', []) if isinstance(data, dict) else data
        return [IdentityProvider(**item) for item in items]

    async def resolve_idp_redirect_url_overrides(self, tenant_id: str, access_token: str) -> list[IdpRedirectUrlConfig]:
        # Resolve IDP Redirect URL Overrides - returns configured redirect URLs for IDPs in tenant
        response = await self.client.post(
            f"{self.base_url}/tenants/{tenant_id}/identity-providers/resolve-redirect-urls",
            headers={
                'Authorization': f'Bearer {access_token}',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            json={'identityProviderTypes': ['OKTA']},
        )

        if response.status_code != 200:
            raise ValueError(
                f'Error calling resolve_idp_redirect_url_overrides: {response.status_code} - {response.text}'
            )

        data = response.json() if response.content else {}
        items = data.get('items', [])
        return [IdpRedirectUrlConfig(**item) for item in items]

    async def test_idp_connection(self, tenant_id: str, access_token: str, idp_type: str = 'OKTA') -> bool:
        """Ping the Wristband test-connection endpoint for the given IDP type."""
        response = await self.client.post(
            f"{self.base_url}/tenants/{tenant_id}/identity-providers/test-connection",
            headers={
                'Authorization': f'Bearer {access_token}',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            json={'identityProviderType': idp_type},
        )

        if response.status_code != 200:
            raise ValueError(
                f'Error calling test_idp_connection: {response.status_code} - {response.text}'
            )
        data = response.json() if response.content else {}
        return bool(data.get('ok', True))

    ############################################################################################
    # MARK: Tenant Options APIs
    ############################################################################################
    async def fetch_tenants(self, access_token: str, application_id: str, email: str) -> list[TenantOption]:
        # Fetch Tenants API - https://docs.wristband.dev/reference/fetchtenantsv1
        response: httpx.Response = await self.client.post(
            self.base_url + '/tenant-discovery/fetch-tenants',
            headers={
                **self.headers,
                'Authorization': f'Bearer {access_token}'
            },
            json={
                'applicationId': application_id,
                'email': email,
                'clientId': os.getenv("CLIENT_ID")
            }
        )

        if response.status_code != 200:
            raise ValueError(f'Error calling fetch_tenants: {response.status_code} - {response.text}')

        data = response.json() if response.content else {}
        items = data.get('items', [])
        return [TenantOption(**item) for item in items]

