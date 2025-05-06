import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome';
import AdminHome from '../screens/admin/AdminHome';
import AdminCategory from '../screens/admin/AdminCategory';
import SettingScreen from '../screens/user/SettingScreen';
import { colors } from '../utils/colors';
import EditProfile from '../screens/user/EditProfile';
import MainApp from './AppNavigator';
// Dummy screens for tabs (bạn nên tạo các file riêng nếu muốn tách logic)
function UsersScreen() {
  return <AdminHome />;
}
function PostsScreen() {
  return (
    <AdminHome />
  );
}
function CategoriesScreen() {
  return <AdminCategory />;
}
function StatsScreen() {
  return (
    <AdminHome />
  );
}

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Admin() {
  return (
    <Tab.Navigator
      initialRouteName="Users"
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
        name="Users"
        component={UsersScreen}
        options={{
          title: 'Người dùng',
          tabBarIcon: ({ color }) => <Icon name="users" size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Posts"
        component={PostsScreen}
        options={{
          title: 'Bài đăng',
          tabBarIcon: ({ color }) => <Icon name="file-text" size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{
          title: 'Danh mục',
          tabBarIcon: ({ color }) => <Icon name="list" size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          title: 'Thống kê',
          tabBarIcon: ({ color }) => <Icon name="bar-chart" size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Setting"
        component={SettingScreen}
        options={{
          title: 'Cài đặt',
          tabBarIcon: ({ color }) => <Icon name="bars" size={22} color={color} />,
        }}
      />
      
    </Tab.Navigator>
  );
}

export default function AdminNavigator() {
  return (
    <Stack.Navigator initialRouteName="AdminTabs">
      <Stack.Screen name="AdminTabs" component={Admin} options={{ headerShown: false }} />
      <Stack.Screen name="CreateCategory" component={CategoriesScreen} options={{ title: 'Tạo danh mục', headerShown: true }} />
      <Stack.Screen
        name="EditProfile"
        component={EditProfile}
        options={{
          headerShown: true,
          title: 'Chỉnh sửa trang cá nhân'
        }}
      />
       <Stack.Screen
        name="BackToApp"
        component={MainApp}
      />
    </Stack.Navigator>
  );
}