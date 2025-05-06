import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome';

import { colors } from '../utils/colors';

// Screens
import LoginScreen from '../screens/auth/login';
import RegisterScreen from '../screens/auth/register';
import HomeScreen from '../screens/user/HomeScreen';
import DiscoverScreen from '../screens/user/DiscoverScreen';
import CreatePostScreen from '../screens/user/CreatePostScreen';
import ActivityScreen from '../screens/user/ActivityScreen';
import ProfileScreen from '../screens/user/ProfileScreen';
import RenderHeader from '../screens/user/ProfileScreen';
import EditProfile from '../screens/user/EditProfile';
import SettingScreen from '../screens/user/SettingScreen';
import AdminNavigator from './AdminNavigator';
import { RootStackParamList } from '../types/stackparamlist';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

//Component Header

// Màn hình Tab chính
export function MainApp() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.darkGray,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.lightGray,
          height: 50,
        },
        headerStyle: {
          backgroundColor: colors.primary,

        },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: colors.text,
       
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'instaFood',
          tabBarIcon: ({ color }) => <Icon name="home" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          title: 'Khám phá',
          tabBarIcon: ({ color }) => <Icon name="search" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{
          title: 'Đăng bài',
          tabBarIcon: ({ color }) => <Icon name="plus-square" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Activity"
        component={ActivityScreen}
        options={{
          title: 'Hoạt động',
          tabBarIcon: ({ color }) => <Icon name="heart" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: false,
          header: () => <RenderHeader />,
          title: 'Trang cá nhân',
          tabBarIcon: ({ color }) => <Icon name="user" size={24} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

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
      <Stack.Screen name="MainApp" component={MainApp} />
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
