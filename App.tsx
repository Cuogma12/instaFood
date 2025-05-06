import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import auth from '@react-native-firebase/auth';
import { View, Text } from 'react-native';
import {seedCategories} from './src/utils/categorySeed';
export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState<Error | null>(null);

  // useEffect(() => {
  //   seedCategories();
  // }, []);
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}