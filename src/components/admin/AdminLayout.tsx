import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const TABS = [
  { key: 'users', label: 'Quản lý người dùng' },
  { key: 'posts', label: 'Quản lý bài đăng' },
  { key: 'categories', label: 'Quản lý danh mục' },
  { key: 'stats', label: 'Thống kê' },
];

export default function AdminLayout({ children }: { children?: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState('users');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return (
          <View style={styles.contentBox}>
            <Text style={styles.title}>Quản lý người dùng</Text>
            <Text>- Xem danh sách người dùng.</Text>
            <Text>- Thêm người dùng mới.</Text>
            <Text>- Sửa thông tin người dùng.</Text>
            <Text>- Xóa người dùng.</Text>
          </View>
        );
      case 'posts':
        return (
          <View style={styles.contentBox}>
            <Text style={styles.title}>Quản lý bài đăng</Text>
            <Text>- Xem danh sách bài đăng.</Text>
            <Text>- Xóa bài đăng vi phạm.</Text>
          </View>
        );
      case 'categories':
        return (
          <View style={styles.contentBox}>
            <Text style={styles.title}>Quản lý danh mục</Text>
            <Text>- Thêm danh mục mới.</Text>
            <Text>- Sửa danh mục.</Text>
            <Text>- Xóa danh mục.</Text>
          </View>
        );
      case 'stats':
        return (
          <View style={styles.contentBox}>
            <Text style={styles.title}>Thống kê</Text>
            <Text>- Xem số lượng người dùng.</Text>
            <Text>- Xem số lượng bài đăng.</Text>
            <Text>- Xem lượt truy cập ứng dụng.</Text>
          </View>
        );
      default:
        return children;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.content}>{renderTabContent()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f8f8',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#3F51B5',
    backgroundColor: '#e6eaff',
  },
  tabText: {
    color: '#333',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3F51B5',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  contentBox: {
    backgroundColor: '#f4f6fa',
    borderRadius: 8,
    padding: 16,
    marginTop: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#3F51B5',
  },
});
