import React, { useEffect, useState } from 'react';
import { XMarkIcon, UsersIcon, CogIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import SettingsSection from './sections/Settings';
import UsersSection from './sections/Users';
import AdminSection from './sections/Admin';
import { useUser } from '@/contexts/UserContext';
import type { SidebarConfig, SettingsConfig, UsersConfig, AdminConfig, PageNavigationItem } from './types';

export type InlineViewSection = 'user' | 'users' | 'admin';

interface SidebarOpenProps {
  onClose: () => void;
  navigationItems: PageNavigationItem[];
  onNavigate: (itemId: string) => void;
  isOpen: boolean;
  lastSelectedInlineView: InlineViewSection;
  onInlineViewChange: (view: InlineViewSection) => void;
  config?: SidebarConfig;
}

export default function SidebarOpen({ 
  onClose, 
  navigationItems,
  onNavigate, 
  isOpen,
  lastSelectedInlineView,
  onInlineViewChange,
  config = {}
}: SidebarOpenProps) {
  const [activeInlineView, setActiveInlineView] = useState<InlineViewSection>(lastSelectedInlineView);
  const [selectedNavigationItem, setSelectedNavigationItem] = useState<string>(navigationItems[0]?.id || '');
  
  const { 
    hasAdminRole,
    isLoadingRoles,
    isLoadingTenants 
  } = useUser();

  const getInlineViewItems = () => {
    const items = [];
    
    // Add settings if enabled
    if (config.sections?.settings?.enabled) {
      items.push({ id: 'user' as const, label: 'Settings', icon: CogIcon });
    }
    
    // Add users if enabled
    if (config.sections?.users?.enabled) {
      items.push({ id: 'users' as const, label: 'Users', icon: UsersIcon });
    }
    
    // Add admin if enabled and user has admin role
    if (config.sections?.admin?.enabled && hasAdminRole) {
      items.push({ id: 'admin' as const, label: 'Admin', icon: ShieldCheckIcon });
    }
    
    return items;
  };

  // Reset active inline view to 'user' if user doesn't have admin role and is on admin section
  useEffect(() => {
    if (!hasAdminRole && activeInlineView === 'admin') {
      setActiveInlineView('user');
      onInlineViewChange('user');
    }
  }, [hasAdminRole, activeInlineView, onInlineViewChange]);

  // Sync with lastSelectedInlineView prop
  useEffect(() => {
    setActiveInlineView(lastSelectedInlineView);
  }, [lastSelectedInlineView]);

  // Prevent body scroll when sidebar is open (especially important on mobile)
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle Escape key to close sidebar
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleNavigationItemClick = (itemId: string) => {
    setSelectedNavigationItem(itemId);
    onNavigate(itemId);
  };

  const handleInlineViewClick = (viewId: InlineViewSection) => {
    setActiveInlineView(viewId);
    onInlineViewChange(viewId);
  };

  const renderInlineViewContent = () => {
    switch (activeInlineView) {
      case 'user':
        return config.sections?.settings?.enabled ? 
          <SettingsSection config={config.sections.settings.items as SettingsConfig} /> : null;
      case 'users':
        return config.sections?.users?.enabled ? 
          <UsersSection config={config.sections.users.items as UsersConfig} /> : null;
      case 'admin':
        return config.sections?.admin?.enabled ? 
          <AdminSection config={config.sections.admin.items as AdminConfig} /> : null;
      default:
        return config.sections?.settings?.enabled ? 
          <SettingsSection config={config.sections.settings.items as SettingsConfig} /> : null;
    }
  };


  const renderNavigationButton = (item: PageNavigationItem) => (
    <button
      key={item.id}
      onClick={() => handleNavigationItemClick(item.id)}
      className="w-full flex items-center space-x-3 sm:space-x-4 px-4 py-3.5 text-left rounded-xl transition-all duration-300 group text-gray-300 hover:bg-white/10 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-900/25 border border-transparent hover:border-white/10"
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 bg-gradient-to-br from-gray-800 to-gray-700 group-hover:from-purple-500/20 group-hover:to-violet-600/20 group-hover:scale-110 shadow-lg">
        <item.icon className="w-5 h-5 transition-all duration-300 text-gray-400 group-hover:text-purple-400" />
      </div>
      <span className="text-sm sm:text-base font-medium transition-all duration-300 text-gray-100 group-hover:text-white">
        {item.label}
      </span>
    </button>
  );

  const renderInlineViewButton = (item: { id: InlineViewSection; label: string; icon: any }) => {
    const isActive = activeInlineView === item.id;
    
    return (
      <button
        key={item.id}
        onClick={() => handleInlineViewClick(item.id as InlineViewSection)}
        className={`relative w-full flex items-center space-x-3 sm:space-x-4 px-4 py-3.5 text-left rounded-xl transition-all duration-300 group overflow-hidden ${
          isActive
            ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-xl shadow-gray-900/25 border border-white/20'
            : 'text-gray-300 hover:bg-white/10 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-900/25 border border-transparent hover:border-white/10'
        }`}
      >
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 shadow-lg ${
          isActive
            ? 'bg-white/20 scale-110'
            : 'bg-gradient-to-br from-gray-800 to-gray-700 group-hover:from-purple-500/20 group-hover:to-violet-600/20 group-hover:scale-110'
        }`}>
          <item.icon className={`w-5 h-5 transition-all duration-300 ${
            isActive
              ? 'text-white'
              : 'text-gray-400 group-hover:text-purple-400'
          }`} />
        </div>
        <span className={`text-sm sm:text-base font-medium transition-all duration-300 ${
          isActive
            ? 'text-white'
            : 'text-gray-100 group-hover:text-white'
        }`}>
          {item.label}
        </span>
        
        {/* Subtle background pattern for active state */}
        {isActive && (
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mb-8 opacity-50"></div>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full w-full min-w-0 bg-gradient-to-br from-gray-900 via-gray-900/95 to-gray-900">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-700/50 bg-white/5 backdrop-blur-sm">
        {/* Top row - Logo and Close Button */}
        <div className="flex items-center justify-between">
          {/* Logo - consistent size */}
          <div className="flex items-center flex-shrink-0">
            <img 
              src="/logo_dark.svg" 
              alt="Wristband" 
              className="h-6 sm:h-8 w-auto flex-shrink-0 transition-transform duration-300 hover:scale-105"
            />
          </div>
          
          {/* Close Button - always visible and protected */}
          <button
            onClick={onClose}
            className="group p-2 sm:p-2.5 rounded-xl hover:bg-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gray-900/25 flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center ml-4"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-white group-hover:scale-110 transition-all duration-300" />
          </button>
        </div>
        
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Navigation */}
        <nav className="p-6 border-b border-gray-700/30">
          {/* Navigation Items */}
          <div className="space-y-2 mb-6">
            {navigationItems.map((item) => renderNavigationButton(item))}
          </div>

          {/* Separator */}
          <div className="my-6">
            <div className="w-full border-t border-gray-700/50"></div>
          </div>

          {/* Inline View Items */}
          <div className="space-y-2">
            {getInlineViewItems().map((item) => renderInlineViewButton(item))}
          </div>
        </nav>

        {/* Inline View Content */}
        <div className="transform transition-all duration-500 ease-out">
          {renderInlineViewContent()}
        </div>
      </div>
    </div>
  );
}