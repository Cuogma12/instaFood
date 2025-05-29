import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { View, Text } from 'react-native';
import {seedCategories} from './src/utils/categorySeed';
import { PostProvider } from './src/components/context/PostContext';

export default function App() {
  // useEffect(() => {
  //   seedCategories();
  // }, []);
  
  // Ensure the app is properly initialized and ready to use
    return (
    <NavigationContainer>
      <PostProvider>
        <AppNavigator />
      </PostProvider>
    </NavigationContainer>
  );
}