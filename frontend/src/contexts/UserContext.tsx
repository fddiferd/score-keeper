import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '@/models/user';
import { Tenant, TenantOption } from '@/models/tenant';
import { Role } from '@/models/role';

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isLoadingUser: boolean;
  setIsLoadingUser: (loading: boolean) => void;
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant | null) => void;
  tenantOptions: TenantOption[];
  setTenantOptions: (options: TenantOption[]) => void;
  isLoadingTenants: boolean;
  setIsLoadingTenants: (loading: boolean) => void;
  userRoles: Role[];
  setUserRoles: (roles: Role[]) => void;
  isLoadingRoles: boolean;
  setIsLoadingRoles: (loading: boolean) => void;
  hasAdminRole: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [tenantOptions, setTenantOptions] = useState<TenantOption[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(true);
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  // Check if user has admin role
  const hasAdminRole = userRoles.some(role => 
    role.name === 'admin' || 
    role.displayName?.toLowerCase().includes('admin') ||
    role.name.toLowerCase().includes('admin')
  );

  return (
    <UserContext.Provider value={{ 
      currentUser, 
      setCurrentUser, 
      isLoadingUser, 
      setIsLoadingUser,
      currentTenant,
      setCurrentTenant,
      tenantOptions,
      setTenantOptions,
      isLoadingTenants,
      setIsLoadingTenants,
      userRoles,
      setUserRoles,
      isLoadingRoles,
      setIsLoadingRoles,
      hasAdminRole
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}