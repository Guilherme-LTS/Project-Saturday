import { useMemo } from 'react';

const useTheme = (darkMode: boolean) => {
  // Cores que mudam com o tema
  const themeColors = useMemo(() => {
    if (darkMode) {
      // Cores do Tema Escuro
      return {
        background: '#000000ff',
        text: '#fff',
        card: '#333',
        cardInactive: '#141414ff',
        border: '#555',
        placeholder: '#888',
        navBackground: '#222',
        navBtnText: '#fff',
      };
    } else {
      // Cores do Tema Claro
      return {
        background: '#f5f6fa',
        text: '#222',
        card: '#fff',
        cardInactive: '#f0f0f0',
        border: '#eee',
        placeholder: '#888',
        navBackground: '#fff',
        navBtnText: '#555',
      };
    }
  }, [darkMode]); // Otimização: só recalcula as cores se `darkMode` mudar

  // Cores que são constantes, independentemente do tema
  const commonColors = {
    primary: '#0a84ff',
    primaryText: '#fff',
    accentGreen: '#4CAF50',
    accentGreenSelected: '#388E3C',
    danger: 'red',
  };

  return { ...themeColors, ...commonColors };
};

export default useTheme;