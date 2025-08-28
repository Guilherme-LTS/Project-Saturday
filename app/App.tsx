// App.tsx

import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from '../navigation/AppNavigator';
import { useGameStore } from '../stores/gameStore';
import { usePlayersStore } from '../stores/playersStore';
import { useThemeStore } from '../stores/themeStore';

export default function App() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  
  const darkMode = useThemeStore((state) => state.darkMode);
  const loadTheme = useThemeStore((state) => state.loadTheme);
  const loadInitialData = usePlayersStore((state) => state.loadInitialData);
  const loadMatchHistory = useGameStore((state) => state.loadMatchHistory);

  useEffect(() => {
    const initializeApp = async () => {
      await loadTheme();
      await loadInitialData();
      await loadMatchHistory();
    };
    
    initializeApp();
  }, []);

  if (!loaded) {
    return null;
  }

  // 2. Wrap the NavigationContainer with SafeAreaProvider
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer theme={darkMode ? DarkTheme : DefaultTheme}>
          <AppNavigator />
          <StatusBar style={darkMode ? "light" : "dark"} />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}