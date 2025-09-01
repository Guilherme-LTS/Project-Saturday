import { useMemo } from 'react';

const useTheme = (darkMode: boolean) => {
  const themeColors = useMemo(() => {
    if (darkMode) {
      return {
        background: '#0D1117',
        textBlack: '#000000',
        text: '#FFFFFF',
        card: '#3971AA',
        cardInactive: '#2F608D',
        border: '#40807E',
        placeholder: '#B0C4DE',
        navBackground: '#000000',
        navBtnText: '#fff',
      };
    } else {
      return {
        background: '#f5f6fa',
        text: '#1b3534ff',
        card: '#FFFFFF',
        cardInactive: '#f0f0f0',
        border: '#D3D3D3',
        placeholder: '#888',
        navBackground: '#fff',
        navBtnText: '#555',
      };
    }
  }, [darkMode]);

  const commonColors = {
    primary: '#0080FF',
    primaryText: '#fff',
    accentCyan: '#00FFF8',
    accentYellow: '#FFD300',
    accentOrange: '#FFA000',
    accentGreen: '#4CAF50',
    accentGreenSelected: '#388E3C',
    accentRed: '#FF6961',
    danger: 'red',
    inputArea: '#2c3e50'
  };

  return { ...themeColors, ...commonColors };
};

export default useTheme;