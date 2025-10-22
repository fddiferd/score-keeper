import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useWristbandSession, useWristbandAuth } from "@wristband/react-client-auth";
import { geistMono, geistSans } from "@/utils/fonts";
import frontendApiClient from "@/client/frontend-api-client";
import { useUser } from "@/contexts/UserContext";
import { useTheme } from "@/contexts/ThemeContext";
import Sidebar from "@/components/sidebar/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import DesktopHeader from "@/components/DesktopHeader";
import LoadingScreen from "@/components/LoadingScreen";
import UnauthenticatedView from "@/pages/UnauthenticatedView";
import type { PageNavigationItem, SidebarConfig } from '@/components/sidebar/types';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  navigationItems: PageNavigationItem[];
  sidebarConfig?: SidebarConfig;
}

export default function AuthenticatedLayout({ 
  children, 
  currentPage,
  navigationItems,
  sidebarConfig = {}
}: AuthenticatedLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useWristbandAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const { metadata } = useWristbandSession();
  const { loadThemeFromAPI } = useTheme();
  const { 
    setCurrentUser, 
    setIsLoadingUser,
    setCurrentTenant, 
    setTenantOptions, 
    setIsLoadingTenants, 
    setUserRoles, 
    setIsLoadingRoles,
    hasAdminRole, 
    isLoadingRoles
  } = useUser();

  // Initialize user data when layout mounts
  useEffect(() => {
    const fetchUserData = async () => {
      if (!metadata) return;

      try {
        setIsLoadingUser(true);
        setIsLoadingTenants(true);
        setIsLoadingRoles(true);
        
        // Fetch user data, tenant data, and roles in parallel
        const [userResponse, tenantResponse, optionsResponse, rolesResponse] = await Promise.all([
          frontendApiClient.get('/user/me'),
          frontendApiClient.get('/tenant/me'),
          frontendApiClient.get('/tenant/options'),
          frontendApiClient.get('/user/me/roles')
        ]);
        
        setCurrentUser(userResponse.data);
        setCurrentTenant(tenantResponse.data);
        setTenantOptions(optionsResponse.data);
        setUserRoles(rolesResponse.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoadingUser(false);
        setIsLoadingTenants(false);
        setIsLoadingRoles(false);
      }
    };

    fetchUserData();
  }, [metadata, setCurrentUser, setIsLoadingUser, setCurrentTenant, setTenantOptions, setIsLoadingTenants, setUserRoles, setIsLoadingRoles]);

  // Load theme separately - doesn't affect loading states
  useEffect(() => {
    const loadTheme = async () => {
      if (!metadata) return;
      
      try {
        await loadThemeFromAPI();
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };

    loadTheme();
  }, [metadata, loadThemeFromAPI]);

  const handleNavigate = (itemId: string) => {
    const navItem = navigationItems.find(item => item.id === itemId);
    if (navItem) {
      router.push(navItem.route);
    }
    setIsSidebarOpen(false);
  };

  // Filter navigation items based on admin role (simple filtering)
  const filteredNavigationItems = navigationItems.filter(item => {
    // If item doesn't require admin, always show it
    if (!item.requiresAdmin) {
      return true;
    }
    // If item requires admin, only show if user has admin role
    return hasAdminRole;
  });

  // Show loading state while checking authentication
  if (isAuthLoading) {
    return (
      <div className={`${geistSans.variable} ${geistMono.variable}`}>
        <LoadingScreen />
      </div>
    );
  }

  // Show UnauthenticatedView for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className={`${geistSans.variable} ${geistMono.variable} font-[family-name:var(--font-geist-sans)]`}>
        <UnauthenticatedView />
      </div>
    );
  }

  // Don't render authenticated content until roles are loaded
  if (isLoadingRoles) {
    return <LoadingScreen message="" />;
  }

  return (
    <div className="h-screen">
      {/* Mobile Layout */}
      <div className="sm:hidden h-full flex flex-col">
        <MobileHeader onOpenSidebar={() => setIsSidebarOpen(true)} />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
        
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
            onOpen={() => setIsSidebarOpen(true)}
            navigationItems={filteredNavigationItems}
            onNavigate={handleNavigate}
            config={sidebarConfig}
            currentPage={currentPage}
          />
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex h-screen">
        {/* Sidebar */}
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          onOpen={() => setIsSidebarOpen(true)}
          navigationItems={filteredNavigationItems}
          onNavigate={handleNavigate}
          config={sidebarConfig}
          currentPage={currentPage}
        />

        {/* Main Content */}
        <div className={`flex-1 flex flex-col ${!isSidebarOpen ? 'ml-16' : ''}`}>
          <div className="flex-1 overflow-y-auto">
            {/* Desktop Header - shows organization logo above content (scrolls with content) */}
            <DesktopHeader />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
