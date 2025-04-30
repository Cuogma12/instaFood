import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../../utils/colors';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../types/stackparamlist';
import useAuth from '../../hooks/useAuth';
import { SettingItemProps } from '../../types/props/UIProps';
// Interface cho các item trong menu cài đặt


type SettingScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function SettingScreen() {
  const navigation = useNavigation<SettingScreenNavigationProp>();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Trạng thái các cài đặt
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [dataUsageReduced, setDataUsageReduced] = useState(false);

  // Xử lý đăng xuất
  const handleLogout = async () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất không?",
      [
        {
          text: "Hủy",
          style: "cancel"
        },
        { 
          text: "Đăng xuất", 
          onPress: async () => {
            try {
              setIsLoading(true);
              const auth = getAuth();
              await signOut(auth);
              setIsLoading(false);
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainApp' }]
              });
            } catch (error) {
              setIsLoading(false);
              Alert.alert("Lỗi", "Đăng xuất thất bại. Vui lòng thử lại sau.");
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  // Điều hướng đến màn hình chỉnh sửa profile
  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  // Component hiển thị từng item cài đặt
  const renderSettingItem = ({ icon, title, hasSwitch, switchValue, onSwitchChange, onPress }: SettingItemProps) => (
    <TouchableOpacity 
      style={styles.settingItem}
      onPress={onPress}
      disabled={hasSwitch}
    >
      <View style={styles.settingIconContainer}>
        <Icon name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={styles.settingTitle}>{title}</Text>
      {hasSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: colors.lightGray, true: colors.primary }}
          thumbColor="#FFF"
        />
      ) : (
        <Icon name="chevron-right" size={16} color={colors.darkGray} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Phần thông tin tài khoản */}
        <View style={styles.profileSection}>
          <Image 
            source={
              user?.photoURL 
                ? { uri: user.photoURL } 
                : require('../../assets/images/defaultuser.png')
            } 
            style={styles.profileImage} 
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.displayName || 'Người dùng InstaFood'}</Text>
            {/* <Text style={styles.profileUsername}>@{user?.username || 'user'}</Text> */}
          </View>
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={handleEditProfile}
          >
            <Text style={styles.editProfileText}>Chỉnh sửa</Text>
          </TouchableOpacity>
        </View>

        {/* Phần cài đặt tài khoản */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài khoản</Text>
          
          {renderSettingItem({
            icon: "user",
            title: "Thông tin cá nhân",
            onPress: handleEditProfile,
          })}
          
          {renderSettingItem({
            icon: "bell",
            title: "Thông báo",
            hasSwitch: true,
            switchValue: notificationsEnabled,
            onSwitchChange: setNotificationsEnabled,
          })}
          
          {renderSettingItem({
            icon: "lock",
            title: "Quyền riêng tư",
            onPress: () => Alert.alert("Thông báo", "Tính năng đang được phát triển"),
          })}
        </View>
        
        {/* Phần cài đặt ứng dụng */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ứng dụng</Text>
          
          {renderSettingItem({
            icon: "moon-o",
            title: "Chế độ tối",
            hasSwitch: true,
            switchValue: darkModeEnabled,
            onSwitchChange: setDarkModeEnabled,
          })}
          
          {renderSettingItem({
            icon: "database",
            title: "Tiết kiệm dữ liệu",
            hasSwitch: true,
            switchValue: dataUsageReduced,
            onSwitchChange: setDataUsageReduced,
          })}
          
          {renderSettingItem({
            icon: "download",
            title: "Tải xuống",
            onPress: () => Alert.alert("Thông báo", "Tính năng đang được phát triển"),
          })}
        </View>
        
        {/* Phần hỗ trợ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hỗ trợ</Text>
          
          {renderSettingItem({
            icon: "question-circle",
            title: "Trung tâm trợ giúp",
            onPress: () => Alert.alert("Thông báo", "Tính năng đang được phát triển"),
          })}
          
          {renderSettingItem({
            icon: "exclamation-circle",
            title: "Báo cáo sự cố",
            onPress: () => Alert.alert("Thông báo", "Tính năng đang được phát triển"),
          })}
          
          {renderSettingItem({
            icon: "info-circle",
            title: "Giới thiệu",
            onPress: () => Alert.alert("InstaFood", "Phiên bản 1.0.0\n© 2025 InstaFood Team"),
          })}
        </View>
        
        {/* Nút đăng xuất */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Icon name="sign-out" size={20} color="#FFF" />
              <Text style={styles.logoutText}>Đăng xuất</Text>
            </>
          )}
        </TouchableOpacity>
        
        <Text style={styles.versionText}>InstaFood v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  profileUsername: {
    fontSize: 14,
    color: colors.darkGray,
    marginTop: 2,
  },
  editProfileButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: `${colors.primary}20`,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  section: {
    marginTop: 16,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTitle: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.error,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  versionText: {
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 32,
    fontSize: 14,
    color: colors.darkGray,
  },
});