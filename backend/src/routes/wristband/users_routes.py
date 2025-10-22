from fastapi import APIRouter, HTTPException, Depends
import logging

from wristband.fastapi_auth import get_session

from clients.wristband_client import WristbandClient
from models.wristband.user import User
from models.wristband.invite import InviteUserRequest, InviteUserResponse, NewUserInvitationRequest
from auth.wristband import require_session_auth
from models.wristband.session import MySession

router = APIRouter(dependencies=[Depends(require_session_auth)])
logger = logging.getLogger(__name__)
wristband_client = WristbandClient()

@router.get('', response_model=list[User])
async def get_users(session: MySession = Depends(get_session)) -> list[User]:
    try:
        # Get session data including access token and tenant ID
        access_token = session.access_token
        tenant_id = session.tenant_id
        
        # Query tenant users using the Wristband API - returns validated UserList
        return await wristband_client.query_tenant_users(
            tenant_id=tenant_id,
            access_token=access_token,
            include_roles=True
        )
    
    except ValueError as e:
        error_str = str(e)
        # Handle 403 Forbidden errors gracefully - user doesn't have admin permissions
        if "403" in error_str and "unauthorized" in error_str.lower():
            logger.warning(f"User {session.user_id} attempted to access users list without admin permissions")
            raise HTTPException(status_code=403, detail="Insufficient permissions to view users")
        else:
            logger.exception(f"Error querying tenant users: {error_str}")
            raise
    except Exception as e:
        logger.exception(f"Error querying tenant users: {str(e)}")
        raise

@router.post('/invite', response_model=InviteUserResponse)
async def invite_user(invite_request: InviteUserRequest, session: MySession = Depends(get_session)) -> InviteUserResponse:
    try:
        # Get session data including access token and tenant ID
        access_token = session.access_token
        tenant_id = session.tenant_id
        
        # If roles are provided, convert SKUs to role IDs for Wristband API
        role_ids_to_assign = []
        if invite_request.roles:
            # Get available roles to convert SKUs to IDs
            available_roles = await wristband_client.query_tenant_roles(
                tenant_id=tenant_id,
                access_token=access_token
            )
            
            # Create mapping from SKU to role ID
            sku_to_id_map = {role.sku: role.id for role in available_roles}
            
            # Convert role SKUs to role IDs
            for role_sku in invite_request.roles:
                if role_sku in sku_to_id_map:
                    role_ids_to_assign.append(sku_to_id_map[role_sku])
                else:
                    logger.warning(f"Role SKU not found: {role_sku}")
            
            if not role_ids_to_assign:
                logger.warning(f"No valid roles found from provided roles: {invite_request.roles}")
        
        # Invite the user using the Wristband API
        await wristband_client.invite_user(
            tenant_id=tenant_id,
            email=invite_request.email,
            roles_to_assign=role_ids_to_assign,
            access_token=access_token
        )
        
        return InviteUserResponse(
            message="User invitation sent successfully",
            email=invite_request.email,
            roles_assigned=invite_request.roles  # Return original SKUs for frontend display
        )
    
    except ValueError as e:
        error_str = str(e)
        # Handle 403 Forbidden errors gracefully - user doesn't have admin permissions
        if "403" in error_str and "unauthorized" in error_str.lower():
            logger.warning(f"User {session.user_id} attempted to invite user without admin permissions")
            raise HTTPException(status_code=403, detail="Insufficient permissions to invite users")
        else:
            logger.exception(f"Error inviting user: {error_str}")
            raise
    except Exception as e:
        logger.exception(f"Error inviting user: {str(e)}")
        raise

@router.get('/invitations/pending', response_model=list[NewUserInvitationRequest])
async def get_pending_invitations(session: MySession = Depends(get_session)) -> list[NewUserInvitationRequest]:
    """
    Get pending user invitations for the current tenant
    """
    try:
        # Get session data including access token and tenant ID
        access_token = session.access_token
        tenant_id = session.tenant_id
        
        # Query new user invitation requests using the Wristband API
        all_invitations = await wristband_client.query_new_user_invitation_requests(
            tenant_id=tenant_id,
            access_token=access_token
        )
        
        # Filter to only return pending invitations (not cancelled, expired, or accepted)
        pending_invitations = [
            invitation for invitation in all_invitations 
            if invitation.status in ['PENDING_INVITE_ACCEPTANCE', 'PENDING_EMAIL_VERIFICATION']
        ]
        
        return pending_invitations
    
    except ValueError as e:
        error_str = str(e)
        # Handle 403 Forbidden errors gracefully - user doesn't have admin permissions
        if "403" in error_str and "unauthorized" in error_str.lower():
            logger.warning(f"User {session.user_id} attempted to access pending invitations without admin permissions")
            raise HTTPException(status_code=403, detail="Insufficient permissions to view pending invitations")
        else:
            logger.exception(f"Error querying pending invitations: {error_str}")
            raise
    except Exception as e:
        logger.exception(f"Error querying pending invitations: {str(e)}")
        raise

@router.delete('/invitations/{invitation_id}', status_code=204)
async def cancel_invitation(invitation_id: str, session: MySession = Depends(get_session)) -> None:
    """
    Cancel a pending user invitation
    """
    try:
        # Get session data including access token
        access_token = session.access_token
        
        # Cancel the invitation using the Wristband API
        await wristband_client.cancel_new_user_invitation(
            invitation_id=invitation_id,
            access_token=access_token
        )
        
        logger.info(f"Successfully cancelled invitation: {invitation_id}")
        
    except ValueError as e:
        error_str = str(e)
        # Handle 403 Forbidden errors gracefully - user doesn't have admin permissions
        if "403" in error_str and "unauthorized" in error_str.lower():
            logger.warning(f"User {session.user_id} attempted to cancel invitation without admin permissions")
            raise HTTPException(status_code=403, detail="Insufficient permissions to cancel invitations")
        else:
            logger.exception(f"Error cancelling invitation: {error_str}")
            raise
    except Exception as e:
        logger.exception(f"Error cancelling invitation {invitation_id}: {str(e)}")
        raise

@router.delete('/{user_id}', status_code=204)
async def delete_user(user_id: str, session: MySession = Depends(get_session)) -> None:
    """
    Permanently delete a user from the system
    """
    try:
        # Get session data including access token
        access_token = session.access_token
        
        # Delete the user using the Wristband API
        await wristband_client.delete_user(
            user_id=user_id,
            access_token=access_token
        )
        
        logger.info(f"Successfully deleted user: {user_id}")
        
    except ValueError as e:
        error_str = str(e)
        # Handle 403 Forbidden errors gracefully - user doesn't have admin permissions
        if "403" in error_str and "unauthorized" in error_str.lower():
            logger.warning(f"User {session.user_id} attempted to delete user without admin permissions")
            raise HTTPException(status_code=403, detail="Insufficient permissions to delete users")
        else:
            logger.exception(f"Error deleting user: {error_str}")
            raise
    except Exception as e:
        logger.exception(f"Error deleting user {user_id}: {str(e)}")
        raise
