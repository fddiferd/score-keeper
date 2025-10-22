from typing import Any, Optional
from fastapi import APIRouter, Request, status, Depends
from fastapi.responses import JSONResponse
import logging
import httpx
import base64
import hashlib
import secrets
from urllib.parse import urlencode

from wristband.fastapi_auth import get_session

from clients.wristband_client import WristbandClient
from models.wristband.idp import IdentityProvider, UpsertIdpRequest, UpsertGoogleSamlMetadata, IdentityProviderRequest, IdpProtocol
from auth.wristband import require_session_auth
from models.wristband.session import MySession

router = APIRouter(dependencies=[Depends(require_session_auth)])
logger = logging.getLogger(__name__)
wristband_client = WristbandClient()

# MARK: - Get All IDPs
@router.get('/providers', response_model=list[IdentityProvider])
async def get_identity_providers(session: MySession = Depends(get_session)) -> list[IdentityProvider]:
    try:
        tenant_id = session.tenant_id
        access_token = session.access_token

        idps = await wristband_client.get_identity_providers(
            tenant_id=tenant_id,
            access_token=access_token,
        )
        return idps
    except Exception as e:
        logger.exception(f"Error fetching identity providers: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "internal_error", "message": "An unexpected error occurred while fetching identity providers."}
        )


# MARK: - Upsert IDP
@router.post('/upsert', response_model=IdentityProvider)
async def upsert_identity_provider(idp_request: UpsertIdpRequest, session: MySession = Depends(get_session)) -> IdentityProvider:
    """
    Upsert (create or update) an identity provider for the current tenant
    """
    try:
        # Get tenant ID and access token from session
        tenant_id = session.tenant_id
        access_token = session.access_token
        
        # Ensure the IDP is configured for the current tenant
        idp_data = idp_request.idp
        idp_data.ownerId = tenant_id
        
        # First, enable IDP override toggle for the tenant
        await wristband_client.upsert_idp_override_toggle(
            tenant_id=tenant_id,
            access_token=access_token
        )
        
        # Then upsert the identity provider
        return await wristband_client.upsert_identity_provider(
            idp_data=idp_data,
            access_token=access_token
        )
    except ValueError as e:
        # Wristband API error - could be invalid data or validation errors
        error_msg = str(e)
        if "400" in error_msg:
            logger.warning(f"IDP upsert failed for tenant {session.tenant_id}: {error_msg}")
            # Check for specific validation errors
            if "domainName" in error_msg or "domain" in error_msg.lower():
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={"error": "invalid_domain_name", "message": "The provided domain name is invalid or already in use."}
                )
            else:
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={"error": "invalid_idp_data", "message": "The provided identity provider data is invalid. Please check your inputs."}
                )
        elif "401" in error_msg or "403" in error_msg:
            logger.warning(f"IDP upsert unauthorized for tenant {session.tenant_id}: {error_msg}")
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "permission_denied", "message": "You are not authorized to configure identity providers."}
            )
        else:
            logger.exception(f"Error upserting IDP for tenant {session.tenant_id}: {error_msg}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"error": "internal_error", "message": "An unexpected error occurred while configuring the identity provider."}
            )
    except Exception as e:
        logger.exception(f"Unexpected error upserting IDP: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "internal_error", "message": "An unexpected error occurred while configuring the identity provider."}
        )

# MARK: - Upsert Google SSO (SAML)
@router.post('/google/saml/upsert', response_model=IdentityProvider)
async def upsert_google_sso(payload: dict[str, Any], session: MySession = Depends(get_session)) -> IdentityProvider:
    """
    Receive parsed Google SAML metadata fields from the frontend and upsert a Google SSO IDP
    using Wristband upsert API with upsert=true.
    """
    try:
        tenant_id = session.tenant_id
        access_token = session.access_token

        # Parse payload into pydantic model
        metadata = UpsertGoogleSamlMetadata(**(payload.get('metadata') or {}))

        # Enable tenant-level IDP override toggle
        await wristband_client.upsert_idp_override_toggle(tenant_id=tenant_id, access_token=access_token)

        # Use the client helper to upsert Google SAML
        result = await wristband_client.upsert_google_saml_identity_provider(
            tenant_id=tenant_id,
            access_token=access_token,
            metadata=metadata,
        )
        return result

    except ValueError as e:
        error_msg = str(e)
        logger.warning(f"Google SSO upsert failed for tenant {session.tenant_id if 'session' in locals() else '?'}: {error_msg}")
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"error": "invalid_google_saml", "message": "Invalid Google SAML metadata or configuration."})
    except Exception as e:
        logger.exception(f"Unexpected error upserting Google SSO: {str(e)}")
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"error": "internal_error", "message": "An unexpected error occurred while configuring Google SSO."})

# MARK: - Get Okta IDP
@router.get('/okta', response_model=Optional[IdentityProvider])
async def get_okta_identity_provider(session: MySession = Depends(get_session)) -> Optional[IdentityProvider]:
    """
    Get the Okta identity provider configuration for the current tenant
    """
    try:
        tenant_id = session.tenant_id
        access_token = session.access_token
        
        # Get all identity providers for the tenant
        idps = await wristband_client.get_identity_providers(
            tenant_id=tenant_id,
            access_token=access_token
        )
        # Find the Okta IDP
        okta_idp = next((idp for idp in idps if idp.type == 'OKTA'), None)
        
        if not okta_idp:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "not_found", "message": "No Okta identity provider found for this tenant."}
            )
        
        return okta_idp
    except Exception as e:
        logger.exception(f"Error fetching Okta IDP: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "internal_error", "message": "An unexpected error occurred while fetching the identity provider."}
        )

@router.get('/okta/redirect-url')
async def get_okta_redirect_url(session: MySession = Depends(get_session)) -> dict[str, str]:
    """
    Resolve the Okta redirect URL from Wristband for the current tenant
    """
    try:
        tenant_id = session.tenant_id
        access_token = session.access_token

        results = await wristband_client.resolve_idp_redirect_url_overrides(
            tenant_id=tenant_id,
            access_token=access_token,
        )

        okta_config = next((cfg for cfg in results if cfg.identityProviderType == 'OKTA' and cfg.redirectUrls), None)
        if not okta_config:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "not_found", "message": "No Okta redirect URL found for this tenant."},
            )

        return {"redirectUrl": okta_config.redirectUrls[0].redirectUrl}

    except Exception as e:
        logger.exception(f"Error resolving Okta redirect URL: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "internal_error", "message": "An unexpected error occurred while resolving redirect URL."},
        )

# MARK: - Test Okta Connection
@router.post('/okta/test-connection')
async def test_okta_connection(session: MySession = Depends(get_session)) -> dict[str, Any]:
    """
    Ask Wristband to validate the Okta configuration for this tenant by performing a lightweight test.
    Returns { ok: boolean }.
    """
    try:
        tenant_id = session.tenant_id
        access_token = session.access_token

        # Optional overrides from request body so users can test before saving
        try:
            body = await session.json()
        except Exception:
            body = {}
        override_domain: Optional[str] = body.get('domainName') if isinstance(body, dict) else None
        override_client_id: Optional[str] = body.get('clientId') if isinstance(body, dict) else None

        # 1) Get Okta IDP config for defaults
        idps = await wristband_client.get_identity_providers(
            tenant_id=tenant_id, access_token=access_token
        )
        okta_idp = next((idp for idp in idps if idp.type == 'OKTA'), None)
        domain_name = override_domain or (okta_idp.domainName if okta_idp else None)
        client_id = override_client_id or (okta_idp.protocol.clientId if okta_idp and okta_idp.protocol else None)
        if not domain_name or not client_id:
            return { 'ok': False, 'error': 'missing_okta_config' }

        # 2) Resolve redirect URL from Wristband
        redirect_results = await wristband_client.resolve_idp_redirect_url_overrides(
            tenant_id=tenant_id, access_token=access_token
        )
        okta_redirect = next((cfg for cfg in redirect_results if cfg.identityProviderType == 'OKTA' and cfg.redirectUrls), None)
        if not okta_redirect:
            return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={'ok': False, 'error': 'missing_redirect_url'})

        redirect_uri = okta_redirect.redirectUrls[0].redirectUrl

        # 3) Build an /authorize URL similar to a real login initiation
        # Generate a PKCE challenge to more closely mirror real flow (optional)
        code_verifier = secrets.token_urlsafe(32)
        code_challenge = base64.urlsafe_b64encode(hashlib.sha256(code_verifier.encode()).digest()).rstrip(b'=').decode()

        query = {
            'response_type': 'code',
            'client_id': client_id,
            'scope': 'openid profile email',
            'redirect_uri': redirect_uri,
            'state': secrets.token_urlsafe(16),
            'nonce': secrets.token_urlsafe(16),
            'code_challenge': code_challenge,
            'code_challenge_method': 'S256',
            'prompt': 'login',
        }
        authorize_url = f"https://{domain_name}/oauth2/v1/authorize?{urlencode(query)}"

        async with httpx.AsyncClient(follow_redirects=False, timeout=10) as client:
            resp = await client.get(authorize_url, headers={'Accept': 'text/html'})

        # Okta typically returns 302 to the login page or 200 with an HTML page when cookie/login page served
        is_ok = resp.status_code in (200, 302)
        return {'ok': is_ok, 'status': resp.status_code}
    except Exception as e:
        logger.exception(f"Error testing Okta connection: {str(e)}")
        # Always return 200 with ok:false so the UI doesn't surface a 500 overlay
        return { 'ok': False, 'error': 'unexpected_error' }