import React, { useState, useEffect } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import frontendApiClient from '@/client/frontend-api-client';
import axios from 'axios';

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePassword() {
  const [password, setPassword] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  
  // Password validation state
  const [passwordValidation, setPasswordValidation] = useState({
    hasCurrentPassword: false,
    hasNewPassword: false,
    passwordsMatch: false,
    isNewPasswordValid: false
  });

  // Real-time password validation
  useEffect(() => {
    const hasCurrentPassword = password.currentPassword.trim().length > 0;
    const hasNewPassword = password.newPassword.trim().length >= 8;
    const passwordsMatch = password.newPassword === password.confirmPassword && password.confirmPassword.length > 0;
    const isNewPasswordValid = password.newPassword.length >= 8 && password.newPassword.length <= 64;

    setPasswordValidation({
      hasCurrentPassword,
      hasNewPassword,
      passwordsMatch,
      isNewPasswordValid
    });
  }, [password.currentPassword, password.newPassword, password.confirmPassword]);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (password.newPassword !== password.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    
    if (password.currentPassword === password.newPassword) {
      alert('New password must be different from current password');
      return;
    }
    
    setIsUpdatingPassword(true);
    
    try {
      await frontendApiClient.post('/user/me/change-password', {
        currentPassword: password.currentPassword,
        newPassword: password.newPassword
      });
      
      // Clear password fields on success
      setPassword({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Show success message
      console.log('Password updated successfully');
    } catch (error) {
      console.error('Error updating password:', error);
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        if (error.response?.status === 400) {
          alert(errorData?.message || 'Password change failed. Please check your current password or ensure your new password meets security requirements.');
        } else if (error.response?.status === 403) {
          alert(errorData?.message || 'You are not authorized to change passwords. Please contact your administrator to enable password change permissions.');
        } else {
          alert('An error occurred while updating your password. Please try again.');
        }
      } else {
        alert('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-700">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 bg-gradient-to-r from-primary to-primary-light">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Change Password
        </h3>
      </div>
      <form onSubmit={handlePasswordUpdate} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              value={password.currentPassword}
              onChange={(e) => setPassword(prev => ({ ...prev, currentPassword: e.target.value }))}
              placeholder="Enter your current password"
              className="w-full px-4 py-3 pr-12 border border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-gray-700 text-white transition-all duration-200 hover:border-gray-500"
              autoComplete="current-password"
              required
              minLength={8}
              maxLength={64}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('current')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center rounded-r-xl transition-colors"
            >
              {showPasswords.current ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-300" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-300" />
              )}
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              value={password.newPassword}
              onChange={(e) => setPassword(prev => ({ ...prev, newPassword: e.target.value }))}
              placeholder="Enter your new password"
              className="w-full px-4 py-3 pr-12 border border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-gray-700 text-white transition-all duration-200 hover:border-gray-500"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={64}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('new')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center rounded-r-xl transition-colors"
            >
              {showPasswords.new ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-300" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-300" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Password must be 8-64 characters long
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              value={password.confirmPassword}
              onChange={(e) => setPassword(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Confirm your new password"
              className={`w-full px-4 py-3 pr-12 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-gray-700 text-white transition-all duration-200 hover:border-gray-500 ${
                password.confirmPassword.length > 0 
                  ? passwordValidation.passwordsMatch 
                    ? 'border-green-600' 
                    : 'border-red-600'
                  : 'border-gray-600'
              }`}
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={64}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirm')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center rounded-r-xl transition-colors"
            >
              {showPasswords.confirm ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-300" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-300" />
              )}
            </button>
          </div>
          {password.confirmPassword.length > 0 && (
            <p className={`text-xs mt-1 ${passwordValidation.passwordsMatch ? 'text-green-400' : 'text-red-400'}`}>
              {passwordValidation.passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
            </p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isUpdatingPassword || !passwordValidation.hasCurrentPassword || !passwordValidation.hasNewPassword || !passwordValidation.passwordsMatch || !passwordValidation.isNewPasswordValid}
          className="w-full btn-primary py-3 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
        >
          {isUpdatingPassword ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </span>
          ) : (
            'Update Password'
          )}
        </button>
      </form>
    </div>
  );
}
