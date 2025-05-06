import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../utils/colors';

// Screens
import LoginScreen from '../screens/auth/login';
import RegisterScreen from '../screens/auth/register';
import EditProfile from '../screens/user/EditProfile';
import SettingScreen from '../screens/user/SettingScreen';
import PostDetailScreen from '../screens/user/PostDetailScreen';
import AdminNavigator from './AdminNavigator';
import { UserApp } from './AppSwitcher';
import { RootStackParamList } from '../types/stackparamlist';


const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="MainApp"
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
        animation: 'slide_from_bottom',
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTitleStyle: {
          fontWeight: 'medium',
          color: colors.text,
        },
      }}
    >
      <Stack.Screen
  name="PostDetail"
  component={PostDetailScreen}
  options={{
    headerShown: true,
    title: 'Chi tiết bài viết',
  }}
/>
      <Stack.Screen name="MainApp" component={UserApp} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Admin" component={AdminNavigator} />
      <Stack.Screen
        name="EditProfile"
        component={EditProfile}
        options={{
          headerShown: true,
          title: 'Chỉnh sửa trang cá nhân'
        }}
      />
      <Stack.Screen
        name="SettingScreen"
        component={SettingScreen}
        options={{
          headerShown: true,
          title: 'Cài đặt'
        }}
      />
    </Stack.Navigator>
  );
}
