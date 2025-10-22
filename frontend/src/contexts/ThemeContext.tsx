import React, { createContext, useContext, useState, useEffect } from 'react';
import { injectTheme } from '@/utils/theme';
import frontendApiClient from '@/client/frontend-api-client';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  loadThemeFromAPI: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('dark');
  const [isInitialized, setIsInitialized] = useState(false);

  // Get system preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // Calculate effective theme based on current theme setting
  const calculateEffectiveTheme = (currentTheme: Theme): 'light' | 'dark' => {
    if (currentTheme === 'system') {
      return getSystemTheme();
    }
    return currentTheme;
  };

  // Update theme and apply to document
  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    
    // Save to backend API (or localStorage if database unavailable)
    try {
      await frontendApiClient.patch('/user/theme', { theme: newTheme });
      // If successful, remove from localStorage (database is the source of truth)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('theme_preference');
      }
    } catch (error: any) {
      // If database is unavailable (503), fall back to localStorage
      if (error?.response?.status === 503) {
        console.log('Database unavailable, saving theme to localStorage');
        if (typeof window !== 'undefined') {
          localStorage.setItem('theme_preference', newTheme);
        }
      } else {
        console.error('Failed to save theme preference:', error);
      }
    }
    
    const effective = calculateEffectiveTheme(newTheme);
    setEffectiveTheme(effective);
    
    // Apply to document
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      if (effective === 'dark') {
        root.classList.add('dark');
        root.style.setProperty('--background', '#0a0a0a');
        root.style.setProperty('--foreground', '#ededed');
      } else {
        root.classList.remove('dark');
        root.style.setProperty('--background', '#ffffff');
        root.style.setProperty('--foreground', '#171717');
      }
      // Inject theme colors
      injectTheme();
    }
  };

  // Toggle between light and dark (ignoring system)
  const toggleTheme = () => {
    const newTheme = effectiveTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Load user's theme from API (called from AuthenticatedLayout)
  const loadThemeFromAPI = async () => {
    try {
      const response = await frontendApiClient.get('/user/theme');
      const userTheme = response.data.theme as Theme;
      
      const effective = calculateEffectiveTheme(userTheme);
      
      setThemeState(userTheme);
      setEffectiveTheme(effective);
      
      // Apply theme to document
      if (typeof window !== 'undefined') {
        const root = document.documentElement;
        if (effective === 'dark') {
          root.classList.add('dark');
          root.style.setProperty('--background', '#0a0a0a');
          root.style.setProperty('--foreground', '#ededed');
        } else {
          root.classList.remove('dark');
          root.style.setProperty('--background', '#ffffff');
          root.style.setProperty('--foreground', '#171717');
        }
        // Inject theme colors
        injectTheme();
      }
    } catch (error: any) {
      // If database is unavailable (503), fall back to localStorage
      if (error?.response?.status === 503) {
        console.log('Database unavailable, loading theme from localStorage');
        if (typeof window !== 'undefined') {
          const savedTheme = localStorage.getItem('theme_preference') as Theme | null;
          const userTheme = savedTheme || 'dark';
          const effective = calculateEffectiveTheme(userTheme);
          
          setThemeState(userTheme);
          setEffectiveTheme(effective);
          
          // Apply theme to document
          const root = document.documentElement;
          if (effective === 'dark') {
            root.classList.add('dark');
            root.style.setProperty('--background', '#0a0a0a');
            root.style.setProperty('--foreground', '#ededed');
          } else {
            root.classList.remove('dark');
            root.style.setProperty('--background', '#ffffff');
            root.style.setProperty('--foreground', '#171717');
          }
          injectTheme();
        }
      } else {
        console.error('Failed to load theme from API:', error);
        // Use default theme if API fails
        const defaultTheme: Theme = 'dark';
        const effective = calculateEffectiveTheme(defaultTheme);
        setThemeState(defaultTheme);
        setEffectiveTheme(effective);
      }
    }
  };

  // Initialize with default theme for unauthenticated users
  useEffect(() => {
    const defaultTheme: Theme = 'dark';
    const effective = calculateEffectiveTheme(defaultTheme);
    
    setThemeState(defaultTheme);
    setEffectiveTheme(effective);
    
    // Apply default theme
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      if (effective === 'dark') {
        root.classList.add('dark');
        root.style.setProperty('--background', '#0a0a0a');
        root.style.setProperty('--foreground', '#ededed');
      } else {
        root.classList.remove('dark');
        root.style.setProperty('--background', '#ffffff');
        root.style.setProperty('--foreground', '#171717');
      }
      // Inject theme colors
      injectTheme();
    }
  }, []);

  // Listen for system theme changes when using system theme
  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      const systemTheme = mediaQuery.matches ? 'dark' : 'light';
      setEffectiveTheme(systemTheme);
      
      const root = document.documentElement;
      if (systemTheme === 'dark') {
        root.classList.add('dark');
        root.style.setProperty('--background', '#0a0a0a');
        root.style.setProperty('--foreground', '#ededed');
      } else {
        root.classList.remove('dark');
        root.style.setProperty('--background', '#ffffff');
        root.style.setProperty('--foreground', '#171717');
      }
      // Inject theme colors
      injectTheme();
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        effectiveTheme,
        setTheme,
        toggleTheme,
        loadThemeFromAPI,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
