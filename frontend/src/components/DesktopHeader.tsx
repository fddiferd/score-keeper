import React from 'react';
import { useUser } from '@/contexts/UserContext';
import OrganizationLogo from './OrganizationLogo';

export default function DesktopHeader() {
  const { currentTenant } = useUser();

  // Don't render the header container if there's no logo
  if (!currentTenant?.logoUrl) {
    return null;
  }

  return (
    <div className="hidden sm:block px-6 py-4">
      <div className="flex items-center justify-center">
        <OrganizationLogo size="lg" />
      </div>
    </div>
  );
}
