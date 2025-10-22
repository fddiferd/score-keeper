export interface TenantOption {
  tenantId: string;
  tenantVanityDomain: string;
  tenantDomainName: string;
  tenantDisplayName: string;
  tenantLoginUrl: string;
  tenantLogoUrl?: string;
}

export interface Tenant {
  id?: string;
  applicationId?: string;
  vanityDomain?: string;
  domainName?: string;
  displayName?: string;
  description?: string;
  logoUrl?: string | null;
  signupEnabled?: boolean;
  status?: string;
  publicMetadata?: object;
  restrictedMetadata?: object;
}