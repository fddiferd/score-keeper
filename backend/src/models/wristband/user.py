from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from enum import Enum

class UserMetadata(BaseModel):
    activationTime: Optional[datetime] = None
    creationTime: datetime
    deactivationTime: Optional[datetime] = None
    lastModifiedTime: datetime
    version: str

class User(BaseModel):
    applicationId: str
    birthdate: Optional[str] = None
    displayName: Optional[str] = None
    email: EmailStr
    emailVerified: bool
    externalId: Optional[str] = None
    familyName: Optional[str] = None
    fullName: Optional[str] = None
    gender: Optional[str] = None
    givenName: Optional[str] = None
    hasPassword: bool
    honorificPrefix: Optional[str] = None
    honorificSuffix: Optional[str] = None
    id: str
    identityProviderName: str
    identityProviderType: str
    locale: Optional[str] = None
    metadata: UserMetadata
    middleName: Optional[str] = None
    nickname: Optional[str] = None
    phoneNumber: Optional[str] = None
    pictureUrl: Optional[str] = None
    preferredLanguage: Optional[str] = None
    publicMetadata: dict = {}
    restrictedMetadata: dict = {}
    status: str
    tenantId: str
    timeZone: Optional[str] = None
    username: Optional[str] = None

    # added after user info from resolve assigned roles
    roles: list[str] = []

class UserProfileUpdate(BaseModel):
    givenName: Optional[str] = None
    familyName: Optional[str] = None
    nickname: Optional[str] = None

class PasswordChangeRequest(BaseModel):
    currentPassword: str
    newPassword: str

class Theme(Enum):
    DARK = "dark"
    LIGHT = "light"
    SYSTEM = "system"

class ThemePreference(BaseModel):
    theme: Theme = Theme.DARK

class UsersResponse(BaseModel):
    items: list[User]
    itemsPerPage: int
    startIndex: int
    totalResults: int 
