from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class TenantMetadata(BaseModel):
    perkCategories: Optional[list[str]] = None

class EntityMetadata(BaseModel):
    activationTime: Optional[str] = None
    creationTime: Optional[str] = None
    deactivationTime: Optional[str] = None
    lastModifiedTime: Optional[str] = None
    version: Optional[str] = None

class Tenant(BaseModel):
    id: Optional[str] = None
    applicationId: Optional[str] = None
    vanityDomain: Optional[str] = None
    domainName: Optional[str] = None
    displayName: Optional[str] = None
    description: Optional[str] = None
    logoUrl: Optional[str] = None
    signupEnabled: Optional[bool] = None
    status: Optional[str] = None
    publicMetadata: Optional[TenantMetadata] = None
    restrictedMetadata: Optional[Dict[str, Any]] = None
    metadata: Optional[EntityMetadata] = None

class TenantUpdateRequest(BaseModel):
    displayName: Optional[str] = Field(None, max_length=60)
    logoUrl: Optional[str] = Field(None, max_length=2000)
    description: Optional[str] = None

class TenantOption(BaseModel):
    tenantId: str
    tenantVanityDomain: str
    tenantDomainName: str
    tenantDisplayName: str
    tenantLoginUrl: str
    tenantLogoUrl: Optional[str] = None