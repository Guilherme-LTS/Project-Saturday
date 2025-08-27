import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { loadTheme, saveTheme } from '../utils/storage';

interface ThemeState {
  darkMode: boolean;
  setDarkMode: (isDark: boolean) => void;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>()(
  subscribeWithSelector((set) => ({
    darkMode: true,
    
    setDarkMode: (isDark) => set({ darkMode: isDark }),
    
    loadTheme: async () => {
      const isDark = await loadTheme();
      set({ darkMode: isDark });
    }
  }))
);

// Auto-save subscription
useThemeStore.subscribe(
  (state) => state.darkMode,
  (darkMode) => saveTheme(darkMode)
);