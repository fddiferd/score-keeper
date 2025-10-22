import React, { useState, useEffect, useRef } from 'react';
import { ClipboardIcon, CheckIcon, CloudIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import frontendApiClient from '@/client/frontend-api-client';
import axios from 'axios';
import { parseSamlMetadataXml, UpdateSamlMetadataXmlFormState } from '@/models/idp';

export default function GoogleSSOIDP() {
  // Google SSO resolved info display
  const [googleSpEntityId, setGoogleSpEntityId] = useState<string>('');
  const [googleAcsUrl, setGoogleAcsUrl] = useState<string>('');
  const [copiedGoogleSpEntityId, setCopiedGoogleSpEntityId] = useState<boolean>(false);
  const [copiedGoogleAcsUrl, setCopiedGoogleAcsUrl] = useState<boolean>(false);

  // Google SSO (SAML) upload state
  const [googleMetadataFile, setGoogleMetadataFile] = useState<File | null>(null);
  const [isGoogleUploadInProgress, setGoogleUploadInProgress] = useState(false);
  const [googleUploadMessage, setGoogleUploadMessage] = useState<string | null>(null);
  const [googleUploadError, setGoogleUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Load IDPs and extract Google Workspace SAML details
  useEffect(() => {
    const loadIdentityProviders = async () => {
      try {
        const resp = await frontendApiClient.get('/idp/providers');
        const providers = Array.isArray(resp.data) ? resp.data : [];
        const google = providers.find((p: any) => p?.type === 'GOOGLE_WORKSPACE' && p?.protocol?.type === 'SAML2');
        if (google?.protocol) {
          setGoogleSpEntityId(google.protocol.spEntityId || '');
          setGoogleAcsUrl(google.protocol.acsUrl || '');
        } else {
          setGoogleSpEntityId('');
          setGoogleAcsUrl('');
        }
      } catch (e) {
        // Silent: not critical
        setGoogleSpEntityId('');
        setGoogleAcsUrl('');
      }
    };
    loadIdentityProviders();
  }, []);

  const handleCopy = async (value: string, setCopied: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const handleGoogleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setGoogleMetadataFile(file);
    setGoogleUploadMessage(null);
    setGoogleUploadError(null);
  };

  const handleClickSelectGoogleFile = () => {
    fileInputRef.current?.click();
  };

  const handleUploadGoogleMetadata = async () => {
    if (!googleMetadataFile) return;
    setGoogleUploadInProgress(true);
    setGoogleUploadMessage(null);
    setGoogleUploadError(null);
    try {
      const text = await googleMetadataFile.text();
      const parsed: UpdateSamlMetadataXmlFormState = parseSamlMetadataXml(text);
      await frontendApiClient.post('/idp/google/saml/upsert', { metadata: parsed });
      setGoogleUploadMessage('Google SSO configuration saved.');
    } catch (error) {
      console.error('Google SAML metadata upload error:', error);
      if (axios.isAxiosError(error)) {
        setGoogleUploadError(error.response?.data?.message || 'Failed to save configuration.');
      } else {
        setGoogleUploadError('Unexpected error during save.');
      }
    } finally {
      setGoogleUploadInProgress(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-700">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 bg-gradient-to-r from-primary to-primary-light">
          <CloudIcon className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Google SSO (SAML)
        </h3>
      </div>

      {/* <div className="mb-6 p-4 bg-info/10 border border-info/20 rounded-xl">
        <p className="text-sm text-gray-300">
          Upload your Google IdP metadata XML file to configure SAML. Backend integration is not available yet; this will gracefully report when the endpoint is missing.
        </p>
      </div> */}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Metadata XML File
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xml,application/xml,text/xml"
            onChange={handleGoogleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleClickSelectGoogleFile}
            className="w-full px-4 py-6 border border-dashed border-gray-600 rounded-xl text-sm text-gray-300 hover:border-primary hover:bg-primary/10 transition-colors"
          >
            {googleMetadataFile ? 'Change file' : 'Choose XML file'}
          </button>
          {googleMetadataFile && (
            <p className="mt-2 text-xs text-gray-400">
              Selected: {googleMetadataFile.name}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleUploadGoogleMetadata}
          disabled={!googleMetadataFile || isGoogleUploadInProgress}
          className="w-full btn-primary py-3 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
        >
          {isGoogleUploadInProgress ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </span>
          ) : (
            'Upload XML'
          )}
        </button>

        {googleUploadMessage && (
          <div className="p-4 bg-green-900/20 border border-green-800 rounded-xl">
            <div className="flex items-start space-x-3">
              <CheckCircleIcon className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-200">{googleUploadMessage}</p>
            </div>
          </div>
        )}

        {googleUploadError && (
          <div className="p-4 bg-yellow-900/20 border border-yellow-800 rounded-xl">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-200">{googleUploadError}</p>
            </div>
          </div>
        )}

        {(googleSpEntityId || googleAcsUrl) && (
          <div className="mt-6 p-4 bg-gray-900/30 border border-gray-700 rounded-xl space-y-4">
            <p className="text-sm text-gray-300">
              Use these Google SAML Service Provider URLs in your Google Admin configuration.
            </p>
            {googleSpEntityId && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">SP Entity ID</label>
                <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={googleSpEntityId}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(googleSpEntityId, setCopiedGoogleSpEntityId)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  {copiedGoogleSpEntityId ? (<><CheckIcon className="w-5 h-5" />Copied</>) : (<><ClipboardIcon className="w-5 h-5" />Copy</>)}
                </button>
                </div>
              </div>
            )}
            {googleAcsUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">ACS URL</label>
                <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={googleAcsUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(googleAcsUrl, setCopiedGoogleAcsUrl)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  {copiedGoogleAcsUrl ? (<><CheckIcon className="w-5 h-5" />Copied</>) : (<><ClipboardIcon className="w-5 h-5" />Copy</>)}
                </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
