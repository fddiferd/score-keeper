import React, { useState, useCallback } from 'react';
import { useWristbandSession } from "@wristband/react-client-auth";
import frontendApiClient from "@/client/frontend-api-client";
import { redirectToLogin } from "@wristband/react-client-auth";
import axios from "axios";
import { useUser } from "@/contexts/UserContext";

export default function Home() {
  const [isNicknameLoading, setIsNicknameLoading] = useState<boolean>(false);
  const { metadata } = useWristbandSession();
  const { currentUser, setCurrentUser } = useUser();

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

  const generateNewNickname = async () => {
    try {
      setIsNicknameLoading(true);
      const response = await frontendApiClient.post('/nickname', null);
      // Update only the nickname field in the current user
      if (response.data.nickname && currentUser) {
        setCurrentUser({
          ...currentUser,
          nickname: response.data.nickname
        });
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsNicknameLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="mb-10">
        <h1 className="page-title mb-4">
          Home
        </h1>
        <p className="page-description">
          You're successfully authenticated with Wristband
        </p>
      </div>

      <div className="space-y-8">
        {/* Session Information */}
        {metadata ? (
          <div className="page-card-feature">
            <div className="page-card-feature-header">
              <div className="page-card-feature-icon">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="page-card-title text-primary">
                Active Session
              </h2>
            </div>
            <div className="page-card-content">
              <div className="page-code-block max-h-60 overflow-auto">
                <pre className="text-xs whitespace-pre-wrap break-all font-mono">
                  {JSON.stringify(metadata, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        ) : null}

        {/* Nickname Generator */}
        <div className="page-card-feature">
          <div className="page-card-feature-header">
            <div className="page-card-feature-icon">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="page-card-title text-primary">
              Nickname Generator
            </h2>
          </div>
          <div className="page-card-content">
            <p className="page-text mb-4">
              Generate a unique nickname to update your wristband profile.
            </p>
            
            <button
              onClick={generateNewNickname}
              disabled={isNicknameLoading}
              className="page-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isNicknameLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </span>
              ) : (
                "Generate"
              )}
            </button>

            {currentUser?.nickname && (
              <div className="mt-6 page-code-block">
                <p className="text-sm font-medium page-text-muted mb-2">
                  Your Nickname:
                </p>
                <p className="text-xl font-bold page-text">
                  {currentUser.nickname}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="page-card-simple">
          <h2 className="page-section-title mb-4">
            Quick Actions
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <a
              href="https://docs.wristband.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="font-medium page-text">Documentation</p>
                <p className="text-sm page-text-muted">Learn more about Wristband</p>
              </div>
            </a>

            <div className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium page-text">You're All Set!</p>
                <p className="text-sm page-text-muted">Authentication is working perfectly</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
