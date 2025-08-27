import { Redirect } from 'expo-router';
import React from 'react';

export default function AppIndex() {
  // This component will automatically redirect to the default screen
  // inside your (tabs) group, which will be 'players'.
  return <Redirect href="/players" />;
}