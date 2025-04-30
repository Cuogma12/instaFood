import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../components/auth/AuthContext';
import MainApp from './AppNavigator';
import Admin from './AdminNavigator';
import LoginScreen from '../screens/auth/login';
import RegisterScreen from '../screens/auth/register';

const Stack = createNativeStackNavigator();

export default function RootNavigation() {
  const { user, role, loading } = useContext(AuthContext);

  if (loading) {
    return null;
  }

  if (user) {
    if (role === 'admin') {
      return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="AdminNavigator" component={Admin} />
        </Stack.Navigator>
      );
    } else {
      return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="AppNavigator" component={MainApp} />
        </Stack.Navigator>
      );
    }
  } else {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AppNavigator" component={MainApp} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    );
  }
}
