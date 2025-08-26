// hooks/useTheme.ts (versão com a nova paleta de cores)

import { useMemo } from 'react';

const useTheme = (darkMode: boolean) => {
  // Cores que mudam com o tema
  const themeColors = useMemo(() => {
    if (darkMode) {
      // Cores do Tema Escuro
      return {
        background: '#0D1117',      // Fundo escuro padrão
        textBlack: '#000000',
        text: '#FFFFFF',            // Texto branco
        card: '#3971AA',            // Azul acinzentado para os cards
        cardInactive: '#2F608D',    // Um tom um pouco mais escuro do card
        border: '#40807E',          // Verde-azulado escuro para bordas
        placeholder: '#B0C4DE',      // Um placeholder azulado claro
        navBackground: '#000000',
        navBtnText: '#fff',
      };
    } else {
      // Cores do Tema Claro
      return {
        background: '#f5f6fa',      // Fundo claro padrão
        text: '#1b3534ff',            // Verde-azulado escuro para texto principal
        card: '#FFFFFF',            // Cards brancos
        cardInactive: '#f0f0f0',
        border: '#D3D3D3',          // Borda cinza clara
        placeholder: '#888',
        navBackground: '#fff',
        navBtnText: '#555',
      };
    }
  }, [darkMode]); // Otimização: só recalcula as cores se `darkMode` mudar

  // Cores que são constantes, independentemente do tema
  const commonColors = {
    // --- CORES DA NOVA PALETA ---
    primary: '#0080FF',        // Azul principal para botões e interações
    primaryText: '#fff',
    accentCyan: '#00FFF8',
    accentYellow: '#FFD300',
    accentOrange: '#FFA000',

    // --- CORES MANTIDAS (SEU PEDIDO) ---
    accentGreen: '#4CAF50',        // Verde para o botão "Finalizar Partida"
    accentGreenSelected: '#388E3C',
    danger: 'red',
  };

  return { ...themeColors, ...commonColors };
};

export default useTheme;