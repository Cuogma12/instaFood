import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../utils/colors';

// Screens
import HomeScreen from '../screens/user/HomeScreen';
import DiscoverScreen from '../screens/user/DiscoverScreen';
import CreatePostScreen from '../screens/user/CreatePostScreen';
import ActivityScreen from '../screens/user/ActivityScreen';
import ProfileScreen from '../screens/user/ProfileScreen';

const Tab = createBottomTabNavigator();

export function UserApp() {
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
          title: 'Trang cá nhân',
          tabBarIcon: ({ color }) => <Icon name="user" size={24} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}