import React from 'react';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useTheme } from '@/contexts/ThemeContext';

export default function Theme() {
  const { theme, effectiveTheme, setTheme } = useTheme();
  
  // Get system theme for display
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  return (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-700">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 bg-gradient-to-r from-primary to-primary-light">
          {effectiveTheme === 'dark' ? (
            <MoonIcon className="w-5 h-5 text-white" />
          ) : (
            <SunIcon className="w-5 h-5 text-white" />
          )}
        </div>
        <h3 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Theme Preferences
        </h3>
      </div>
      

      <div className="space-y-3">
        {/* Light Theme Option */}
        <button
          onClick={() => setTheme('light')}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
            theme === 'light'
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-gray-600 hover:border-gray-500 text-gray-300'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              theme === 'light' 
                ? 'bg-primary text-white' 
                : 'bg-gray-700 text-gray-400'
            }`}>
              <SunIcon className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="font-medium">Light</div>
            </div>
          </div>
          {theme === 'light' && (
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          )}
        </button>

        {/* Dark Theme Option */}
        <button
          onClick={() => setTheme('dark')}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
            theme === 'dark'
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-gray-600 hover:border-gray-500 text-gray-300'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              theme === 'dark' 
                ? 'bg-primary text-white' 
                : 'bg-gray-700 text-gray-400'
            }`}>
              <MoonIcon className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="font-medium">Dark</div>
            </div>
          </div>
          {theme === 'dark' && (
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          )}
        </button>

        {/* System Theme Option */}
        <button
          onClick={() => setTheme('system')}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
            theme === 'system'
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-gray-600 hover:border-gray-500 text-gray-300'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              theme === 'system' 
                ? 'bg-primary text-white' 
                : 'bg-gray-700 text-gray-400'
            }`}>
              <ComputerDesktopIcon className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="font-medium">System</div>
              <div className="text-sm text-gray-400">Currently {getSystemTheme()}</div>
            </div>
          </div>
          {theme === 'system' && (
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
