from pydantic import BaseModel, computed_field
from typing import Optional

class Role(BaseModel):
    description: Optional[str] = None
    displayName: str
    id: str
    metadata: dict
    name: str
    ownerId: str
    ownerType: str
    permissionBoundaryId: Optional[str] = None
    tenantVisibility: str
    tenantVisibilityInclusionList: list[str]
    type: str

    @computed_field
    @property
    def sku(self) -> str:
        return self.name.split(':')[-1]

class UserRoles(BaseModel):
    userId: str
    roles: list[Role]

class Failure(BaseModel):
    code: str
    message: str
    index: int
    userId: str

class RoleList(BaseModel):
    failures: list[Failure]
    items: list[UserRoles]
