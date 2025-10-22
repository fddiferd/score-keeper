import React from 'react';
import { useUser } from '@/contexts/UserContext';

interface OrganizationLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function OrganizationLogo({ className = '', size = 'md' }: OrganizationLogoProps) {
  const { currentTenant } = useUser();

  // Don't render if no tenant or no logo URL
  if (!currentTenant?.logoUrl) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-8 w-auto max-w-32',
    md: 'h-10 w-auto max-w-40', 
    lg: 'h-12 w-auto max-w-48'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src={currentTenant.logoUrl} 
        alt={`${currentTenant.displayName} logo`}
        className={`${sizeClasses[size]} object-contain`}
        onError={(e) => {
          // Hide the image if it fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
    </div>
  );
}
