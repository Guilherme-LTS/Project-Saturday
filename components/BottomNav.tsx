import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Screen } from '../types';

import IconEdit from '../assets/icons/edit.svg';
import IconList from '../assets/icons/history.svg';
import IconUsers from '../assets/icons/players.svg';
import IconSettings from '../assets/icons/settings.svg';
import IconShuffle from '../assets/icons/shuffle.svg';

// 1. Definindo as props que o componente receberá
interface BottomNavProps {
  activeScreen: Screen;
  onScreenChange: (screen: Screen) => void;
  darkMode: boolean;
  bottomInset: number;
}

// 2. O NavButton agora recebe um IconComponent em vez de 'title'
const NavButton = ({
  IconComponent,
  screenName,
  isActive,
  onPress,
  activeColor,
  inactiveColor,
}: {
  IconComponent: React.FC<any>;
  screenName: Screen;
  isActive: boolean;
  onPress: (screen: Screen) => void;
  activeColor: string;
  inactiveColor: string;
}) => (
  <TouchableOpacity style={styles.navBtn} onPress={() => onPress(screenName)}>
    {/* 3. O ícone é renderizado aqui, e a cor é passada como prop */}
    <IconComponent 
      stroke={isActive ? activeColor : inactiveColor} 
      width={26} 
      height={26} 
    />
  </TouchableOpacity>
);

const Separator = () => <View style={styles.separator} />;

const BottomNav: React.FC<BottomNavProps> = ({ activeScreen, onScreenChange, darkMode, bottomInset }) => {
  const activeColor = '#0a84ff';
  const inactiveColor = darkMode ? '#c5c5c5ff' : '#2b2b2bff';

  return (
    <View
      style={[
        styles.bottomNav,
        {
          backgroundColor: darkMode ? '#000' : '#fff', // Corrigido para preto
          borderColor: darkMode ? '#333' : '#eee',
          paddingBottom: 8 + bottomInset,
        },
      ]}
    >
      <NavButton
        IconComponent={IconEdit}
        screenName="edit"
        isActive={activeScreen === 'edit'}
        onPress={onScreenChange}
        activeColor={activeColor}
        inactiveColor={inactiveColor}
      />

      <NavButton
        IconComponent={IconShuffle}
        screenName="draw"
        isActive={activeScreen === 'draw'}
        onPress={onScreenChange}
        activeColor={activeColor}
        inactiveColor={inactiveColor}
      />
      <NavButton
        IconComponent={IconList}
        screenName="history"
        isActive={activeScreen === 'history'}
        onPress={onScreenChange}
        activeColor={activeColor}
        inactiveColor={inactiveColor}
      />
      <NavButton
        IconComponent={IconUsers}
        screenName="players"
        isActive={activeScreen === 'players'}
        onPress={onScreenChange}
        activeColor={activeColor}
        inactiveColor={inactiveColor}
      />
      <NavButton
        IconComponent={IconSettings}
        screenName="settings"
        isActive={activeScreen === 'settings'}
        onPress={onScreenChange}
        activeColor={activeColor}
        inactiveColor={inactiveColor}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 2,
    paddingBottom: 52,
    justifyContent: 'space-around',
  },
  navBtn: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
  },
  separator: {
    width: 1,
    height: '60%',
    backgroundColor: '#333',
    alignSelf: 'center',
  },
});

export default BottomNav;