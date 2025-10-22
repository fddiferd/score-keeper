import React from 'react';
import { UsersIcon, CogIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import type { InlineViewSection } from './SidebarOpen';
import type { SidebarConfig, PageNavigationItem } from './types';
import { useUser } from '@/contexts/UserContext';
import { theme } from '@/utils/theme';

interface SidebarClosedProps {
  onOpen: () => void;
  navigationItems: PageNavigationItem[];
  onNavigate: (itemId: string) => void;
  onInlineViewChange: (view: InlineViewSection) => void;
  config?: SidebarConfig;
  currentPage?: string;
}

export default function SidebarClosed({ 
  onOpen, 
  navigationItems,
  onNavigate, 
  onInlineViewChange,
  config = {},
  currentPage
}: SidebarClosedProps) {
  const { hasAdminRole, isLoadingRoles } = useUser();

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

  // Collapsed sidebar icon for navigation items
  const renderCollapsedNavigationIcon = (item: PageNavigationItem) => {
    const isSelected = currentPage === item.id;
    
    return (
      <button
        key={item.id}
        onClick={() => {
          // Always navigate to the page directly
          onNavigate(item.id);
        }}
        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-300 mb-2 group active:scale-95 hover:-translate-y-0.5 hover:shadow-lg ${
          isSelected 
            ? 'bg-white/20 shadow-lg' 
            : 'hover:bg-white/15'
        }`}
        title={item.label}
      >
        <item.icon className={`w-5 h-5 transition-all duration-300 group-hover:scale-110 ${
          isSelected 
            ? 'text-white' 
            : 'text-white/70 group-hover:text-white'
        }`} />
      </button>
    );
  };

  // Collapsed sidebar icon for inline view items
  const renderCollapsedInlineViewIcon = (item: { id: InlineViewSection; label: string; icon: any }) => (
    <button
      key={item.id}
      onClick={() => {
        onInlineViewChange(item.id as InlineViewSection);
        onOpen();
      }}
      className="w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-300 mb-2 group hover:bg-white/15 hover:-translate-y-0.5 hover:shadow-lg"
      title={item.label}
    >
      <item.icon className="w-5 h-5 transition-all duration-300 text-white/70 group-hover:text-white group-hover:scale-110" />
    </button>
  );

  return (
    <div 
      className="w-16 h-screen flex-shrink-0 fixed top-0 left-0 z-10"
      style={{ 
        backgroundColor: theme.colors.primary,
        color: 'white'
      }}
    >
      <div className="flex flex-col items-center py-4 h-full">
        {/* Brand Icon */}
        <div className="mb-6 cursor-pointer group" onClick={onOpen}>
          <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100/10 backdrop-blur-sm border border-gray-600/30 shadow-sm transition-all duration-300 hover:bg-gray-100/20 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5">
            <img 
              src="/icon.svg" 
              alt="Wristband" 
              className="w-6 h-6 transition-transform duration-300 group-hover:scale-110"
            />
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col items-center mb-4">
          {navigationItems.map((item) => renderCollapsedNavigationIcon(item))}
        </div>

        {/* Separator */}
        <div className="w-8 h-px bg-white/20 mb-4"></div>

        {/* Inline View Items */}
        <div className="flex flex-col items-center">
          {getInlineViewItems().map((item) => renderCollapsedInlineViewIcon(item))}
        </div>
      </div>
    </div>
  );
}