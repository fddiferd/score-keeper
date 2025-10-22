// Navigation item type that includes the page route
export interface PageNavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  route: string;
  requiresAdmin?: boolean;
}

// Helper function to create a navigation item with page route
export const createNavItem = (
  id: string, 
  label: string, 
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>, 
  route: string,
  requiresAdmin: boolean = false
): PageNavigationItem => ({
  id,
  label,
  icon,
  route,
  requiresAdmin
});

// Individual sidebar item configurations
export interface SidebarItemConfig {
  enabled: boolean;
}

// Settings section items
export interface SettingsConfig {
  profileInfo?: SidebarItemConfig;
  changePassword?: SidebarItemConfig;
  theme?: SidebarItemConfig;
  tenantSwitcher?: SidebarItemConfig;
  wristbandSession?: SidebarItemConfig;
  signOut?: SidebarItemConfig;
}

// Admin section items  
export interface AdminConfig {
  organizationInfo?: SidebarItemConfig;
  googleSSOIDP?: SidebarItemConfig;
  oktaSSOIDP?: SidebarItemConfig;
}

// Users section items
export interface UsersConfig {
  users?: SidebarItemConfig;
}

// Section-level configuration
export interface SidebarSectionConfig {
  enabled: boolean;
  items?: SettingsConfig | AdminConfig | UsersConfig;
}

// Main sidebar configuration
export interface SidebarConfig {
  // Navigation items (pages)
  navigationItems?: PageNavigationItem[];
  
  // Sidebar sections
  sections?: {
    settings?: SidebarSectionConfig;
    admin?: SidebarSectionConfig;
    users?: SidebarSectionConfig;
  };
}
