from fastapi import APIRouter, Response, status, Depends
from fastapi.responses import JSONResponse
import logging

from wristband.fastapi_auth import get_session

from clients.wristband_client import WristbandClient
from models.wristband.user import User, UserProfileUpdate, PasswordChangeRequest, ThemePreference, Theme
from models.wristband.role import Role
from database.doc_store import set_document, get_document, is_database_available
from google.cloud.firestore import SERVER_TIMESTAMP
from auth.wristband import require_session_auth
from models.wristband.session import MySession

router = APIRouter(dependencies=[Depends(require_session_auth)])
logger = logging.getLogger(__name__)
wristband_client = WristbandClient()

@router.get('/me', response_model=User)
async def get_current_user(session: MySession = Depends(get_session)) -> User:
    try:
        # Get user ID and access token from session
        user_id = session.user_id
        access_token = session.access_token
        
        # Get user info using the Wristband API - returns validated User
        return await wristband_client.get_user_info(
            user_id=user_id,
            access_token=access_token,
            include_roles=True
        )
    except Exception as e:
        logger.exception(f"Error fetching current user info: {str(e)}")
        raise

@router.patch('/me', response_model=User)
async def update_current_user_profile(profile_data: UserProfileUpdate, session: MySession = Depends(get_session)) -> User:
    try:
        # Get user ID and access token from session
        user_id = session.user_id
        access_token = session.access_token
        
        # Update user profile using the Wristband API
        return await wristband_client.update_user(
            user_id=user_id,
            user_data=profile_data,
            access_token=access_token
        )
    except Exception as e:
        logger.exception(f"Error updating current user profile: {str(e)}")
        raise

@router.post('/me/change-password')
async def change_current_user_password(password_data: PasswordChangeRequest, session: MySession = Depends(get_session)) -> Response:
    try:
        # Get user ID and access token from session
        user_id = session.user_id
        access_token = session.access_token
        
        # Change password using the Wristband API
        return await wristband_client.change_password(
            user_id=user_id,
            current_password=password_data.currentPassword,
            new_password=password_data.newPassword,
            access_token=access_token
        )
    except Exception as e:
        logger.exception(f"Error changing user password: {str(e)}")
        raise

@router.get('/me/roles', response_model=list[Role])
async def get_current_user_roles(session: MySession = Depends(get_session)) -> list[Role]:
    """
    Get the current user's assigned roles
    """
    try:
        # Get session data
        user_id = session.user_id
        access_token = session.access_token
        
        # Get user's assigned roles using the Wristband API
        roles = await wristband_client.get_user_assigned_roles(
            user_id=user_id,
            access_token=access_token
        )
        
        logger.info(f"Successfully fetched {len(roles)} roles for user: {user_id}")
        return roles
        
    except Exception as e:
        logger.exception(f"Error fetching user roles: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "internal_error", "message": "An unexpected error occurred while fetching user roles."}
        )

@router.get('/theme', response_model=ThemePreference)
async def get_current_user_theme(session: MySession = Depends(get_session)) -> ThemePreference:
    """
    Get the current user's theme preference.
    Returns 503 if database is unavailable (client should use localStorage).
    """
    if not is_database_available():
        logger.debug("Database unavailable, client should use localStorage for theme")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "datastore_unavailable", "message": "Database not available, use local storage", "use_local_storage": True}
        )
    
    try:
        # Get user ID and tenant ID from session
        user_id = session.user_id
        tenant_id = session.tenant_id
        
        # Try to get user's theme preference from Firestore
        theme_data = get_document(
            collection_path=f"tenants/{tenant_id}/user_preferences",
            doc_id=f"{user_id}_theme"
        )
        
        if theme_data and 'theme' in theme_data:
            logger.debug(f"Found theme preference for user {user_id}: {theme_data['theme']}")
            return ThemePreference(theme=Theme(theme_data['theme']))
        else:
            # Return default theme (dark) if no preference is saved
            logger.debug(f"No theme preference found for user {user_id}, returning default: dark")
            return ThemePreference(theme=Theme.DARK)
        
    except Exception as e:
        logger.exception(f"Error fetching user theme preference: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "internal_error", "message": "An unexpected error occurred while fetching theme preference."}
        )

@router.patch('/theme', response_model=ThemePreference)
async def update_current_user_theme(theme_data: ThemePreference, session: MySession = Depends(get_session)) -> ThemePreference:
    """
    Update the current user's theme preference.
    Returns 503 if database is unavailable (client should use localStorage).
    Note: Theme validation is handled by Pydantic via the Theme enum.
    """
    if not is_database_available():
        logger.debug(f"Database unavailable, theme change not persisted server-side: {theme_data.theme.value}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "datastore_unavailable", "message": "Database not available, use local storage", "use_local_storage": True, "theme": theme_data.theme.value}
        )
    
    try:
        # Get user ID and tenant ID from session
        user_id = session.user_id
        tenant_id = session.tenant_id
        
        # Save theme preference to Firestore (store enum value as string)
        preference_data = {
            "user_id": user_id,
            "theme": theme_data.theme.value,
            "updated_at": SERVER_TIMESTAMP
        }
        
        set_document(
            collection_path=f"tenants/{tenant_id}/user_preferences",
            doc_id=f"{user_id}_theme",
            data=preference_data
        )
        
        logger.info(f"Successfully updated theme preference for user {user_id} to: {theme_data.theme.value}")
        return theme_data
        
    except Exception as e:
        logger.exception(f"Error updating user theme preference: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "internal_error", "message": "An unexpected error occurred while updating theme preference."}
        )

@router.get('/{user_id}', response_model=User)
async def get_user_info(user_id: str, session: MySession = Depends(get_session)) -> User:
    try:
        # Get access token from session or request
        access_token = session.access_token
        
        # Get user info using the Wristband API - returns validated User
        return await wristband_client.get_user_info(
            user_id=user_id,
            access_token=access_token,
            include_roles=True
        )
    except Exception as e:
        logger.exception(f"Error fetching user info for user {user_id}: {str(e)}")
        raise