import type { Config } from "tailwindcss";
import { getTailwindColors } from "./src/utils/theme";

const themeColors = getTailwindColors();

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        xs: "400px",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Add theme colors
        primary: themeColors.primary,
        secondary: themeColors.secondary,
        accent: themeColors.accent,
        success: themeColors.success,
        warning: themeColors.warning,
        error: themeColors.error,
        info: themeColors.info,
      },
    },
  },
  plugins: [],
} satisfies Config;
