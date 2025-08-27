import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  Platform,
  StyleSheet,
  TouchableNativeFeedback,
  View
} from 'react-native';
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

// Export the tab bar height so other components can use it
export const TAB_BAR_HEIGHT = 55;

export default function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  const darkMode = useThemeStore((state) => state.darkMode);
  const theme = useTheme(darkMode);
  const insets = useSafeAreaInsets();
  
  // Animated value for keyboard handling
  const keyboardHeight = useRef(new Animated.Value(0)).current;
  const { height: screenHeight } = Dimensions.get('window');

  const rippleConfig = {
    color: darkMode ? 'rgba(25, 49, 72, 0.2)' : 'rgba(25, 49, 72, 0.3)',
    borderless: true,
    radius: 22,
  };

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      // Animate the tab bar up with the keyboard
      Animated.timing(keyboardHeight, {
        toValue: event.endCoordinates.height,
        duration: event.duration || 250, // Use the keyboard's animation duration
        useNativeDriver: false, // We're animating layout properties
      }).start();
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', (event) => {
      // Animate the tab bar back down
      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: event.duration || 250,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [keyboardHeight]);

  // Calculate the animated bottom position
  const animatedStyle = {
    transform: [
      {
        translateY: Animated.multiply(keyboardHeight, -1), // Move up by keyboard height
      },
    ],
  };

  return (
    <Animated.View style={[
      styles.tabBar,
      {
        backgroundColor: darkMode ? '#000' : '#fff',
        borderTopColor: darkMode ? '#333' : '#eee',
        height: TAB_BAR_HEIGHT + insets.bottom,
        paddingBottom: insets.bottom,
      },
      animatedStyle, // Apply the keyboard animation
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
        
        // Apply visual centering offset for specific icons that have asymmetrical content
        const iconStyle = route.name === 'History' ? { marginLeft: 1 } : {};

        // For Android, use TouchableNativeFeedback with custom ripple
        if (Platform.OS === 'android') {
          return (
            <View key={route.key} style={styles.tabItem}>
              <TouchableNativeFeedback
                onPress={onPress}
                background={TouchableNativeFeedback.Ripple(
                  rippleConfig.color,
                  rippleConfig.borderless,
                  rippleConfig.radius
                )}
              >
                <View style={styles.touchableArea}>
                  <View style={[styles.iconContainer, iconStyle]}>
                    <IconComponent stroke={iconColor} width={26} height={26} />
                  </View>
                </View>
              </TouchableNativeFeedback>
            </View>
          );
        }

        // Fallback for other platforms
        return (
          <View key={route.key} style={styles.tabItem}>
            <TouchableNativeFeedback onPress={onPress}>
              <View style={styles.touchableArea}>
                <View style={[styles.iconContainer, iconStyle]}>
                  <IconComponent stroke={iconColor} width={24} height={24} />
                </View>
              </View>
            </TouchableNativeFeedback>
          </View>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute', // Change to absolute positioning
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchableArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minHeight: 45,
    minWidth: '100%',
  },
  iconContainer: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});