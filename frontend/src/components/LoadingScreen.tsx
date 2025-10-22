import React from 'react';

interface LoadingScreenProps {
  message?: string;
  className?: string;
}

export default function LoadingScreen({ 
  message = "", 
  className = "" 
}: LoadingScreenProps) {
  return (
    <div 
      className={`min-h-screen flex items-center justify-center ${className}`}
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4 mx-auto"></div>
        {message && (
          <p style={{ color: 'var(--foreground)' }} className="opacity-70">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
