import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({ 
  message = "Loading...", 
  className = "",
  size = 'md'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-primary mb-4 ${sizeClasses[size]}`}></div>
      {message && (
        <p className="page-text-muted text-center">
          {message}
        </p>
      )}
    </div>
  );
}

