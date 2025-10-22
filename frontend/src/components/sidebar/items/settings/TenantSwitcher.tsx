import React, { useState } from 'react';
import { ChevronDownIcon, CheckIcon, ArrowRightIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { useUser } from '@/contexts/UserContext';
import { truncateDisplayString } from '@/utils/helpers';

export default function TenantSwitcher() {
  const { currentTenant, tenantOptions, isLoadingTenants } = useUser();
  const [isExpanded, setIsExpanded] = useState(false);
  const currentTenantId = currentTenant?.id || '';

  // Show loading state while tenants are loading
  if (isLoadingTenants) {
    return (
      <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-700">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 bg-gradient-to-r from-primary-dark to-primary animate-pulse">
            <BuildingOfficeIcon className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Organization
          </h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  // Don't render if there are no tenant options
  if (!tenantOptions || tenantOptions.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-700">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 bg-gradient-to-r from-primary-dark to-primary">
          <BuildingOfficeIcon className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Organization
        </h3>
      </div>

      <div className="space-y-4">
        {/* Current Organization */}
        <div className="p-4 bg-gray-700 rounded-xl border border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {currentTenant?.logoUrl && (
                <div className="flex-shrink-0 w-12 h-8 flex items-center justify-center">
                  <img 
                    src={currentTenant.logoUrl} 
                    alt={`${currentTenant.displayName} logo`}
                    className="max-w-full max-h-full w-auto h-auto object-contain rounded"
                  />
                </div>
              )}
              <div>
                <p className="text-sm text-gray-400">Current Organization</p>
                <p className="text-white font-medium">
                  {currentTenant?.displayName || 'No Organization Selected'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CheckIcon className="w-4 h-4 text-green-400" />
            </div>
          </div>
        </div>

        {/* Switch Organizations */}
        {tenantOptions.length > 1 && (
          <div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-xl border border-gray-600 hover:border-gray-500 transition-all duration-200"
            >
              <span className="text-white font-medium">Switch Organization</span>
              <ChevronDownIcon 
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`} 
              />
            </button>

            {isExpanded && (
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                {tenantOptions
                  .filter(option => option.tenantId !== currentTenantId)
                  .map((tenantOption) => (
                    <div
                      key={tenantOption.tenantId}
                      className="p-4 bg-gray-700 hover:bg-gray-600 rounded-xl border border-gray-600 hover:border-gray-500 cursor-pointer transition-all duration-200"
                      onClick={() => {
                        window.location.href = tenantOption.tenantLoginUrl;
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {tenantOption.tenantLogoUrl && (
                            <div className="flex-shrink-0 w-12 h-8 flex items-center justify-center">
                              <img 
                                src={tenantOption.tenantLogoUrl} 
                                alt={`${tenantOption.tenantDisplayName} logo`}
                                className="max-w-full max-h-full w-auto h-auto object-contain rounded"
                              />
                            </div>
                          )}
                          <div>
                            <p className="text-white font-medium">
                              {tenantOption.tenantDisplayName}
                            </p>
                          </div>
                        </div>
                        <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
