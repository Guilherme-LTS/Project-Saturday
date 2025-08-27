import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Platform, StyleSheet, TouchableNativeFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import IconEdit from '../assets/icons/edit.svg';
import IconList from '../assets/icons/history.svg';
import IconUsers from '../assets/icons/players.svg';
import IconSettings from '../assets/icons/settings.svg';
import IconShuffle from '../assets/icons/shuffle.svg';

import useTheme from '../hooks/useTheme';
import { useThemeStore } from '../stores/themeStore';

const iconComponents = {
  Edit: IconEdit,
  Draw: IconShuffle,
  History: IconList,
  Players: IconUsers,
  Settings: IconSettings,
};

interface CustomTabBarProps extends BottomTabBarProps {}

export default function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  const darkMode = useThemeStore((state) => state.darkMode);
  const theme = useTheme(darkMode);
  const insets = useSafeAreaInsets();

  const rippleConfig = {
    // Customize ripple color - using your theme's primary color with transparency
    color: darkMode ? 'rgba(25, 49, 72, 0.2)' : 'rgba(25, 49, 72, 0.3)',
    // Control ripple bounds
    borderless: true, // Set to true for unbounded ripple
    // Radius control (optional)
    radius: 22, // Adjust this value to control ripple size
  };

  return (
    <View style={[
      styles.tabBar,
      {
        backgroundColor: darkMode ? '#000' : '#fff',
        borderTopColor: darkMode ? '#333' : '#eee',
        height: 55 + insets.bottom,
        paddingBottom: insets.bottom,
      }
    ]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const IconComponent = iconComponents[route.name as keyof typeof iconComponents];
        const iconColor = isFocused ? '#0a84ff' : (darkMode ? '#c5c5c5ff' : '#2b2b2bff');

        // For Android, use TouchableNativeFeedback with custom ripple
        if (Platform.OS === 'android') {
          return (
            <TouchableNativeFeedback
              key={route.key}
              onPress={onPress}
              background={TouchableNativeFeedback.Ripple(
                rippleConfig.color,
                rippleConfig.borderless,
                rippleConfig.radius
              )}
            >
              <View style={styles.tabItem}>
                <IconComponent stroke={iconColor} width={26} height={26} />
              </View>
            </TouchableNativeFeedback>
          );
        }

        // Fallback for other platforms
        return (
          <TouchableNativeFeedback key={route.key} onPress={onPress}>
            <View style={styles.tabItem}>
              <IconComponent stroke={iconColor} width={26} height={26} />
            </View>
          </TouchableNativeFeedback>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minHeight: 45,
  },
});