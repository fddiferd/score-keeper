import React, { useState, useEffect } from 'react';
import SidebarOpen from './SidebarOpen';
import SidebarClosed from './SidebarClosed';
import type { InlineViewSection } from './SidebarOpen';
import type { SidebarConfig, PageNavigationItem } from './types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  navigationItems: PageNavigationItem[];
  onNavigate: (itemId: string) => void;
  config?: SidebarConfig;
  currentPage?: string;
}

export default function Sidebar({ isOpen, onClose, onOpen, navigationItems, onNavigate, config, currentPage }: SidebarProps) {
  const [lastSelectedInlineView, setLastSelectedInlineView] = useState<InlineViewSection>('user');
  const [isAnimating, setIsAnimating] = useState(false);

  const handleInlineViewChange = (view: InlineViewSection) => {
    setLastSelectedInlineView(view);
  };

  // Handle animation state
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <>
      {/* Mobile Backdrop - Only for mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] sm:hidden transition-opacity duration-300 ease-in-out animate-in fade-in"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar Container */}
      <div className={`
        ${isOpen 
          ? 'fixed inset-y-0 left-0 z-[9999] w-full sm:relative sm:h-screen sm:min-w-80 sm:w-80 md:w-96 lg:w-[26rem] xl:w-[30rem] 2xl:w-[36rem] sm:shadow-none shadow-2xl flex-shrink-0' 
          : 'hidden sm:block sm:w-16 sm:h-screen sm:flex-shrink-0'
        }
        transition-all duration-300 ease-out
        ${isAnimating ? 'will-change-transform' : ''}
        bg-gray-900 border-r border-gray-700 overflow-hidden
        ${isOpen ? 'safari-mobile-sidebar' : ''}
      `}>
        {isOpen ? (
          <SidebarOpen 
            onClose={onClose}
            navigationItems={navigationItems}
            onNavigate={onNavigate}
            isOpen={isOpen}
            lastSelectedInlineView={lastSelectedInlineView}
            onInlineViewChange={handleInlineViewChange}
            config={config}
          />
        ) : (
          <SidebarClosed 
            onOpen={onOpen}
            navigationItems={navigationItems}
            onNavigate={onNavigate}
            onInlineViewChange={handleInlineViewChange}
            config={config}
            currentPage={currentPage}
          />
        )}
      </div>
    </>
  );
}