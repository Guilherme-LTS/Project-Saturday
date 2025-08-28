import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';

import DrawScreen from '../screens/DrawScreen';
import EditScreen from '../screens/EditScreen';
import HistoryScreen from '../screens/HistoryScreen';
import PlayersScreen from '../screens/PlayersScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Import your custom tab bar
import CustomTabBar from '../components/CustomTabBar';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        // This helps with keyboard behavior on some React Navigation versions
        tabBarHideOnKeyboard: true,
      }}
      // Use your custom tab bar
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Edit" component={EditScreen} />
      <Tab.Screen name="Draw" component={DrawScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Players" component={PlayersScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}