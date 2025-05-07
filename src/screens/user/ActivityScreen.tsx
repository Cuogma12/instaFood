import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl 
} from 'react-native';
import { colors } from '../../utils/colors';
import { getNotificationsForCurrentUser, markAllNotificationsAsRead, Notification } from '../../services/notificationServices';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/stackparamlist';
import { formatTimeAgo } from '../../utils/dateUtils';
import 'moment/locale/vi';

const NotificationItem = ({ notification }: { notification: Notification }) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  // Format thời gian hiển thị sử dụng hàm tiện ích
  const formattedTime = formatTimeAgo(notification.createdAt);
  
  // Xử lý khi người dùng nhấn vào thông báo
  const handlePress = () => {
    // Đối với thông báo có liên quan đến bài đăng
    if (notification.postId) {
      // Điều hướng đến màn hình chi tiết bài đăng
      navigation.navigate('PostDetail', { postId: notification.postId });
    }
    
    // Đối với thông báo follow, có thể điều hướng đến trang profile người đó
    if (notification.type === 'follow') {
      // navigation.navigate('OtherProfile', { userId: notification.senderId });
    }
  };
  
  // Xác định icon và màu sắc dựa trên loại thông báo
  let iconName = 'bell';
  let iconColor = colors.primary;
  
  switch (notification.type) {
    case 'like':
      iconName = 'heart';
      iconColor = '#FF4C61';
      break;
    case 'favorite':
      iconName = 'bookmark';
      iconColor = '#FFD700';
      break;
    case 'comment':
      iconName = 'comment';
      iconColor = colors.primary;
      break;
    case 'follow':
      iconName = 'user-plus';
      iconColor = '#4CAF50';
      break;
    case 'mention':
      iconName = 'at';
      iconColor = '#2196F3';
      break;
  }
  
  return (
    <TouchableOpacity 
      style={[
        styles.notificationItem, 
        !notification.read && styles.unreadNotification
      ]} 
      onPress={handlePress}
    >
      <Image 
        source={{ 
          uri: notification.senderAvatar || 'https://via.placeholder.com/50'
        }} 
        style={styles.avatar} 
      />
      
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.username}>
            {notification.senderUsername || 'Người dùng'}
          </Text>
          <Text style={styles.time}>{formattedTime}</Text>
        </View>
        
        <Text style={styles.message}>
          {notification.message}
        </Text>
      </View>
      
      {notification.postImage && (
        <Image 
          source={{ uri: notification.postImage }} 
          style={styles.postThumbnail} 
        />
      )}
      
      {!notification.postImage && (
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
          <Icon name={iconName} size={18} color={iconColor} />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function ActivityScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Lấy danh sách thông báo khi màn hình được tải
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  // Hàm lấy danh sách thông báo
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotificationsForCurrentUser(50); // Lấy tối đa 50 thông báo
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Xử lý kéo xuống để làm mới
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };
  
  // Xử lý đánh dấu tất cả là đã đọc
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      // Cập nhật lại danh sách thông báo
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({
          ...notification,
          read: true
        }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  // Hiển thị khi đang tải
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  // Hiển thị khi không có thông báo nào
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Icon name="bell-o" size={50} color={colors.lightGray} />
      <Text style={styles.emptyText}>Không có thông báo nào</Text>
      <Text style={styles.emptySubText}>
        Các thông báo về thích, yêu thích và hoạt động khác sẽ xuất hiện ở đây
      </Text>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {notifications.length > 0 && (
          <TouchableOpacity
            style={styles.markReadButton}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.markReadText}>Đánh dấu tất cả đã đọc</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id || Math.random().toString()}
        renderItem={({ item }) => <NotificationItem notification={item} />}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={renderEmptyComponent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  markReadButton: {
    padding: 8,
  },
  markReadText: {
    color: colors.primary,
    fontWeight: '500',
    fontSize: 14,
  },
  listContainer: {
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    backgroundColor: '#fff',
  },
  unreadNotification: {
    backgroundColor: colors.primary + '10', // Semi-transparent primary color
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
    marginRight: 8,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  username: {
    fontWeight: '600',
    fontSize: 16,
    color: colors.text,
  },
  time: {
    fontSize: 12,
    color: colors.darkGray,
  },
  message: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  postThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 4,
    backgroundColor: colors.lightGray,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 20,
  },
});