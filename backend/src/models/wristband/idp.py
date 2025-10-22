from typing import Optional, List
from pydantic import BaseModel

class IdpProtocol(BaseModel):
    type: Optional[str] = None
    clientId: Optional[str] = None
    clientSecret: Optional[str] = None
    teamId: Optional[str] = None
    serviceId: Optional[str] = None
    keyId: Optional[str] = None
    privateKey: Optional[str] = None
    scopes: Optional[List[str]] = None
    # OAuth2 extras
    redirectUrl: Optional[str] = None
    redirectDomainName: Optional[str] = None
    # SAML2 extras
    idpEntityId: Optional[str] = None
    idpSsoUrl: Optional[str] = None
    idpSigningCerts: Optional[List[str]] = None
    idpMetadataUrl: Optional[str] = None
    allowIdpInitiatedSso: Optional[bool] = None
    spDomainName: Optional[str] = None
    spEntityId: Optional[str] = None
    acsUrl: Optional[str] = None

class IdentityProvider(BaseModel):
    id: Optional[str] = None
    ownerType: Optional[str] = None
    ownerId: Optional[str] = None
    type: Optional[str] = None
    name: Optional[str] = None
    displayName: Optional[str] = None
    domainName: Optional[str] = None
    isExternal: Optional[bool] = None
    protocol: Optional[IdpProtocol] = None
    jitProvisioningEnabled: bool = False
    status: Optional[str] = None
    loginIdentifiers: Optional[List[str]] = None
    loginFactors: Optional[List[str]] = None

class IdentityProviderRequest(BaseModel):
    ownerType: str
    ownerId: str
    type: str
    name: str
    displayName: str
    domainName: str
    protocol: IdpProtocol
    jitProvisioningEnabled: bool = True
    status: str = "ENABLED"
    

class IdpOverrideToggle(BaseModel):
    ownerType: str
    ownerId: str
    status: str = "ENABLED"

class UpsertIdpRequest(BaseModel):
    idp: IdentityProviderRequest


class IdpRedirectUrl(BaseModel):
    protocolType: Optional[str] = None
    redirectUrl: str
    redirectDomainName: Optional[str] = None


class IdpRedirectUrlConfig(BaseModel):
    identityProviderType: str
    redirectUrls: List[IdpRedirectUrl]


class UpsertGoogleSamlMetadata(BaseModel):
    idpEntityId: str
    idpSsoUrl: str
    idpSigningCert01: str | None = None
    idpSigningCert02: str | None = None
    idpMetadataUrl: str | None = None