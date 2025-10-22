export interface UserMetadata {
  activationTime: string;
  creationTime: string;
  deactivationTime?: string;
  lastModifiedTime: string;
  version: string;
}

export interface User {
  applicationId: string;
  birthdate?: string;
  displayName?: string;
  email: string;
  emailVerified: boolean;
  externalId?: string;
  familyName?: string;
  fullName?: string;
  gender?: string;
  givenName?: string;
  hasPassword: boolean;
  honorificPrefix?: string;
  honorificSuffix?: string;
  id: string;
  identityProviderName: string;
  identityProviderType: string;
  locale?: string;
  metadata: UserMetadata;
  middleName?: string;
  nickname?: string;
  phoneNumber?: string;
  pictureUrl?: string;
  preferredLanguage?: string;
  publicMetadata: Record<string, any>;
  restrictedMetadata: Record<string, any>;
  status: string;
  tenantId: string;
  timeZone?: string;
  username?: string;
  roles: string[];
}

export interface UsersResponse {
  items: User[];
  itemsPerPage: number;
  startIndex: number;
  totalResults: number;
}