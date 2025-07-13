'use client';

// Simplified theme store - always light mode
interface ThemeStore {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

const useThemeStore = (): ThemeStore => ({
  isDarkMode: false,
  toggleTheme: () => {
    // No-op: always light mode
  },
  setTheme: (isDark: boolean) => {
    // No-op: always light mode
  },
});

export default useThemeStore;
