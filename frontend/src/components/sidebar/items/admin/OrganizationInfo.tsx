import React, { useState, useEffect } from 'react';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { useUser } from '@/contexts/UserContext';
import frontendApiClient from '@/client/frontend-api-client';
import axios from 'axios';

interface TenantData {
  id: string;
  displayName: string;
  logoUrl: string | null;
}

export default function OrganizationInfo() {
  const { currentUser } = useUser();
  
  // Tenant/Organization state
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [tenantDisplayName, setTenantDisplayName] = useState<string>('');
  const [tenantLogoUrl, setTenantLogoUrl] = useState<string | null>('');
  const [isUpdateTenantInProgress, setIsUpdateTenantInProgress] = useState(false);
  
  // Track if tenant data has changed
  const hasTenantDataChanged = () => {
    if (!tenant) return false;
    return tenantDisplayName !== tenant.displayName || 
           tenantLogoUrl !== (tenant.logoUrl || '');
  };
  
  // Initialize tenant data when user loads
  useEffect(() => {
    if (currentUser?.tenantId) {
      // Initialize with basic tenant info from user context
      const initialTenant: TenantData = {
        id: currentUser.tenantId,
        displayName: '', // Will be loaded from API
        logoUrl: null
      };
      setTenant(initialTenant);
      loadTenantData();
    }
  }, [currentUser]);
  
  const loadTenantData = async () => {
    try {
      const response = await frontendApiClient.get('/tenant/me');
      const tenantData = response.data;
      setTenant(tenantData);
      setTenantDisplayName(tenantData.displayName || '');
      setTenantLogoUrl(tenantData.logoUrl || '');
    } catch (error) {
      console.error('Error loading tenant data:', error);
      if (axios.isAxiosError(error)) {
        console.error('API Error:', error.response?.data);
      }
    }
  };

  const handleTenantDisplayNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdateTenantInProgress(true);
    
    try {
      // Update tenant via API
      // Convert empty string to null for logoUrl (Wristband requires null for deletable fields)
      const response = await frontendApiClient.patch('/tenant/me', {
        displayName: tenantDisplayName,
        logoUrl: tenantLogoUrl === '' ? null : tenantLogoUrl
      });
      
      // Update local state with response
      const updatedTenant = response.data;
      setTenant(updatedTenant);
      
      console.log('Tenant updated successfully:', updatedTenant);
      // TODO: Add toast notification
    } catch (error) {
      console.error('Error updating tenant:', error);
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        if (error.response?.status === 400) {
          alert(errorData?.message || 'Invalid tenant data. Please check your inputs.');
        } else {
          alert('An error occurred while updating the organization. Please try again.');
        }
      } else {
        alert('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsUpdateTenantInProgress(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-700">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 bg-gradient-to-r from-primary-dark to-primary">
          <BuildingOfficeIcon className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Organization Settings
        </h3>
      </div>
      <form onSubmit={handleTenantDisplayNameSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Organization Name
          </label>
          <input
            type="text"
            value={tenantDisplayName}
            onChange={(e) => setTenantDisplayName(e.target.value)}
            placeholder="Enter organization name"
            className="w-full px-4 py-3 border border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-gray-700 text-white transition-all duration-200 hover:border-gray-500"
            required
            maxLength={60}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Organization Logo URL
          </label>
          <input
            type="url"
            value={tenantLogoUrl || ''}
            onChange={(e) => setTenantLogoUrl(e.target.value)}
            placeholder="https://example.com/logo.png"
            className="w-full px-4 py-3 border border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-gray-700 text-white transition-all duration-200 hover:border-gray-500"
            maxLength={2000}
          />
          {tenantLogoUrl && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Logo Preview
                </label>
                <button
                  type="button"
                  onClick={() => setTenantLogoUrl(null)}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors duration-200 font-medium"
                >
                  Remove Logo
                </button>
              </div>
              <div className="w-full h-32 bg-gray-700 rounded-xl flex items-center justify-center overflow-hidden">
                <img 
                  src={tenantLogoUrl} 
                  alt="Logo Preview" 
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isUpdateTenantInProgress || !tenantDisplayName.trim() || !hasTenantDataChanged()}
          className="w-full btn-primary py-3 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
        >
          {isUpdateTenantInProgress ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </span>
          ) : (
            'Update Organization'
          )}
        </button>
      </form>
    </div>
  );
}
