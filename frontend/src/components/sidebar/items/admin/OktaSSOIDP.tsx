import React, { useState, useEffect } from 'react';
import { ClipboardIcon, CheckIcon, KeyIcon, CloudIcon, EyeIcon, EyeSlashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useUser } from '@/contexts/UserContext';
import frontendApiClient from '@/client/frontend-api-client';
import axios from 'axios';

interface IdentityProviderDto {
  id?: string;
  type: string;
  ownerType: string;
  ownerId: string;
  name: string;
  displayName: string;
  domainName: string;
  status: 'ENABLED' | 'DISABLED';
  protocol: {
    type: string;
    clientId: string;
    clientSecret: string;
  };
  jitProvisioningEnabled: boolean;
}

export default function OktaSSOIDP() {
  const { currentUser } = useUser();
  
  // Okta IDP state
  const [currentOktaIdp, setCurrentOktaIdp] = useState<IdentityProviderDto | null>(null);
  const [domainName, setDomainName] = useState<string>('');
  const [clientId, setClientId] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isOktaEnabled, setIsOktaEnabled] = useState<boolean>(false);
  const [isOktaIdpInProgress, setOktaIdpInProgress] = useState<boolean>(false);
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [oktaLoadError, setOktaLoadError] = useState<string | null>(null);
  // Okta redirect URL display/copy state
  const [oktaRedirectUrl, setOktaRedirectUrl] = useState<string>('');
  const [copiedRedirectUrl, setCopiedRedirectUrl] = useState<boolean>(false);
  
  // Track if Okta IDP data has changed
  const hasOktaIdpDataChanged = () => {
    if (!currentOktaIdp) {
      // If no current IDP, check if any fields are filled
      return domainName.trim() !== '' || clientId.trim() !== '' || clientSecret.trim() !== '';
    }
    
    // Check against current IDP values
    return domainName !== currentOktaIdp.domainName ||
           clientId !== currentOktaIdp.protocol.clientId ||
           clientSecret !== currentOktaIdp.protocol.clientSecret ||
           isOktaEnabled !== (currentOktaIdp.status === 'ENABLED');
  };
  
  // Initialize when user loads
  useEffect(() => {
    if (currentUser?.tenantId) {
      loadOktaIdpData();
    }
  }, [currentUser]);

  // Load Okta Redirect URL from backend (resolved from Wristband)
  useEffect(() => {
    const loadOktaRedirectUrl = async () => {
      try {
        const response = await frontendApiClient.get('/idp/okta/redirect-url');
        const { redirectUrl } = response.data || {};
        setOktaRedirectUrl(redirectUrl || '');
        setOktaLoadError(null);
      } catch (error) {
        console.error('Error loading Okta redirect URL:', error);
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            setOktaRedirectUrl('');
            setOktaLoadError(null);
          } else {
            setOktaLoadError('Unable to resolve Okta Redirect URL.');
          }
        }
      }
    };
    loadOktaRedirectUrl();
  }, []);

  const handleCopyOktaRedirectUrl = async () => {
    try {
      await navigator.clipboard.writeText(oktaRedirectUrl);
      setCopiedRedirectUrl(true);
      setTimeout(() => setCopiedRedirectUrl(false), 1500);
    } catch (err) {
      console.error('Failed to copy redirect URL:', err);
    }
  };
  
  const loadOktaIdpData = async () => {
    try {
      const response = await frontendApiClient.get('/idp/okta');
      if (response.data) {
        const idpData = response.data;
        setCurrentOktaIdp(idpData);
        setDomainName(idpData.domainName || '');
        setClientId(idpData.protocol.clientId || '');
        setClientSecret(idpData.protocol.clientSecret || '');
        // If an Okta IDP exists, enable the toggle to show the configuration info
        setIsOktaEnabled(true);
        setOktaLoadError(null);
      }
    } catch (error) {
      // 404 is expected when no Okta IDP exists yet
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // No Okta IDP configured yet - keep disabled
        setOktaLoadError(null);
        setIsOktaEnabled(false);
        return;
      }
      
      // For other errors, set error message
      console.error('Error loading Okta IDP data:', error);
      if (axios.isAxiosError(error)) {
        console.error('API Error:', error.response?.data);
        if (error.response?.status === 500) {
          setOktaLoadError('Unable to retrieve existing Okta configuration. You can still create a new configuration.');
        } else {
          setOktaLoadError('Error loading Okta configuration. Please try again later.');
        }
      }
    }
  };

  const handleUpsertOktaIdp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOktaIdpInProgress(true);
    
    try {
      const idpData: IdentityProviderDto = {
        type: 'OKTA',
        ownerType: 'TENANT',
        ownerId: currentUser?.tenantId || '',
        name: 'okta',
        displayName: 'Okta',
        domainName,
        status: isOktaEnabled ? 'ENABLED' : 'DISABLED',
        protocol: {
          type: 'OAUTH2',
          clientId,
          clientSecret
        },
        jitProvisioningEnabled: true
      };
      
      const response = await frontendApiClient.post('/idp/upsert', { idp: idpData });
      const upsertedIdp = response.data;
      setCurrentOktaIdp(upsertedIdp);
      
      console.log('Okta IDP upserted successfully:', upsertedIdp);
      // TODO: Add toast notification
    } catch (error) {
      console.error('Error upserting Okta IDP:', error);
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        if (error.response?.status === 400) {
          alert(errorData?.message || 'Invalid Okta configuration. Please check your inputs.');
        } else {
          alert('An error occurred while configuring Okta SSO. Please try again.');
        }
      } else {
        alert('An unexpected error occurred. Please try again.');
      }
    } finally {
      setOktaIdpInProgress(false);
    }
  };

  const testOktaConnection = async () => {
    try {
      const response = await frontendApiClient.post('/idp/okta/test-connection', {
        domainName,
        clientId,
      });
      const { ok } = response.data || {};
      if (ok) {
        alert('Okta connection successful.');
      } else {
        alert('Okta connection failed. Please verify domain, client ID, and client secret.');
      }
    } catch (error) {
      // Backend now always returns 200 with ok:false for errors, but keep a fallback
      console.error('Error testing Okta connection:', error);
      alert('Unexpected error during connection test.');
    }
  };

  return (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-700">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 bg-gradient-to-r from-primary to-primary-light">
          <KeyIcon className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Okta SSO Configuration
        </h3>
      </div>
      
      {/* <div className="mb-6 p-4 bg-info/10 border border-info/20 rounded-xl flex items-start space-x-3"> */}
        {/* <CloudIcon className="w-5 h-5 text-info mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-info">Okta Integration</p>
          <p className="text-gray-400 mt-1">
            Configure Okta SSO for seamless enterprise authentication
          </p>
        </div> */}
      {/* </div> */}

      {/* Okta Redirect URL helper */}
      <div className="mb-6 p-4 bg-gray-900/30 border border-gray-700 rounded-xl">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          OKTA Redirect URL
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={oktaRedirectUrl}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100"
          />
          <button
            type="button"
            onClick={handleCopyOktaRedirectUrl}
            className="group inline-flex items-center gap-2 px-3 py-2 h-[40px] rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 hover:scale-105 transform"
            style={{ minWidth: 0 }}
          >
            {copiedRedirectUrl ? (
              <>
                <CheckIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                Copied
              </>
            ) : (
              <>
                <ClipboardIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleUpsertOktaIdp} className="space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center space-x-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={isOktaEnabled}
                onChange={(e) => setIsOktaEnabled(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full shadow-inner transition-all duration-300 ${
                isOktaEnabled 
                  ? 'bg-gradient-to-r from-primary to-primary-light shadow-lg' 
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}>
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 transform ${
                  isOktaEnabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </div>
            </div>
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors duration-300">
              Enable
            </span>
          </label>
          {isOktaEnabled && (
            <button
              type="button"
              onClick={testOktaConnection}
              className="text-sm text-primary hover:text-primary-dark transition-colors"
            >
              Test Connection
            </button>
          )}
        </div>

        {isOktaEnabled && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Domain Name
              </label>
              <input
                type="text"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
                placeholder="your-domain.okta.com"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                required={isOktaEnabled}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter your full Okta domain (e.g., company.okta.com)
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Client ID
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="0oa..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                required={isOktaEnabled}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Found in your Okta application settings
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Client Secret
              </label>
              <div className="relative">
                <input
                  type={showClientSecret ? 'text' : 'password'}
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Enter client secret"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                  required={isOktaEnabled}
                />
                <button
                  type="button"
                  onClick={() => setShowClientSecret(!showClientSecret)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 dark:hover:bg-gray-600 rounded-r-xl transition-colors"
                >
                  {showClientSecret ? 
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" /> : 
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  }
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Found in your Okta application settings
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Setup Instructions
              </h4>
              <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                <li>Create a new OIDC application in your Okta Admin Console</li>
                <li>Set the application type to "Web Application"</li>
                <li>Configure redirect URIs in your Okta application</li>
                <li>Copy the Client ID and Client Secret from Okta to the fields above</li>
              </ol>
            </div>
            
            {oktaLoadError && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                <div className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    {oktaLoadError}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
        
        <button
          type="submit"
          disabled={isOktaIdpInProgress || !isOktaEnabled || (isOktaEnabled && (!domainName.trim() || !clientId.trim() || !clientSecret.trim())) || !hasOktaIdpDataChanged()}
          className="w-full btn-primary py-3 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
        >
          {isOktaIdpInProgress ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {currentOktaIdp ? 'Updating...' : 'Creating...'}
            </span>
          ) : (
            currentOktaIdp ? 'Update SSO Configuration' : 'Create SSO Configuration'
          )}
        </button>
      </form>
    </div>
  );
}
