import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
  MagnifyingGlassIcon, 
  UserPlusIcon, 
  EllipsisVerticalIcon,
  TrashIcon,
  PencilIcon,
  ShieldCheckIcon,
  UserIcon,
  ChevronDownIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import frontendApiClient from '@/client/frontend-api-client';
import { redirectToLogin } from "@wristband/react-client-auth";
import axios from "axios";
import { User } from '@/models/user';
import { useUser } from '@/contexts/UserContext';

interface Role {
  id: string;
  displayName: string;
  sku: string;
  description?: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  status: string;
  invitationType: string;
  rolesToAssign: string[];
  expirationTime?: string;
  metadata: {
    creationTime: string;
    lastModifiedTime: string;
    version: string;
  };
}

type UserOrInvitation = User | (PendingInvitation & { isPending: true });

export default function Users() {
  const { hasAdminRole } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const [activeDropdownUserId, setActiveDropdownUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{top: number, left: number} | null>(null);
  const dropdownRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const portalDropdownRef = useRef<HTMLDivElement>(null);

  const handleApiError = useCallback((error: unknown) => {
    console.error(error);

    if (axios.isAxiosError(error)) {
      if ([401, 403].includes(error.response?.status!)) {
        redirectToLogin('/api/auth/login');
        window.alert('Authentication required.');
      }
    } else {
      window.alert(`Error: ${error}`);
    }
  }, []);

  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError('Email address is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    
    setEmailError(null);
    return true;
  };

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoadingUsers(true);
      const response = await frontendApiClient.get('/users');
      setUsers(response.data);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [handleApiError]);

  const fetchRoles = useCallback(async () => {
    try {
      setIsLoadingRoles(true);
      console.log('Fetching roles from /api/roles...');
      const response = await frontendApiClient.get('/roles');
      console.log('Roles fetched successfully:', response.data);
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        setAvailableRoles(response.data);
      } else {
        console.log('No roles returned from API');
        setAvailableRoles([]);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      setAvailableRoles([]);
      handleApiError(error);
    } finally {
      setIsLoadingRoles(false);
    }
  }, [handleApiError]);

  const fetchPendingInvitations = useCallback(async () => {
    try {
      setIsLoadingInvitations(true);
      console.log('Fetching pending invitations from /api/users/invitations/pending...');
      const response = await frontendApiClient.get('/users/invitations/pending');
      console.log('Pending invitations fetched successfully:', response.data);
      setPendingInvitations(response.data || []);
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      setPendingInvitations([]);
      // Don't show error for invitations fetch as it's not critical
    } finally {
      setIsLoadingInvitations(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    if (hasAdminRole) {
      fetchRoles();
      fetchPendingInvitations();
    } else {
      // For non-admin users, set invitations loading to false since they don't fetch invitations
      setIsLoadingInvitations(false);
    }
  }, [fetchUsers, fetchRoles, fetchPendingInvitations, hasAdminRole]);


  // Click outside handler for role dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };

    if (isRoleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isRoleDropdownOpen]);

  // Click outside handler for user action dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdownUserId) {
        const dropdownRef = dropdownRefs.current[activeDropdownUserId];
        const target = event.target as Node;
        
        // Check if click is outside both the button and the portal dropdown
        const isOutsideButton = dropdownRef && !dropdownRef.contains(target);
        const isOutsidePortal = portalDropdownRef.current && !portalDropdownRef.current.contains(target);
        
        if (isOutsideButton && isOutsidePortal) {
          setActiveDropdownUserId(null);
          setDropdownPosition(null);
        }
      }
    };

    if (activeDropdownUserId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [activeDropdownUserId]);

  // Combine users and pending invitations
  const combinedUsersAndInvitations: UserOrInvitation[] = [
    ...users,
    ...pendingInvitations.map(invitation => ({ ...invitation, isPending: true as const }))
  ];

  const filteredUsersAndInvitations = combinedUsersAndInvitations.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    
    if ('isPending' in item) {
      // This is a pending invitation
      const email = item.email || '';
      return email.toLowerCase().includes(searchLower);
    } else {
      // This is a regular user
      const firstName = item.givenName || '';
      const lastName = item.familyName || '';
      const fullName = item.fullName || '';
      const email = item.email || '';
      
      return firstName.toLowerCase().includes(searchLower) ||
             lastName.toLowerCase().includes(searchLower) ||
             fullName.toLowerCase().includes(searchLower) ||
             email.toLowerCase().includes(searchLower);
    }
  });

  const formatLastLogin = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getRoleIcon = (roles: string[]) => {
    if (roles.includes('admin') || roles.includes('Admin')) {
      return <ShieldCheckIcon className="w-4 h-4 text-primary" />;
    }
    return <UserIcon className="w-4 h-4 text-primary" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-success/10 text-success';
      case 'PROVISIONED':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200';
      case 'INACTIVE':
      case 'DEACTIVATED':
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200';
      case 'SUSPENDED':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'Active';
      case 'PROVISIONED':
        return 'Provisioned';
      case 'INACTIVE':
      case 'DEACTIVATED':
        return 'Inactive';
      case 'SUSPENDED':
        return 'Suspended';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!hasAdminRole) {
      window.alert('You do not have permission to delete users.');
      return;
    }

    const confirmDelete = window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.');
    if (!confirmDelete) {
      return;
    }

    try {
      setIsDeleting(userId);
      await frontendApiClient.delete(`/users/${userId}`);
      
      // Refresh the users list
      await fetchUsers();
      
      window.alert('User has been deleted successfully.');
      setActiveDropdownUserId(null);
      setDropdownPosition(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      handleApiError(error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!hasAdminRole) {
      window.alert('You do not have permission to cancel invitations.');
      return;
    }

    const confirmCancel = window.confirm('Are you sure you want to cancel this invitation? This action cannot be undone.');
    if (!confirmCancel) {
      return;
    }

    try {
      setIsCancelling(invitationId);
      await frontendApiClient.delete(`/users/invitations/${invitationId}`);
      
      // Refresh the pending invitations list
      await fetchPendingInvitations();
      
      window.alert('Invitation has been cancelled successfully.');
      setActiveDropdownUserId(null);
      setDropdownPosition(null);
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      handleApiError(error);
    } finally {
      setIsCancelling(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          Users
        </h1>
      </div>
      
      <div className="space-y-6">
      {/* 
      MARK: - Search and Invite
      */}
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
            className="w-full px-4 py-2.5 pl-10 border border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-gray-700 text-white transition-all duration-200 hover:border-gray-500"
          />
        </div>
        
        {hasAdminRole && (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="group btn-primary px-6 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium shadow-lg hover:shadow-2xl hover:-translate-y-1 hover:scale-105 flex items-center gap-2 whitespace-nowrap transform"
          >
            <UserPlusIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" /></button>
        )}
      </div>

      {/* 
      MARK: - Users List
      */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          {(isLoadingUsers || isLoadingInvitations) ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : filteredUsersAndInvitations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No users or pending invitations found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  {hasAdminRole && (
                    <th className="px-2 py-3 text-left">
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredUsersAndInvitations.map((item) => (
                <tr 
                  key={item.id} 
                  className="hover:bg-gray-700/50 transition-colors cursor-pointer"
                  onClick={() => {
                    if (!('isPending' in item)) {
                      setSelectedUser(item);
                    }
                  }}
                >
                  {hasAdminRole && (
                    <td className="px-2 py-4 whitespace-nowrap text-left">
                      <div className="relative" ref={(el) => { dropdownRefs.current[item.id] = el; }}>
                        <button 
                          className="text-gray-400 hover:text-primary transition-colors p-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeDropdownUserId === item.id) {
                              setActiveDropdownUserId(null);
                              setDropdownPosition(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setDropdownPosition({
                                top: rect.bottom + window.scrollY + 4,
                                left: rect.left + window.scrollX // Position to the right of the button
                              });
                              setActiveDropdownUserId(item.id);
                            }
                          }}
                        >
                          <EllipsisVerticalIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        {'isPending' in item ? (
                          // Pending invitation avatar
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center text-white font-medium">
                            {item.email[0].toUpperCase()}
                          </div>
                        ) : item.pictureUrl ? (
                          // Regular user with picture
                          <img className="h-10 w-10 rounded-full" src={item.pictureUrl} alt="" />
                        ) : (
                          // Regular user without picture
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-dark to-primary flex items-center justify-center text-white font-medium">
                            {(item.givenName?.[0] || item.email[0]).toUpperCase()}{(item.familyName?.[0] || '').toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">
                          {'isPending' in item ? (
                            // Pending invitation display name
                            <>
                              {item.email}
                              <span className="ml-2 text-xs text-orange-400 font-normal">(Pending)</span>
                            </>
                          ) : (
                            // Regular user display name
                            item.fullName || item.displayName || `${item.givenName || ''} ${item.familyName || ''}`.trim() || item.email
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {'isPending' in item ? (
                            item.invitationType
                          ) : (
                            item.email
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {'isPending' in item ? (
                        // Pending invitation roles
                        item.rolesToAssign && item.rolesToAssign.length > 0 ? (
                          item.rolesToAssign.map((roleId, index) => {
                            const roleObj = availableRoles.find(r => r.sku === roleId || r.id === roleId);
                            const displayName = roleObj?.displayName || roleId;
                            return (
                              <span key={index} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700">
                                <UserIcon className="w-3 h-3" />
                                {displayName}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400 text-sm">No roles</span>
                        )
                      ) : (
                        // Regular user roles
                        item.roles.length > 0 ? (
                          item.roles.map((role, index) => (
                            <span key={index} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-primary/10 text-primary border-primary/20">
                              {getRoleIcon(item.roles)}
                              {role}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400 text-sm">No roles</span>
                        )
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {'isPending' in item ? (
                      // Pending invitation status
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200">
                        Pending
                      </span>
                    ) : (
                      // Regular user status  
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(item.status)}`}>
                        {getStatusText(item.status)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {'isPending' in item ? (
                      formatLastLogin(item.metadata.creationTime)
                    ) : (
                      formatLastLogin(item.metadata.creationTime)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {/* 
      MARK: - User Action Dropdown
      */}
      {activeDropdownUserId && dropdownPosition && ReactDOM.createPortal(
        <div 
          ref={portalDropdownRef}
          className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[140px] z-[1000]"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {(() => {
            // Find the item to determine if it's a pending invitation or regular user
            const activeItem = filteredUsersAndInvitations.find(item => item.id === activeDropdownUserId);
            const isPendingInvitation = activeItem && 'isPending' in activeItem;
            
            if (isPendingInvitation) {
              // Cancel Invite button for pending invitations
              return (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancelInvitation(activeDropdownUserId);
                  }}
                  disabled={isCancelling === activeDropdownUserId}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCancelling === activeDropdownUserId ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <TrashIcon className="w-4 h-4" />
                  )}
                  {isCancelling === activeDropdownUserId ? 'Cancelling...' : 'Cancel Invite'}
                </button>
              );
            } else {
              // Delete User button for regular users
              return (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteUser(activeDropdownUserId);
                  }}
                  disabled={isDeleting === activeDropdownUserId}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting === activeDropdownUserId ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <TrashIcon className="w-4 h-4" />
                  )}
                  {isDeleting === activeDropdownUserId ? 'Deleting...' : 'Delete User'}
                </button>
              );
            }
          })()}
        </div>,
        document.body
      )}

      {/* 
      MARK: - Invite User Modal
      */}
      {hasAdminRole && isInviteModalOpen && ReactDOM.createPortal(
        <>
          {/* Backdrop */}
          <div 
            className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] transition-all duration-300 ${
              isInviteModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => {
              setIsInviteModalOpen(false);
              setInviteEmail('');
              setSelectedRole('');
              setEmailError(null);
              setIsRoleDropdownOpen(false);
              setActiveDropdownUserId(null);
              setDropdownPosition(null);
            }}
          />
          
          {/* Modal Panel - Optimized for mobile */}
          <div className={`fixed inset-0 sm:inset-y-0 sm:right-0 z-[9999] w-full sm:max-w-md lg:max-w-lg bg-white dark:bg-gray-900 shadow-2xl transform transition-all duration-300 ease-out overflow-hidden ${
            isInviteModalOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="flex flex-col h-full max-h-screen">
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-r from-primary to-primary-dark">
                    <UserPlusIcon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Invite New User
                  </h3>
                </div>
                
                <button
                  onClick={() => {
                    setIsInviteModalOpen(false);
                    setInviteEmail('');
                    setSelectedRole('');
                    setEmailError(null);
                    setIsRoleDropdownOpen(false);
                    setActiveDropdownUserId(null);
                    setDropdownPosition(null);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                >
                  <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pb-safe">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => {
                        setInviteEmail(e.target.value);
                        if (e.target.value) {
                          validateEmail(e.target.value);
                        } else {
                          setEmailError(null);
                        }
                      }}
                      onBlur={(e) => {
                        if (e.target.value) {
                          validateEmail(e.target.value);
                        }
                      }}
                      className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white transition-all duration-200 ${
                        emailError 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                      placeholder="user@example.com"
                      required
                    />
                    {emailError ? (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">{emailError}</p>
                    ) : null}
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Role
                    </label>
                    <div className="relative" ref={roleDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 flex items-center justify-between"
                      >
                        <span className="block truncate">
                          {!selectedRole ? (
                            <span className="text-gray-500 dark:text-gray-400">Select a role...</span>
                          ) : (
                            <span className="text-gray-900 dark:text-white">
                              {availableRoles.find(r => r.sku === selectedRole)?.displayName || selectedRole}
                            </span>
                          )}
                        </span>
                        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isRoleDropdownOpen ? 'transform rotate-180' : ''}`} />
                      </button>

                      {/* Dropdown Panel */}
                      {isRoleDropdownOpen && (
                        <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto">
                          {isLoadingRoles ? (
                            <div className="px-4 py-3 text-center">
                              <svg className="animate-spin h-5 w-5 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </div>
                          ) : availableRoles.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                              No roles available
                            </div>
                          ) : (
                            <div className="py-1">
                              {availableRoles.map((role) => (
                                <button
                                  key={role.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedRole(role.sku);
                                    setIsRoleDropdownOpen(false);
                                  }}
                                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 flex items-center justify-between group"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {role.displayName}
                                      </span>
                                      {role.sku && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                          ({role.sku})
                                        </span>
                                      )}
                                    </div>
                                    {role.description && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        {role.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="ml-3 flex-shrink-0">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                      selectedRole === role.sku
                                        ? 'border-primary'
                                        : 'border-gray-300 dark:border-gray-600 group-hover:border-gray-400 dark:group-hover:border-gray-500'
                                    }`}>
                                      {selectedRole === role.sku && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                      )}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  disabled={!inviteEmail || !!emailError || !selectedRole}
                  className="btn-primary w-full sm:w-auto px-6 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                  onClick={async () => {
                    if (!validateEmail(inviteEmail)) {
                      return;
                    }
                    
                    if (!selectedRole) {
                      window.alert('Please select a role for the user.');
                      return;
                    }
                    
                    try {
                      // Call the backend API to invite the user
                      const response = await frontendApiClient.post('/users/invite', {
                        email: inviteEmail,
                        roles: [selectedRole] // Keep as array for backend compatibility
                      });
                      
                      console.log('User invited successfully:', response.data);
                      
                      // Show success message
                      window.alert(`Invitation sent successfully to ${inviteEmail}`);
                      
                      // Refresh pending invitations list
                      if (hasAdminRole) {
                        fetchPendingInvitations();
                      }
                      
                      // Close modal and reset form
                      setIsInviteModalOpen(false);
                      setInviteEmail('');
                      setSelectedRole('');
                      setEmailError(null);
                      setIsRoleDropdownOpen(false);
                      setActiveDropdownUserId(null);
                      setDropdownPosition(null);
                      
                    } catch (error) {
                      console.error('Error inviting user:', error);
                      handleApiError(error);
                    }
                  }}
                >
                  Send Invite
                </button>
                <button
                  type="button"
                  className="mt-3 w-full sm:w-auto px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:mr-3 transition-all duration-200"
                  onClick={() => {
                    setIsInviteModalOpen(false);
                    setInviteEmail('');
                    setSelectedRole('');
                    setEmailError(null);
                    setIsRoleDropdownOpen(false);
                    setActiveDropdownUserId(null);
                    setDropdownPosition(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
      </div>
    </div>
  );
}
