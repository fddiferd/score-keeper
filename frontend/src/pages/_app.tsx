/**
 * _app.tsx - Global App Wrapper
 * 
 * This is Next.js's special _app file that wraps ALL pages in the application.
 * It only mounts once and persists across page navigations, making it perfect for:
 * - Global providers (Auth, Theme, User context)
 * - Persistent layouts (Sidebar, Header)
 * - Global styles and configurations
 * 
 * Flow:
 * 1. Wraps all pages with authentication, theme, and user providers
 * 2. For authenticated routes (/home, /semanticlayers, etc.):
 *    - Wraps page with AuthenticatedLayout (sidebar + header)
 * 3. For the root route (/):
 *    - Renders page directly (no layout wrapper)
 * 
 * Benefits:
 * - No re-mounting on navigation = no loading flashes
 * - Shared state persists across pages
 * - Layout components only initialize once
 */

import type { AppProps } from "next/app";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { WristbandAuthProvider } from "@wristband/react-client-auth";
import { injectTheme } from "@/utils/theme";
import { UserProvider } from "@/contexts/UserContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { geistMono, geistSans } from "@/utils/fonts";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import { navigationItems, sidebarConfig, getPageIdFromPathname, isAuthenticatedRoute } from "@/config/navigation";

import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  useEffect(() => {
    // Inject theme CSS variables on mount
    injectTheme();
  }, []);

  return (
    /* WRISTBAND_TOUCHPOINT - AUTHENTICATION */
    <WristbandAuthProvider
      loginUrl={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:6001'}/api/auth/login`}
      sessionUrl="/api/auth/session" // Use proxy for session calls to share cookies
      disableRedirectOnUnauthenticated={true} // Prevents automatic redirects when not authenticated
    >
      {/* Theme provider manages dark/light mode and theme customization */}
      <ThemeProvider>
        {/* User provider manages current user, tenant, and roles data */}
        <UserProvider>
          {/* Conditionally wrap with AuthenticatedLayout based on route */}
          {isAuthenticatedRoute(router.pathname) ? (
            // Authenticated routes get the full layout (sidebar + header)
            <div className={`${geistSans.variable} ${geistMono.variable} font-[family-name:var(--font-geist-sans)]`}>
              <AuthenticatedLayout
                currentPage={getPageIdFromPathname(router.pathname)}
                navigationItems={navigationItems}
                sidebarConfig={sidebarConfig}
              >
                <Component {...pageProps} />
              </AuthenticatedLayout>
            </div>
          ) : (
            // Root route (/) renders without layout wrapper
            <Component {...pageProps} />
          )}
        </UserProvider>
      </ThemeProvider>
    </WristbandAuthProvider>
  )
}
