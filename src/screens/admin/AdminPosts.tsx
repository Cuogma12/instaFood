import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../../utils/colors';
import { getAllPosts, deletePost, togglePostVisibility } from '../../services/postServices';
import { PostType } from '../../types/post';
import moment from 'moment';
import { AdminPost } from '../../types/post';

export default function AdminPosts() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<PostType | 'all'>('all');

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const postsData = await getAllPosts();
      setPosts(postsData as AdminPost[]);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải danh sách bài đăng');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const handleDeletePost = async (postId: string) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn xóa bài đăng này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost(postId);
              setPosts(posts.filter(post => post.id !== postId));
              Alert.alert('Thành công', 'Đã xóa bài đăng');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa bài đăng');
            }
          }
        }
      ]
    );
  };

  const handleToggleVisibility = async (postId: string, currentVisibility: boolean) => {
    try {
      await togglePostVisibility(postId, !currentVisibility);
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, isHidden: !currentVisibility } : post
      ));
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể thay đổi trạng thái bài đăng');
    }
  };

  const renderPostItem = ({ item }: { item: AdminPost }) => (
    <View style={styles.postItem}>
      <Image 
        source={{ uri: item.mediaUrls[0] }} 
        style={styles.postImage}
        defaultSource={require('../../assets/images/defaultuser.png')}
      />
      <View style={styles.postInfo}>
        <Text style={styles.postTitle} numberOfLines={2}>
          {item.postType === PostType.RECIPE ? item.recipeDetails?.title :
           item.postType === PostType.REVIEW ? item.reviewDetails?.name :
           item.caption.substring(0, 50)}
        </Text>
        <Text style={styles.postMeta}>
          Đăng bởi: {item.username} • {moment(item.createdAt).fromNow()}
        </Text>
        <Text style={styles.postType}>
          {item.postType === PostType.RECIPE ? '🍳 Công thức' :
           item.postType === PostType.REVIEW ? '⭐ Đánh giá' : '📝 Bài viết'}
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity 
          onPress={() => handleToggleVisibility(item.id, item.isHidden ?? false)}
          style={styles.actionButton}
        >
          <Icon 
            name={item.isHidden ? 'eye' : 'eye-slash'} 
            size={20} 
            color={colors.primary}
          />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => handleDeletePost(item.id)}
          style={styles.actionButton}
        >
          <Icon name="trash" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || post.postType === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color={colors.darkGray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm bài đăng..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterButton, selectedType === 'all' && styles.activeFilter]}
            onPress={() => setSelectedType('all')}
          >
            <Text style={[styles.filterText, selectedType === 'all' && styles.activeFilterText]}>
              Tất cả
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedType === PostType.RECIPE && styles.activeFilter]}
            onPress={() => setSelectedType(PostType.RECIPE)}
          >
            <Text style={[styles.filterText, selectedType === PostType.RECIPE && styles.activeFilterText]}>
              Công thức
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedType === PostType.REVIEW && styles.activeFilter]}
            onPress={() => setSelectedType(PostType.REVIEW)}
          >
            <Text style={[styles.filterText, selectedType === PostType.REVIEW && styles.activeFilterText]}>
              Đánh giá
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedType === PostType.GENERAL && styles.activeFilter]}
            onPress={() => setSelectedType(PostType.GENERAL)}
          >
            <Text style={[styles.filterText, selectedType === PostType.GENERAL && styles.activeFilterText]}>
              Bài viết
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredPosts}
          renderItem={renderPostItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="inbox" size={50} color={colors.lightGray} />
              <Text style={styles.emptyText}>Chưa có bài đăng nào</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: colors.text,
  },
  filterContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  activeFilter: {
    backgroundColor: colors.primary,
  },
  filterText: {
    color: colors.darkGray,
  },
  activeFilterText: {
    color: '#fff',
  },
  postItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  postImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.lightGray,
  },
  postInfo: {
    flex: 1,
    marginLeft: 12,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  postMeta: {
    fontSize: 12,
    color: colors.darkGray,
    marginBottom: 4,
  },
  postType: {
    fontSize: 12,
    color: colors.primary,
  },
  actions: {
    justifyContent: 'space-around',
    paddingLeft: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 16,
    color: colors.darkGray,
  },
});