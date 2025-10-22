import React, { useState } from 'react';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export default function SignOut() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    window.location.href = '/api/auth/logout';
  };

  return (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-700">
      <div className="flex items-center mb-4">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 bg-red-900"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-400" />
        </div>
        <h3 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Sign Out
        </h3>
      </div>
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="w-full text-white py-3 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 bg-red-600 hover:bg-red-700"
      >
        {isLoggingOut ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Logging out...
          </span>
        ) : (
          'Sign Out'
        )}
      </button>
    </div>
  );
}
