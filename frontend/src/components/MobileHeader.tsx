import React, { useState, useEffect } from 'react';
import OrganizationLogo from './OrganizationLogo';

interface MobileHeaderProps {
  onOpenSidebar: () => void;
}

export default function MobileHeader({ onOpenSidebar }: MobileHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Find the main content container that has overflow-y-auto
      const scrollContainer = document.querySelector('.flex-1.overflow-y-auto');
      if (scrollContainer) {
        setIsScrolled(scrollContainer.scrollTop > 10);
      }
    };

    // Add scroll listener to the main content container, not window
    const scrollContainer = document.querySelector('.flex-1.overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div className={`block sm:hidden px-4 py-4 sticky top-0 z-50 transition-all duration-300 border-b-4 mobile-header-safe-area ${
      isScrolled ? 'border-primary/20' : 'border-transparent'
    }`}>
      <div className="flex items-center justify-between">
        <button
          onClick={onOpenSidebar}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95 shadow-sm"
          aria-label="Open menu"
        >
          <img 
            src="/icon.svg" 
            alt="Menu" 
            className="w-6 h-6"
          />
        </button>
        
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <OrganizationLogo size="md" />
        </div>
      </div>
    </div>
  );
}
