import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Futuramente, moveremos este tipo para types/index.ts
export type Screen = 'edit' | 'draw' | 'settings';

// 1. Definindo as props que o componente receberá
interface BottomNavProps {
  activeScreen: Screen;
  onScreenChange: (screen: Screen) => void;
  darkMode: boolean;
}

// Um componente interno para evitar repetição de código
const NavButton = ({
  title,
  screenName,
  isActive,
  onPress,
  textStyle,
}: {
  title: string;
  screenName: Screen;
  isActive: boolean;
  onPress: (screen: Screen) => void;
  textStyle: object;
}) => (
  <TouchableOpacity
    style={[styles.navBtn]}
    onPress={() => onPress(screenName)}
  >
    <Text style={[styles.navBtnText, textStyle, isActive && styles.navBtnTextActive]}>
      {title}
    </Text>
  </TouchableOpacity>
);


const BottomNav: React.FC<BottomNavProps> = ({ activeScreen, onScreenChange, darkMode }) => {
  const navTextStyle = { color: darkMode ? '#fff' : '#555' };

  return (
    <View
      style={[
        styles.bottomNav,
        {
          backgroundColor: darkMode ? '#222' : '#fff',
          borderColor: darkMode ? '#555' : '#eee',
        },
      ]}
    >
      <NavButton
        title="Editar lista"
        screenName="edit"
        isActive={activeScreen === 'edit'}
        onPress={onScreenChange}
        textStyle={navTextStyle}
      />
      <NavButton
        title="Sortear"
        screenName="draw"
        isActive={activeScreen === 'draw'}
        onPress={onScreenChange}
        textStyle={navTextStyle}
      />
      <NavButton
        title="Configurações"
        screenName="settings"
        isActive={activeScreen === 'settings'}
        onPress={onScreenChange}
        textStyle={navTextStyle}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 4,
    paddingBottom: 52,
    justifyContent: 'space-around',
  },
  navBtn: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
  },
  navBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  navBtnTextActive: {
    color: '#0a84ff',
    fontWeight: 'bold' // A cor ativa sempre será a mesma
  },
});

export default BottomNav;