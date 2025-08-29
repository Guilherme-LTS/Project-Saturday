import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
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
  
  // State for keyboard visibility
  const [isKeyboardVisible, setIsKeyboardVisible] = React.useState(false);
  const keyboardHeight = useRef(new Animated.Value(0)).current;
  const tabBarOpacity = useRef(new Animated.Value(1)).current;

  const rippleConfig = {
    color: darkMode ? 'rgba(25, 49, 72, 0.2)' : 'rgba(25, 49, 72, 0.3)',
    borderless: true,
    radius: 22,
  };

  useEffect(() => {
    // Use platform-specific keyboard events for better sync
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShowListener = Keyboard.addListener(showEvent, (event) => {
      console.log('🔺 Keyboard showing, height:', event.endCoordinates.height);
      setIsKeyboardVisible(true);
      
      // Animate tab bar to hide and move up
      const animationDuration = event.duration && event.duration > 0 ? event.duration : 300;
      
      Animated.parallel([
        // Move the tab bar up by keyboard height
        Animated.timing(keyboardHeight, {
          toValue: event.endCoordinates.height,
          duration: animationDuration,
          useNativeDriver: false,
          easing: Easing.out(Easing.quad),
        }),
        // Fade out the tab bar
        Animated.timing(tabBarOpacity, {
          toValue: 0,
          duration: animationDuration * 0.7, // Faster fade out
          useNativeDriver: false,
          easing: Easing.out(Easing.quad),
        }),
      ]).start();
    });

    const keyboardHideListener = Keyboard.addListener(hideEvent, (event) => {
      console.log('🔻 Keyboard hiding');
      setIsKeyboardVisible(false);
      
      // Animate tab bar to show and move down
      const animationDuration = event?.duration && event.duration > 0 ? event.duration : 250;
      
      Animated.parallel([
        // Move the tab bar back down
        Animated.timing(keyboardHeight, {
          toValue: 0,
          duration: animationDuration,
          useNativeDriver: false,
          easing: Easing.out(Easing.quad),
        }),
        // Fade in the tab bar (with delay)
        Animated.timing(tabBarOpacity, {
          toValue: 1,
          duration: animationDuration,
          delay: animationDuration * 0.3, // Start fade in after 30% of animation
          useNativeDriver: false,
          easing: Easing.out(Easing.quad),
        }),
      ]).start();
    });

    return () => {
      keyboardShowListener?.remove();
      keyboardHideListener?.remove();
    };
  }, [keyboardHeight, tabBarOpacity]);

  // Calculate the animated bottom position and opacity
  const animatedStyle = {
    opacity: tabBarOpacity,
    transform: [
      {
        translateY: Animated.multiply(keyboardHeight, -1), // Move up by keyboard height
      },
    ],
  };

  // Don't render the tab bar if keyboard is visible (additional optimization)
  if (isKeyboardVisible) {
    return null;
  }

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
        const iconStyle = route.name === 'History' ? { marginRight: 1 } : {};

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
                    <IconComponent stroke={iconColor} width={24} height={24} />
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