import { HomeIcon, KeyIcon } from '@heroicons/react/24/outline';
import { createNavItem } from '@/components/sidebar/types';
import type { PageNavigationItem, SidebarConfig } from '@/components/sidebar/types';

// Configure navigation items with their routes
export const navigationItems: PageNavigationItem[] = [
  createNavItem('home', 'Home', HomeIcon, '/home'),
  createNavItem('semanticLayers', 'Semantic Layers', KeyIcon, '/semanticlayers', true),
];

// Get page ID from pathname
export function getPageIdFromPathname(pathname: string): string {
  const navItem = navigationItems.find(item => item.route === pathname);
  return navItem?.id || 'home';
}

// Check if pathname requires authenticated layout
export function isAuthenticatedRoute(pathname: string): boolean {
  return pathname !== '/';
}

// Configure sidebar sections and items
export const sidebarConfig: SidebarConfig = {
  sections: {
    settings: {
      enabled: true,
      items: {
        tenantSwitcher: { enabled: true },
        profileInfo: { enabled: true },
        changePassword: { enabled: true },
        theme: { enabled: true },
        wristbandSession: { enabled: true },
        signOut: { enabled: true }
      }
    },
    users: {
      enabled: true,
      items: {
        users: { enabled: true }
      }
    },
    admin: {
      enabled: true,
      items: {
        organizationInfo: { enabled: true },
        googleSSOIDP: { enabled: true },
        oktaSSOIDP: { enabled: true }
      }
    }
  }
};

