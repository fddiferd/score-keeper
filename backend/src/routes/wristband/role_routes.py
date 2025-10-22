from typing import List
from fastapi import APIRouter, status, Depends
from fastapi.responses import JSONResponse
import logging

from wristband.fastapi_auth import get_session

from clients.wristband_client import WristbandClient
from models.wristband.role import Role
from auth.wristband import require_session_auth
from models.wristband.session import MySession

router = APIRouter(dependencies=[Depends(require_session_auth)])
logger = logging.getLogger(__name__)
wristband_client = WristbandClient()

@router.get('', response_model=List[Role])
async def get_tenant_roles(session: MySession = Depends(get_session)):
    """
    Get all roles available for the current tenant
    """
    try:
        # Get tenant ID and access token from session
        tenant_id = session.tenant_id
        access_token = session.access_token
        
        # Fetch roles from Wristband
        roles = await wristband_client.query_tenant_roles(
            tenant_id=tenant_id,
            access_token=access_token
        )
        
        logger.info(f"Successfully fetched {len(roles)} roles for tenant: {tenant_id}")
        return roles
        
    except Exception as e:
        logger.exception(f"Error fetching tenant roles: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "internal_error", "message": "An unexpected error occurred while fetching roles."}
        )