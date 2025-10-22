import React from 'react';
import OrganizationInfo from '../items/admin/OrganizationInfo';
import GoogleSSOIDP from '../items/admin/GoogleSSOIDP';
import OktaSSOIDP from '../items/admin/OktaSSOIDP';
import type { AdminConfig } from '../types';

interface AdminSectionProps {
  config?: AdminConfig;
}

export default function AdminSection({ config = {} }: AdminSectionProps) {
  const {
    organizationInfo = { enabled: false },
    googleSSOIDP = { enabled: false },
    oktaSSOIDP = { enabled: false }
  } = config;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Admin
        </h1>
      </div>
      
      <div className="space-y-8">
        {organizationInfo.enabled && <OrganizationInfo />}
        {googleSSOIDP.enabled && <GoogleSSOIDP />}
        {oktaSSOIDP.enabled && <OktaSSOIDP />}
      </div>
    </div>
  );
}
