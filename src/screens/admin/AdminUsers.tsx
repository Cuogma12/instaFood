import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import { colors } from '../../utils/colors';
import Icon from 'react-native-vector-icons/FontAwesome';
import { getFirestore, collection, query, getDocs, doc, updateDoc, deleteDoc } from '@react-native-firebase/firestore';
import { UserData } from '../../types/user';

export default function AdminUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const db = getFirestore();

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'Users');
      const usersSnapshot = await getDocs(usersRef);
      const usersList = usersSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as UserData));
      
      setUsers(usersList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách người dùng');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const handleUpdateRole = async (uid: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    Alert.alert(
      'Xác nhận thay đổi quyền',
      `Bạn có chắc chắn muốn thay đổi quyền của người dùng này từ ${currentRole} thành ${newRole}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          style: 'default',
          onPress: async () => {
            try {
              const userRef = doc(db, 'Users', uid);
              await updateDoc(userRef, { role: newRole });
              
              // Cập nhật state
              setUsers(users.map(user => 
                user.uid === uid ? { ...user, role: newRole } : user
              ));
              
              Alert.alert('Thành công', 'Đã cập nhật quyền người dùng');
            } catch (error) {
              console.error('Error updating user role:', error);
              Alert.alert('Lỗi', 'Không thể cập nhật quyền người dùng');
            }
          }
        }
      ]
    );
  };

  const handleDeleteUser = async (uid: string) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn xóa người dùng này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const userRef = doc(db, 'Users', uid);
              await deleteDoc(userRef);
              
              // Cập nhật state
              setUsers(users.filter(user => user.uid !== uid));
              
              Alert.alert('Thành công', 'Đã xóa người dùng');
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Lỗi', 'Không thể xóa người dùng');
            }
          }
        }
      ]
    );
  };

  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUserItem = ({ item }: { item: UserData }) => (
    <View style={styles.userItem}>
      <Image 
        source={item.photoURL ? { uri: item.photoURL } : require('../../assets/images/defaultuser.png')}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.displayName}>{item.displayName}</Text>
        <Text style={styles.username}>@{item.username}</Text>
        <Text style={styles.email}>{item.email}</Text>
        <View style={styles.roleContainer}>
          <Text style={[styles.roleText, item.role === 'admin' ? styles.adminRole : styles.userRole]}>
            {item.role === 'admin' ? 'Admin' : 'User'}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.roleButton]} 
          onPress={() => handleUpdateRole(item.uid, item.role)}
        >
          <Icon name="exchange" size={16} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteUser(item.uid)}
        >
          <Icon name="trash" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={colors.darkGray} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm người dùng..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={item => item.uid}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="users" size={50} color={colors.lightGray} />
            <Text style={styles.emptyText}>Không tìm thấy người dùng nào</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  username: {
    fontSize: 14,
    color: colors.darkGray,
  },
  email: {
    fontSize: 14,
    color: colors.darkGray,
    marginTop: 2,
  },
  roleContainer: {
    marginTop: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  adminRole: {
    backgroundColor: `${colors.primary}20`,
    color: colors.primary,
  },
  userRole: {
    backgroundColor: '#e0e0e0',
    color: '#666',
  },
  actions: {
    justifyContent: 'space-around',
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  roleButton: {
    backgroundColor: `${colors.primary}20`,
  },
  deleteButton: {
    backgroundColor: `${colors.error}20`,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: colors.darkGray,
    marginTop: 8,
  },
});