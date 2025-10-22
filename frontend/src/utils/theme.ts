// Improved Theme System for FastAPI Accelerator
// 
// Usage:
// 1. Customize colors by editing the userTheme object below
// 2. Use Tailwind classes in components: bg-primary, text-primary-light, border-accent, etc.
// 3. For dynamic colors, use CSS variables: var(--theme-primary)
// 
// Available Tailwind classes:
// - Colors: primary, primary-light, primary-dark, secondary, secondary-light, secondary-dark
// - Accent: accent, accent-light, accent-dark
// - Semantic: success, warning, error, info
// - Utilities: btn-primary, btn-secondary, btn-accent, alert-success, alert-error, etc.

// MARK: - Theme Configuration

// 1. Define the customizable theme configuration
export interface CustomTheme {
  // Primary brand colors
  primary: string;
  primaryLight?: string;  // Optional - will be auto-generated if not provided
  primaryDark?: string;   // Optional - will be auto-generated if not provided
  
  // Secondary brand colors (optional)
  secondary?: string;     // Optional - defaults to a complementary color
  secondaryLight?: string; // Optional - will be auto-generated if not provided
  secondaryDark?: string;  // Optional - will be auto-generated if not provided
  
  // Optional accent color
  accent?: string;
  
  // Optional semantic colors (will use defaults if not provided)
  success?: string;
  warning?: string;
  error?: string;
  info?: string;
}

// MARK: - User Theme Settings

// 2. User's custom theme - EDIT THIS TO CUSTOMIZE YOUR THEME
export const userTheme: CustomTheme = {
  primary: '#7C3AED', 
  // #00AA81 - wristband green
  // #2563eb - blue  
  // #1e3a8a - navy blue
  // #a7589d - purple

  // Optional overrides (uncomment to customize):
  // primaryLight: '#33BBAA',  // Auto-generated if not provided
  // primaryDark: '#006655',   // Auto-generated if not provided
  // secondary: '#6366f1',     // A complementary secondary color
  // secondaryLight: '#818cf8', // Auto-generated if not provided
  // secondaryDark: '#4f46e5', // Auto-generated if not provided
  // accent: '#00AA81',        // Defaults to primary if not provided
  // success: '#10b981',       // Green
  // warning: '#f59e0b',       // Yellow
  // error: '#ef4444',         // Red
  // info: '#3b82f6',          // Blue
};

// MARK: - Color Utilities

// 3. Color manipulation utilities
class ColorUtils {
  static hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  static rgbToHex(r: number, g: number, b: number): string {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  static lighten(hex: string, percent: number): string {
    const { r, g, b } = this.hexToRgb(hex);
    const amount = Math.round(255 * (percent / 100));
    return this.rgbToHex(
      Math.min(255, r + amount),
      Math.min(255, g + amount),
      Math.min(255, b + amount)
    );
  }

  static darken(hex: string, percent: number): string {
    const { r, g, b } = this.hexToRgb(hex);
    const amount = Math.round(255 * (percent / 100));
    return this.rgbToHex(
      Math.max(0, r - amount),
      Math.max(0, g - amount),
      Math.max(0, b - amount)
    );
  }

  static toRgbString(hex: string): string {
    const { r, g, b } = this.hexToRgb(hex);
    return `${r}, ${g}, ${b}`;
  }
}

// Helper function to generate a complementary color
function generateComplementaryColor(hex: string): string {
  const { r, g, b } = ColorUtils.hexToRgb(hex);
  
  // Convert to HSL to find complementary color
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  
  let h = 0;
  let s = 0;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r / 255:
        h = ((g / 255 - b / 255) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g / 255:
        h = ((b / 255 - r / 255) / d + 2) / 6;
        break;
      case b / 255:
        h = ((r / 255 - g / 255) / d + 4) / 6;
        break;
    }
  }
  
  // Shift hue by 180 degrees for complementary color
  h = (h + 0.5) % 1;
  
  // Convert back to RGB
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  
  const compR = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const compG = Math.round(hue2rgb(p, q, h) * 255);
  const compB = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
  
  return ColorUtils.rgbToHex(compR, compG, compB);
}

// MARK: - Theme Types

// 4. Generate complete theme with all variations
export interface Theme {
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    primaryRgb: string;
    
    secondary: string;
    secondaryLight: string;
    secondaryDark: string;
    secondaryRgb: string;
    
    accent: string;
    accentLight: string;
    accentDark: string;
    accentRgb: string;
    
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // Neutral colors for consistency
    background: string;
    surface: string;
    border: string;
    text: string;
    textMuted: string;
  };
  
  // CSS variable names for runtime injection
  cssVars: Record<string, string>;
}

// MARK: - Theme Generator

// 5. Theme generator
export function generateTheme(custom: CustomTheme): Theme {
  const primary = custom.primary;
  const primaryLight = custom.primaryLight || ColorUtils.lighten(primary, 20);
  const primaryDark = custom.primaryDark || ColorUtils.darken(primary, 20);
  
  // Generate a complementary secondary color if not provided
  const secondary = custom.secondary || generateComplementaryColor(primary);
  const secondaryLight = custom.secondaryLight || ColorUtils.lighten(secondary, 20);
  const secondaryDark = custom.secondaryDark || ColorUtils.darken(secondary, 20);
  
  const accent = custom.accent || primary;
  const accentLight = ColorUtils.lighten(accent, 20);
  const accentDark = ColorUtils.darken(accent, 20);
  
  const colors = {
    primary,
    primaryLight,
    primaryDark,
    primaryRgb: ColorUtils.toRgbString(primary),
    
    secondary,
    secondaryLight,
    secondaryDark,
    secondaryRgb: ColorUtils.toRgbString(secondary),
    
    accent,
    accentLight,
    accentDark,
    accentRgb: ColorUtils.toRgbString(accent),
    
    success: custom.success || '#10b981',
    warning: custom.warning || '#f59e0b',
    error: custom.error || '#ef4444',
    info: custom.info || '#3b82f6',
    
    // Neutral colors that work with any theme
    background: 'var(--background)',
    surface: '#f9fafb',
    border: '#e5e7eb',
    text: '#111827',
    textMuted: '#6b7280',
  };
  
  // Generate CSS variables
  const cssVars: Record<string, string> = {};
  Object.entries(colors).forEach(([key, value]) => {
    const varName = `--theme-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    cssVars[varName] = value;
  });
  
  return { colors, cssVars };
}

// MARK: - Theme Instance

// 6. Current theme instance
export const theme = generateTheme(userTheme);

// MARK: - Utility Functions

// 7. Utility functions for theme access
export const colors = theme.colors;

// Get theme colors for use in JavaScript when needed
export const { primary, primaryLight, primaryDark, secondary, secondaryLight, secondaryDark, accent, success, warning, error, info } = theme.colors;

// MARK: - Tailwind Integration

// 8. Tailwind-compatible color palette generator
export function getTailwindColors() {
  return {
    primary: {
      DEFAULT: theme.colors.primary,
      light: theme.colors.primaryLight,
      dark: theme.colors.primaryDark,
    },
    secondary: {
      DEFAULT: theme.colors.secondary,
      light: theme.colors.secondaryLight,
      dark: theme.colors.secondaryDark,
    },
    accent: {
      DEFAULT: theme.colors.accent,
      light: theme.colors.accentLight,
      dark: theme.colors.accentDark,
    },
    success: theme.colors.success,
    warning: theme.colors.warning,
    error: theme.colors.error,
    info: theme.colors.info,
  };
}

// MARK: - React Hook

// 9. React hook for theme access (optional)
export function useTheme() {
  return theme;
}

// MARK: - Theme Injection

// 10. Theme injection function
export function injectTheme() {
  if (typeof window !== 'undefined') {
    const root = document.documentElement;
    Object.entries(theme.cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }
}

