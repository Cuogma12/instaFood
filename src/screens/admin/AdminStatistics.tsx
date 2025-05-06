import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  Modal,
  Platform
} from 'react-native';
import { colors } from '../../utils/colors';
import Icon from 'react-native-vector-icons/FontAwesome';
import firestore, { 
  getDocs,
  collection,
  query,
  where,
  Timestamp
} from '@react-native-firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

interface StatCardProps {
  icon: string;
  title: string;
  value: number;
  color: string;
}

export default function AdminStatistics() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    recipePosts: 0,
    reviewPosts: 0,
    generalPosts: 0,
    totalCategories: 0,
  });
  
  // Thêm state cho chọn thời gian
  const [timeRange, setTimeRange] = useState('all'); // all, 7days, 30days, 90days, custom
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // Mặc định 30 ngày trước
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [timeFilterModalVisible, setTimeFilterModalVisible] = useState(false);
  
  // Các tùy chọn khoảng thời gian
  const timeRangeOptions = [
    { label: 'Tất cả thời gian', value: 'all' },
    { label: '7 ngày qua', value: '7days' },
    { label: '30 ngày qua', value: '30days' },
    { label: '90 ngày qua', value: '90days' },
    { label: 'Tùy chỉnh', value: 'custom' },
  ];

  const fetchStats = async () => {
    try {
      setLoading(true);
      const db = firestore();
      
      // Đếm tổng số người dùng
      const usersQuery = collection(db, 'Users');
      const usersSnapshot = await getDocs(usersQuery);
      const usersCount = usersSnapshot.size;
      
      // Thiết lập khoảng thời gian dựa trên lựa chọn
      let startFilterDate = new Date(0); // Mặc định từ đầu (1970)
      let endFilterDate = new Date(); // Mặc định đến hiện tại
      
      switch (timeRange) {
        case '7days':
          startFilterDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startFilterDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90days':
          startFilterDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'custom':
          startFilterDate = startDate;
          endFilterDate = endDate;
          break;
      }
      
      // Đếm các loại bài đăng theo khoảng thời gian
      const postsRef = collection(db, 'Posts');
      const postsSnapshot = await getDocs(postsRef);
      
      // Lọc post theo thời gian
      const posts = postsSnapshot.docs
        .map(doc => ({ id: doc.id, ...(doc.data() as { createdAt?: any; postType?: string }) }))
        .filter(post => {
          // Nếu chọn "all" thì không cần lọc
          if (timeRange === 'all') return true;
          
          // Nếu post không có createdAt thì không tính
          if (!post.createdAt) return false;
          
          // Chuyển đổi Firestore timestamp thành Date
          let postDate;
          if (post.createdAt.toDate) {
            // Trường hợp là Firestore Timestamp
            postDate = post.createdAt.toDate();
          } else if (post.createdAt.seconds) {
            // Trường hợp là object có seconds
            postDate = new Date(post.createdAt.seconds * 1000);
          } else {
            // Trường hợp là string hoặc timestamp JavaScript
            postDate = new Date(post.createdAt);
          }
          
          return postDate >= startFilterDate && postDate <= endFilterDate;
        });
      
      const totalPosts = posts.length;
      const recipePosts = posts.filter(post => post.postType === 'recipe').length;
      const reviewPosts = posts.filter(post => post.postType === 'review').length;
      const generalPosts = posts.filter(post => post.postType === 'normal').length;
      
      // Đếm tổng số danh mục
      const categoriesSnapshot = await getDocs(collection(db, 'Categories'));
      const categoriesCount = categoriesSnapshot.size;

      setStats({
        totalUsers: usersCount,
        totalPosts,
        recipePosts,
        reviewPosts,
        generalPosts,
        totalCategories: categoriesCount,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  // Hàm xử lý khi thay đổi ngày bắt đầu
  const onChangeStartDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || startDate;
    setShowStartPicker(Platform.OS === 'ios');
    setStartDate(currentDate);
    
    // Đảm bảo ngày bắt đầu không lớn hơn ngày kết thúc
    if (currentDate > endDate) {
      setEndDate(currentDate);
    }
  };

  // Hàm xử lý khi thay đổi ngày kết thúc
  const onChangeEndDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || endDate;
    setShowEndPicker(Platform.OS === 'ios');
    setEndDate(currentDate);
    
    // Đảm bảo ngày kết thúc không nhỏ hơn ngày bắt đầu
    if (currentDate < startDate) {
      setStartDate(currentDate);
    }
  };

  // Hàm áp dụng bộ lọc thời gian
  const applyTimeFilter = () => {
    setTimeFilterModalVisible(false);
    fetchStats();
  };

  // Cập nhật fetchStats khi thay đổi khoảng thời gian
  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  useEffect(() => {
    const loadStats = async () => {
      await fetchStats();
      setLoading(false);
    };
    loadStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const StatCard = ({ icon, title, value, color }: StatCardProps) => (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.cardHeader}>
        <Icon name={icon} size={24} color={color} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={[styles.cardValue, { color }]}>{value}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thống kê tổng quan</Text>
        <View style={styles.headerRow}>
          <Text style={styles.headerSubtitle}>
            Cập nhật lần cuối: {new Date().toLocaleString()}
          </Text>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setTimeFilterModalVisible(true)}
          >
            <Icon name="calendar" size={14} color="#fff" style={styles.filterIcon} />
            <Text style={styles.filterText}>
              {timeRange === 'custom' 
                ? `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
                : timeRangeOptions.find(option => option.value === timeRange)?.label || 'Lọc theo thời gian'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.grid}>
        <StatCard
          icon="users"
          title="Người dùng"
          value={stats.totalUsers}
          color="#4CAF50"
        />
        <StatCard
          icon="file-text"
          title="Tổng bài đăng"
          value={stats.totalPosts}
          color="#2196F3"
        />
        <StatCard
          icon="cutlery"
          title="Công thức"
          value={stats.recipePosts}
          color="#FF9800"
        />
        <StatCard
          icon="star"
          title="Đánh giá"
          value={stats.reviewPosts}
          color="#9C27B0"
        />
        <StatCard
          icon="newspaper-o"
          title="Bài viết thường"
          value={stats.generalPosts}
          color="#607D8B"
        />
        <StatCard
          icon="list"
          title="Danh mục"
          value={stats.totalCategories}
          color="#795548"
        />
      </View>
      
      {/* Modal chọn khoảng thời gian */}
      <Modal
        visible={timeFilterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTimeFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Lọc theo thời gian</Text>
            
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Chọn khoảng thời gian:</Text>
              <View style={styles.pickerBorder}>
                <Picker
                  selectedValue={timeRange}
                  onValueChange={(itemValue) => setTimeRange(itemValue)}
                  style={styles.picker}
                >
                  {timeRangeOptions.map(option => (
                    <Picker.Item 
                      key={option.value} 
                      label={option.label} 
                      value={option.value}
                    />
                  ))}
                </Picker>
              </View>
            </View>
            
            {timeRange === 'custom' && (
              <View style={styles.datePickerContainer}>
                <Text style={styles.datePickerLabel}>Khoảng thời gian tùy chọn:</Text>
                
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Từ ngày:</Text>
                  <TouchableOpacity 
                    style={styles.dateButton}
                    onPress={() => setShowStartPicker(true)}
                  >
                    <Text style={styles.dateText}>{startDate.toLocaleDateString()}</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Đến ngày:</Text>
                  <TouchableOpacity 
                    style={styles.dateButton}
                    onPress={() => setShowEndPicker(true)}
                  >
                    <Text style={styles.dateText}>{endDate.toLocaleDateString()}</Text>
                  </TouchableOpacity>
                </View>
                
                {showStartPicker && (
                  <DateTimePicker
                    value={startDate}
                    mode="date"
                    display="default"
                    onChange={onChangeStartDate}
                    maximumDate={new Date()}
                  />
                )}
                
                {showEndPicker && (
                  <DateTimePicker
                    value={endDate}
                    mode="date"
                    display="default"
                    onChange={onChangeEndDate}
                    minimumDate={startDate}
                    maximumDate={new Date()}
                  />
                )}
              </View>
            )}
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setTimeFilterModalVisible(false)}
              >
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={applyTimeFilter}
              >
                <Text style={styles.applyText}>Áp dụng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  },
  header: {
    padding: 20,
    backgroundColor: colors.primary,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  filterIcon: {
    marginRight: 5,
  },
  filterText: {
    color: '#fff',
    fontSize: 12,
  },
  grid: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  pickerContainer: {
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 14,
    marginBottom: 10,
  },
  pickerBorder: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  datePickerContainer: {
    marginBottom: 20,
  },
  datePickerLabel: {
    fontSize: 14,
    marginBottom: 10,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateLabel: {
    fontSize: 14,
    width: 80,
  },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
  },
  dateText: {
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  cancelBtn: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  cancelText: {
    fontSize: 14,
    color: '#333',
  },
  applyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  applyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
});