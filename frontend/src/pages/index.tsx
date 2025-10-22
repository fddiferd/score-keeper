/**
 * index.tsx - Landing Page (Root Route: /)
 * 
 * This is the entry point when users visit the root URL (localhost:3001/).
 * It acts as a smart router based on authentication state:
 * 
 * Flow:
 * 1. Check if user is authenticated
 * 2. If authenticated → Redirect to /home
 * 3. If not authenticated → Show login/welcome screen (UnauthenticatedView)
 * 
 * Note: This page does NOT get wrapped with AuthenticatedLayout (see _app.tsx).
 * The auth check and redirect happen here, before the layout would be needed.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useWristbandAuth } from "@wristband/react-client-auth";
import { geistMono, geistSans } from "@/utils/fonts";
import UnauthenticatedView from "./UnauthenticatedView";
import LoadingScreen from "@/components/LoadingScreen";

export default function App() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useWristbandAuth();

  // Redirect authenticated users to /home
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/home');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
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

  // Show loading while redirecting
  return (
    <div className={`${geistSans.variable} ${geistMono.variable}`}>
      <LoadingScreen />
    </div>
  );
}