import React, { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import frontendApiClient from '@/client/frontend-api-client';
import axios from 'axios';

interface UserProfileData {
  firstName: string;
  lastName: string;
}

export default function ProfileInfo() {
  const { currentUser, isLoadingUser, setCurrentUser } = useUser();
  const [profile, setProfile] = useState<UserProfileData>({
    firstName: '',
    lastName: ''
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // Track if profile data has changed
  const hasProfileDataChanged = () => {
    if (!currentUser) return false;
    return profile.firstName !== (currentUser.givenName || '') || 
           profile.lastName !== (currentUser.familyName || '');
  };

  // Update profile when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfile({
        firstName: currentUser.givenName || '',
        lastName: currentUser.familyName || ''
      });
    }
  }, [currentUser]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    
    try {
      const response = await frontendApiClient.patch('/user/me', {
        givenName: profile.firstName,
        familyName: profile.lastName
      });
      
      // Update the current user in context with the updated data
      setCurrentUser(response.data);
      
      // Show success message (you can implement a toast system later)
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      if (axios.isAxiosError(error)) {
        console.error('API Error:', error.response?.data);
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-700">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 bg-gradient-to-r from-primary-dark to-primary">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Profile Information
        </h3>
      </div>
      {isLoadingUser ? (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <form onSubmit={handleProfileUpdate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Enter your first name"
                className="w-full px-4 py-3 border border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-gray-700 text-white transition-all duration-200 hover:border-gray-500"
                autoComplete="given-name"
                required
                disabled={isLoadingUser}
              />
            </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={profile.lastName}
              onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
              placeholder="Enter your last name"
              className="w-full px-4 py-3 border border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-gray-700 text-white transition-all duration-200 hover:border-gray-500"
              autoComplete="family-name"
              required
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <div className="w-full px-4 py-3 border border-gray-600 rounded-xl bg-gray-800 text-gray-400">
              {currentUser?.email || 'Loading...'}
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isUpdatingProfile || !hasProfileDataChanged()}
          className="w-full btn-primary py-3 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
        >
          {isUpdatingProfile ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </span>
          ) : (
            'Update Profile'
          )}
        </button>
      </form>
      )}
    </div>
  );
}
