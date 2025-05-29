import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../utils/colors';
import { View, Text } from 'react-native';
import { getUnreadNotificationCount } from '../services/notificationServices';
import { PostProvider } from '../components/context/PostContext';

// Screens
import HomeScreen from '../screens/user/HomeScreen';
import DiscoverScreen from '../screens/user/DiscoverScreen';
import CreatePostScreen from '../screens/user/CreatePostScreen';
import ActivityScreen from '../screens/user/ActivityScreen';
import ProfileScreen from '../screens/user/ProfileScreen';

// NotificationTabIcon component with badge
const NotificationTabIcon = ({ color, focused }: { color: string, focused: boolean }) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    // Function to fetch unread notifications count
    const fetchUnreadCount = async () => {
      try {
        const count = await getUnreadNotificationCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Error fetching unread notifications count:', error);
      }
    };

    // Fetch initially
    fetchUnreadCount();

    // Set up interval to refresh the count every 30 seconds
    const intervalId = setInterval(fetchUnreadCount, 30000);

    // When tab is focused, also refresh the count
    if (focused) {
      fetchUnreadCount();
    }

    return () => clearInterval(intervalId);
  }, [focused]);

  return (
    <View style={{ width: 32, height: 32, justifyContent: 'center', alignItems: 'center' }}>
      <Icon name="heart" size={24} color={color} />
      {unreadCount > 0 && (
        <View
          style={{
            position: 'absolute',
            right: -5,
            top: -5,
            backgroundColor: '#FF4C61',
            borderRadius: 10,
            width: unreadCount > 9 ? 20 : 16,
            height: 16,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#FFF',
          }}
        >
          <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </View>
  );
};

const Tab = createBottomTabNavigator();

export function UserApp() {
  return (
    <PostProvider>
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
          tabBarIcon: ({ color, focused }) => (
            <NotificationTabIcon color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: false,
          title: 'Trang cá nhân',
          tabBarIcon: ({ color }) => <Icon name="user" size={24} color={color} />,
        }}      />
    </Tab.Navigator>
    </PostProvider>
  );
}