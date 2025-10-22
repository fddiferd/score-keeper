# Standard library imports
import logging
from fastapi import APIRouter, Request, Depends, HTTPException, status
from fastapi import Request
from fastapi.routing import APIRouter
from fastapi.responses import Response

# Wristband imports
from wristband.fastapi_auth import (
  CallbackResult,
  CallbackResultType,
  get_session,
  LogoutConfig,
  SessionResponse,
)
# Local imports
from auth.wristband import wristband_auth, require_session_auth
from environment import environment as env
from models.wristband.session import MySession

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get('/login')
async def login(request: Request) -> Response:
    return await wristband_auth.login(request)

@router.get('/callback')
async def callback(request: Request, session: MySession = Depends(get_session)) -> Response:
    # get callback result
    callback_result: CallbackResult = await wristband_auth.callback(request=request)

    # if redirect required, return redirect response
    if callback_result.type == CallbackResultType.REDIRECT_REQUIRED:
        assert callback_result.redirect_url is not None
        return await wristband_auth.create_callback_response(
            request, 
            callback_result.redirect_url
        )
    
    # Create session data for the authenticated user, including CSRF token
    assert callback_result.callback_data is not None
    session.from_callback(
        callback_data=callback_result.callback_data, 
        custom_fields={
            "idp_name": callback_result.callback_data.user_info.identity_provider_name,
        }
    )
    
    # Return the callback response that redirects to your app.
    return await wristband_auth.create_callback_response(request, env.frontend_url)

@router.get('/logout')
async def logout(request: Request, session: MySession = Depends(get_session)) -> Response:
    # Get all necessary session data needed to perform logout
    logout_config = LogoutConfig(
        refresh_token=session.refresh_token,
        tenant_custom_domain=session.tenant_custom_domain,
        tenant_name=session.tenant_name,
        redirect_url=env.frontend_url,
    )

    # Delete the session and CSRF cookies.
    session.clear()

    # Log out the user and redirect to the Wristband Logout Endpoint
    return await wristband_auth.logout(request, logout_config)

@router.get("/session")
async def get_session(session: MySession = Depends(require_session_auth)) -> SessionResponse:
    try:
        return session.get_session_response(metadata={
            "isAuthenticated": session.is_authenticated,
            "accessToken": session.access_token,
            "expiresAt": session.expires_at,
            "userId": session.user_id,
            "tenantId": session.tenant_id,
            "tenantName": session.tenant_name,
            "csrfToken": session.csrf_token,
            "refreshToken": session.refresh_token,
            "customField": session.custom_field,
        })
    except Exception as e:
        logger.exception(f"Unexpected Get Session Endpoint error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
