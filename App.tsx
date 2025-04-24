import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import auth from '@react-native-firebase/auth';
import { View, Text } from 'react-native';

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState<Error | null>(null);

  // useEffect(() => {
  //   try {
  //     // Sign out on app load
  //     auth().signOut();

  //     const subscriber = auth().onAuthStateChanged(() => {
  //       setInitializing(false);
  //     });
  //     return subscriber;
  //   } catch (error) {
  //     setAuthError(error as Error);
  //     setInitializing(false);
  //   }
  // }, []);

  // if (initializing) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
  //       <Text>Loading...</Text>
  //     </View>
  //   );
  // }

  // if (authError) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
  //       <Text>Error initializing authentication: {authError.message}</Text>
  //     </View>
  //   );
  // }

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}