from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class InviteUserRequest(BaseModel):
    email: EmailStr
    roles: List[str] = []  # List of role SKUs to assign

class InviteUserResponse(BaseModel):
    message: str
    email: str
    roles_assigned: List[str]

class InvitationMetadata(BaseModel):
    """Metadata for invitation request"""
    creationTime: datetime
    lastModifiedTime: datetime
    version: str

class NewUserInvitationRequest(BaseModel):
    """Model for New User Invitation Request from Wristband API"""
    id: str
    tenantId: str
    applicationId: str
    invitationType: str  # e.g., "EMAIL"
    inviteeName: Optional[str] = None
    email: EmailStr
    rolesToAssign: List[str] = []
    externalIdpRequestStatus: str  # e.g., "UNINITIALIZED"
    externalIdpName: Optional[str] = None
    externalIdpDisplayName: Optional[str] = None
    externalIdpType: Optional[str] = None
    expirationTime: Optional[datetime] = None
    status: str  # e.g., "PENDING_INVITE_ACCEPTANCE"
    metadata: InvitationMetadata

class NewUserInvitationRequestsResponse(BaseModel):
    """Response model for paginated new user invitation requests"""
    startIndex: int
    itemsPerPage: int
    totalResults: int
    items: List[NewUserInvitationRequest]
