import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
  KeyIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import frontendApiClient from '@/client/frontend-api-client';
import axios from 'axios';

enum SemanticLayerType {
  DBT = 'dbt'
}

interface SemanticLayerConfig {
  type: SemanticLayerType;
  name: string;
  displayName: string;
  environmentId: string;
  token: string;
}

interface SecretModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingSecret: SemanticLayerConfig | null;
}

function SemanticLayerSettingsModel({ isOpen, onClose, onSave, editingSecret }: SecretModalProps) {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [environmentId, setEnvironmentId] = useState('');
  const [token, setToken] = useState('');
  const [type, setType] = useState<SemanticLayerType>(SemanticLayerType.DBT);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [skuExists, setNameExists] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (editingSecret) {
      setName(editingSecret.name);
      setDisplayName(editingSecret.displayName);
      setEnvironmentId(editingSecret.environmentId);
      setToken(editingSecret.token);
      setType(editingSecret.type);
    } else {
      // Reset form
      setName('');
      setDisplayName('');
      setEnvironmentId('');
      setToken('');
      setType(SemanticLayerType.DBT);
      setIsTypeDropdownOpen(false);
      setShowSecret(false);
      setError(null);
      setNameExists(false);
      setUrlError(null);
    }
  }, [editingSecret, isOpen]);

  const validateUrl = (url: string) => {
    if (!url) {
      setUrlError(null);
      return true;
    }
    
    try {
      new URL(url);
      setUrlError(null);
      return true;
    } catch {
      setUrlError('Please enter a valid URL (e.g., https://api.example.com)');
      return false;
    }
  };

  const checkNameExists = useCallback(async (skuValue: string) => {
    if (!skuValue || editingSecret?.name === skuValue) {
      setNameExists(false);
      return;
    }

    try {
      setIsCheckingName(true);
      const response = await frontendApiClient.get(`/semantic-layers/check/${skuValue}`);
      setNameExists(response.data.exists);
      if (response.data.exists) {
        setError('A Semantic Layer with this name already exists. Please choose a different name.');
      } else {
        setError(null);
      }
    } catch (error) {
      console.error('Error checking Semantic Layer Name:', error);
      if (axios.isAxiosError(error)) {
        const errorType = error.response?.data?.error;
        if (errorType === 'datastore_unavailable') {
          setError('Datastore not enabled');
        } else if (errorType === 'encryption_unavailable') {
          setError('Encryption service not available');
        }
      }
    } finally {
      setIsCheckingName(false);
    }
  }, [editingSecret]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (name) {
        checkNameExists(name);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [name, checkNameExists]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown="type-dropdown"]')) {
        setIsTypeDropdownOpen(false);
      }
    };

    if (isTypeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isTypeDropdownOpen]);

  const handleTypeSelect = (selectedType: SemanticLayerType) => {
    setType(selectedType);
    setIsTypeDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (skuExists && !editingSecret) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const secretData: SemanticLayerConfig = {
        type: type,
        name: name,
        displayName,
        environmentId: environmentId,
        token: token,
      };

      await frontendApiClient.post('/semantic-layers/upsert', secretData);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving Semantic Layer:', error);
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        if (errorData?.error === 'datastore_unavailable') {
          setError('Datastore not enabled');
        } else if (errorData?.error === 'encryption_unavailable') {
          setError('Encryption service not available');
        } else if (errorData?.error === 'encryption_error') {
          setError('Failed to encrypt Semantic Layer data');
        } else {
          setError(errorData?.message || 'Failed to save Semantic Layer. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] transition-all duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Modal Panel - Optimized for mobile */}
      <div className={`fixed inset-0 sm:inset-y-0 sm:right-0 z-[9999] w-full sm:max-w-md lg:max-w-lg bg-white dark:bg-gray-900 shadow-2xl transform transition-all duration-300 ease-out overflow-hidden ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full max-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-r from-primary to-primary-dark">
                <KeyIcon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {editingSecret ? 'Edit Semantic Layer' : 'Add New Semantic Layer'}
              </h3>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 pb-safe">
                  
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              <div className="space-y-4 sm:space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Type
                      </label>
                      <div className="relative" data-dropdown="type-dropdown">
                        <button
                          type="button"
                          onClick={() => !editingSecret && setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                          className={`w-full px-4 py-3 pr-10 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white transition-all duration-200 text-left ${
                            editingSecret 
                              ? 'border-gray-300 dark:border-gray-600 cursor-not-allowed opacity-60' 
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer'
                          }`}
                          disabled={!!editingSecret}
                        >
                          <div className="flex items-center gap-3">
                            <img 
                              src={`/${type.toLowerCase()}-icon.svg`} 
                              alt={type} 
                              className="w-5 h-5"
                            />
                            <span>{type.toUpperCase()}</span>
                          </div>
                        </button>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                            isTypeDropdownOpen ? 'rotate-180' : ''
                          }`} />
                        </div>
                        
                        {/* Dropdown Options */}
                        {isTypeDropdownOpen && !editingSecret && (
                          <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg">
                            {Object.values(SemanticLayerType).map((typeOption) => (
                              <button
                                key={typeOption}
                                type="button"
                                onClick={() => handleTypeSelect(typeOption)}
                                className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl ${
                                  type === typeOption 
                                    ? 'bg-primary/10 text-primary dark:bg-primary/20' 
                                    : 'text-gray-900 dark:text-white'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={`/${typeOption.toLowerCase()}-icon.svg`} 
                                    alt={typeOption} 
                                    className="w-5 h-5"
                                  />
                                  <span>{typeOption.toUpperCase()}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="page-form-label">
                        Name
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className={`page-form-input ${
                            editingSecret 
                              ? 'cursor-not-allowed opacity-60' 
                              : skuExists && !editingSecret 
                                ? 'border-red-300 dark:border-red-600' 
                                : ''
                          }`}
                          placeholder="unique-name"
                          required
                          disabled={!!editingSecret}
                        />
                        {isCheckingName && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="page-form-label">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="page-form-input"
                        placeholder="Semantic Layer Name"
                        required
                      />
                    </div>

                    <div>
                      <label className="page-form-label">
                        ID
                      </label>
                      <input
                        type="text"
                        value={environmentId}
                        onChange={(e) => setEnvironmentId(e.target.value)}
                        className="page-form-input"
                        placeholder="Environment ID"
                        required
                      />
                    </div>

                    <div>
                      <label className="page-form-label">
                        Secret Value
                      </label>
                      <div className="relative">
                        <input
                          type={showSecret ? 'text' : 'password'}
                          value={token}
                          onChange={(e) => setToken(e.target.value)}
                          className="page-form-input pr-12"
                          placeholder="••••••••••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecret(!showSecret)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showSecret ? (
                            <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                          ) : (
                            <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                          )}
                        </button>
                      </div>
                    </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={handleSubmit}
              disabled={isSaving || (skuExists && !editingSecret) || !!urlError}
              className="btn-primary w-full sm:w-auto px-6 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              {isSaving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                editingSecret ? 'Update Semantic Layer' : 'Add Semantic Layer'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full sm:w-auto px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:mr-3 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

export default function SemanticLayers() {
  const [semanticLayerConfigs, setSemanticLayerConfigs] = useState<SemanticLayerConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSecret, setEditingSecret] = useState<SemanticLayerConfig | null>(null);
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});
  const [datastoreNotEnabled, setDatastoreNotEnabled] = useState(false);
  const [encryptionNotEnabled, setEncryptionNotEnabled] = useState(false);
  const [showSecretModal, setShowSecretModal] = useState<string | null>(null);
  const [activeDropdownConfigName, setActiveDropdownConfigName] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{top: number, left: number} | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const dropdownRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const portalDropdownRef = useRef<HTMLDivElement>(null);

  const fetchSecrets = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await frontendApiClient.get('/semantic-layers');
      setSemanticLayerConfigs(response.data);
      setDatastoreNotEnabled(false);
      setEncryptionNotEnabled(false);
    } catch (error) {
      console.error('Error fetching Semantic Layers:', error);
      if (axios.isAxiosError(error)) {
        console.error('API Error:', error.response?.data);
        const errorType = error.response?.data?.error;
        if (errorType === 'datastore_unavailable') {
          setDatastoreNotEnabled(true);
        } else if (errorType === 'encryption_unavailable') {
          setEncryptionNotEnabled(true);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecrets();
  }, [fetchSecrets]);

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdownConfigName) {
        const dropdownRef = dropdownRefs.current[activeDropdownConfigName];
        const target = event.target as Node;
        
        // Check if click is outside both the button and the portal dropdown
        const isOutsideButton = dropdownRef && !dropdownRef.contains(target);
        const isOutsidePortal = portalDropdownRef.current && !portalDropdownRef.current.contains(target);
        
        if (isOutsideButton && isOutsidePortal) {
          setActiveDropdownConfigName(null);
          setDropdownPosition(null);
        }
      }
    };

    if (activeDropdownConfigName) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [activeDropdownConfigName]);

  const filteredSecrets = semanticLayerConfigs.filter(semanticLayerConfig => {
    const searchLower = searchTerm.toLowerCase();
    return semanticLayerConfig.displayName.toLowerCase().includes(searchLower) ||
           semanticLayerConfig.name.toLowerCase().includes(searchLower) ||
           semanticLayerConfig.environmentId.toLowerCase().includes(searchLower) ||
           semanticLayerConfig.type.toLowerCase().includes(searchLower);
  });

  const handleAddSecret = () => {
    setEditingSecret(null);
    setIsModalOpen(true);
  };

  const handleEditSecret = (semanticLayerConfig: SemanticLayerConfig) => {
    setEditingSecret(semanticLayerConfig);
    setIsModalOpen(true);
  };

  const handleDeleteSecret = async (name: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this Semantic Layer? This action cannot be undone.');
    if (!confirmDelete) {
      return;
    }

    try {
      setIsDeleting(name);
      await frontendApiClient.delete(`/semantic-layers/${name}`);
      
      // Refresh the secrets list
      await fetchSecrets();
      
      window.alert('Semantic Layer has been deleted successfully.');
      setActiveDropdownConfigName(null);
      setDropdownPosition(null);
    } catch (error) {
      console.error('Error deleting Semantic Layer:', error);
      if (axios.isAxiosError(error)) {
        const errorType = error.response?.data?.error;
        if (errorType === 'datastore_unavailable') {
          window.alert('Datastore not enabled');
        } else if (errorType === 'encryption_unavailable') {
          window.alert('Encryption service not available');
        } else {
          window.alert('Failed to delete Semantic Layer. Please try again.');
        }
      } else {
        window.alert('Failed to delete Semantic Layer. Please try again.');
      }
    } finally {
      setIsDeleting(null);
    }
  };

  if (encryptionNotEnabled) {
    return (
      <div className="page-container">
        <div className="mb-10">
          <h1 className="page-title mb-4">
            Semantic Layer Settings
          </h1>
        </div>
        
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-medium page-text">Encryption Service Not Available</h3>
          <p className="mt-2 page-text-muted">
            The encryption service is not available. Please check the server configuration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-container">
        <div className="mb-10">
          <h1 className="page-title mb-4">
            Semantic Layers
          </h1>
          <p className="page-description">
            Add, edit, or remove different kinds of Semantic Layers
          </p>
        </div>
        
        <div className="space-y-6">
        {/* Search and Add */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search"
              className="page-form-input pl-10"
            />
          </div>
          
          <button
            onClick={handleAddSecret}
            // Make button square and same height as input (input is py-2.5, so h-[44px])
            className="btn-primary h-[44px] w-[44px] rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md flex items-center justify-center"
            style={{ minWidth: 0, padding: 0 }}
            aria-label="Add Semantic Layer"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Table */}
        <div className="page-card overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : filteredSecrets.length === 0 ? (
            <div className="text-center py-12">
              <KeyIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-400">No Semantic Layers found</p>
              <p className="text-sm text-gray-500">Add your first Semantic Layer to get started</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-2 py-3 text-left">
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Creds
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSecrets.map((semanticLayerConfig) => (
                  <tr key={semanticLayerConfig.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    {/* Three dots dropdown */}
                    <td className="px-2 py-4 whitespace-nowrap text-left">
                      <div className="relative" ref={(el) => { dropdownRefs.current[semanticLayerConfig.name] = el; }}>
                        <button 
                          className="text-gray-400 hover:text-primary transition-colors p-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeDropdownConfigName === semanticLayerConfig.name) {
                              setActiveDropdownConfigName(null);
                              setDropdownPosition(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setDropdownPosition({
                                top: rect.bottom + window.scrollY + 4,
                                left: rect.left + window.scrollX
                              });
                              setActiveDropdownConfigName(semanticLayerConfig.name);
                            }
                          }}
                        >
                          <EllipsisVerticalIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                    {/* Type, Display Name, and Name */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {/* Type icon with spacing */}
                        <div className="flex-shrink-0 mr-4">
                          <div className="relative group">
                            <img 
                              src={`/${semanticLayerConfig.type.toLowerCase()}-icon.svg`} 
                              alt={semanticLayerConfig.type} 
                              className="w-6 h-6 hover:opacity-80 transition-opacity cursor-pointer"
                            />
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                              {semanticLayerConfig.type.toUpperCase()}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                            </div>
                          </div>
                        </div>
                        {/* Display Name with name tooltip on hover */}
                        <div className="min-w-0">
                          <div className="relative group">
                            <div className="text-lg font-medium page-text truncate cursor-pointer">
                              {semanticLayerConfig.displayName}
                            </div>
                            {/* Tooltip showing the name */}
                            <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                              {semanticLayerConfig.name}
                              <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Environment ID with eye icon */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-medium page-text truncate">
                          {semanticLayerConfig.environmentId}
                        </div>
                        <button
                          onClick={() => setShowSecretModal(semanticLayerConfig.name)}
                          className="text-gray-400 hover:text-gray-300 transition-colors p-1 flex-shrink-0"
                          title="View Secret"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
        </div>
      </div>

      {/* Action Dropdown Portal */}
      {activeDropdownConfigName && dropdownPosition && ReactDOM.createPortal(
        <div 
          ref={portalDropdownRef}
          className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[140px] z-[1000]"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              const config = semanticLayerConfigs.find(c => c.name === activeDropdownConfigName);
              if (config) {
                handleEditSecret(config);
                setActiveDropdownConfigName(null);
                setDropdownPosition(null);
              }
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-2"
          >
            <PencilIcon className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (activeDropdownConfigName) {
                handleDeleteSecret(activeDropdownConfigName);
              }
            }}
            disabled={isDeleting === activeDropdownConfigName}
            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting === activeDropdownConfigName ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <TrashIcon className="w-4 h-4" />
            )}
            {isDeleting === activeDropdownConfigName ? 'Deleting...' : 'Delete'}
          </button>
        </div>,
        document.body
      )}

      {/* Secret Modal - Rendered outside of main container */}
      <SemanticLayerSettingsModel
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={fetchSecrets}
        editingSecret={editingSecret}
      />

      {/* Secret View Modal */}
      {showSecretModal && ReactDOM.createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] transition-all duration-300"
            onClick={() => setShowSecretModal(null)}
          />
          
          {/* Modal Panel */}
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full transform transition-all duration-300 scale-100">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-r from-primary to-primary-dark">
                      <EyeIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Credentials
                      </h3>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowSecretModal(null)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Secret Content */}
                <div className="space-y-4">
                  {/* Environment ID Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Environment ID
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                          {semanticLayerConfigs.find(config => config.name === showSecretModal)?.environmentId}
                        </code>
                        <button
                          onClick={() => {
                            const envId = semanticLayerConfigs.find(config => config.name === showSecretModal)?.environmentId;
                            if (envId) {
                              navigator.clipboard.writeText(envId);
                            }
                          }}
                          className="ml-3 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors flex-shrink-0"
                          title="Copy Environment ID"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Secret Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Secret
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                          {semanticLayerConfigs.find(config => config.name === showSecretModal)?.token}
                        </code>
                        <button
                          onClick={() => {
                            const secret = semanticLayerConfigs.find(config => config.name === showSecretModal)?.token;
                            if (secret) {
                              navigator.clipboard.writeText(secret);
                            }
                          }}
                          className="ml-3 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors flex-shrink-0"
                          title="Copy Secret"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              
              
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
