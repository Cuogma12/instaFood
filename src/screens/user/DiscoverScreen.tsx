import React, { useState, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, ActivityIndicator, Animated, StatusBar, Share, Alert, Modal, Pressable, ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../../utils/colors';
import { getPosts } from '../../services/postServices';
import { getAllCategories } from '../../services/categoriesServices';
import ReviewPost from '../../components/user/ReviewPost';
import RecipePost from '../../components/user/RecipePost';
import type { Category } from '../../services/categoriesServices';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from '@react-native-firebase/firestore';
import { usePostContext } from '../../components/context/PostContext';

// Post types constant
const POST_TYPES = [
  { key: 'all', label: 'Tất cả' },
  { key: 'review', label: 'Đánh giá' },
  { key: 'recipe', label: 'Công thức' },
  { key: 'general', label: 'Chung' },
];

const SORT_OPTIONS = [
  { key: 'newest', label: 'Mới nhất' },
  { key: 'oldest', label: 'Cũ nhất' },
  { key: 'popular', label: 'Phổ biến' },
];

type RootStackParamList = {
  PostDetail: { postId: string | number };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PostDetail'>;

export default function DiscoverScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPostType, setSelectedPostType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [bookmarked, setBookmarked] = useState<{ [id: string]: boolean }>({});
  const [filterMode, setFilterMode] = useState<'type' | 'category'>('type');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const scrollY = React.useRef(new Animated.Value(0)).current;
  
  // Use the PostContext instead of local state for likes
  const { likedPosts, likeCounts, toggleLike, initializePostStates } = usePostContext();
  useEffect(() => {
    fetchData();
    fetchCategories();
  }, []);
  // Removed useEffect that depended on [posts, initializePostStates]

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPosts();
      setPosts(data);
      // Initialize post states after fetching posts
      if (data && data.length > 0) {
        initializePostStates(data);
      }
    } catch (err) {
      setError('Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const categoriesData = await getAllCategories();
      setCategories([{ categoryId: 'all', name: 'Tất cả', type: 'all', description: '', createdAt: new Date() }, ...categoriesData]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Lọc bài viết theo chế độ filter
  const filteredPosts = posts
    .filter(post => {
      // Lọc theo thể loại bài viết
      if (filterMode === 'type') {
        if (selectedPostType === 'all') return true;
        switch (selectedPostType) {
          case 'review':
            return post.type === 'review' || post.reviewDetails;
          case 'recipe':
            return post.type === 'recipe' || post.recipeDetails;
          case 'general':
            return post.type === 'general' || (!post.reviewDetails && !post.recipeDetails);
          default:
            return true;
        }
      }
      // Lọc theo danh mục
      else {
        if (selectedCategory === 'all') return true;
        return post.categoryId === selectedCategory;
      }
    })
    .filter(post =>
      search ? (
        (post.caption && post.caption.toLowerCase().includes(search.toLowerCase())) ||
        (post.username && post.username.toLowerCase().includes(search.toLowerCase()))
      ) : true
    )
    .sort((a, b) => {
      // Hàm chuyển đổi createdAt sang Date
      const getTimestamp = (post: any) => {
        if (!post.createdAt) return 0;
        if (post.createdAt.toDate) {
          return post.createdAt.toDate().getTime();
        }
        if (post.createdAt.seconds) {
          return post.createdAt.seconds * 1000;
        }
        if (typeof post.createdAt === 'string') {
          return new Date(post.createdAt).getTime();
        }
        return 0;
      };

      const timeA = getTimestamp(a);
      const timeB = getTimestamp(b);

      if (sortBy === 'newest') return timeB - timeA;
      if (sortBy === 'oldest') return timeA - timeB;
      if (sortBy === 'popular') return (b.likes?.length || 0) - (a.likes?.length || 0);
      return 0;
    });

  const handleBookmark = (id: string) => {
    setBookmarked(prev => ({ ...prev, [id]: !prev[id] }));
  };
  
  const handleShare = async (item: any) => {
    try {
      await Share.share({
        message: `${item.caption}\n${item.mediaUrls && item.mediaUrls[0] ? item.mediaUrls[0] : ''}`,
      });
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chia sẻ bài viết.');
    }
  };
  
  const handleComment = (item: any) => {
    Alert.alert('Bình luận', 'Chức năng bình luận sẽ được cập nhật.');
  };

  const renderPost = ({ item }: { item: any }) => {
    // Using data from the parent component's state instead of hooks
    const isLiked = likedPosts[item.id] || false;
    const likeCount = likeCounts[item.id] || 0;
    
    const handlePostPress = () => {
      navigation.navigate('PostDetail', { postId: item.id });
    };  // Use the toggleLike function from context
  async function handleLikePress(id: string): Promise<void> {
    try {
      const currentUser = getAuth().currentUser;
      if (!currentUser) {
        Alert.alert("Yêu cầu đăng nhập", "Vui lòng đăng nhập để thích bài viết");
        return;
      }
      
      await toggleLike(id);
    } catch (error) {
      console.error("Error toggling like:", error);
      Alert.alert("Lỗi", "Không thể thực hiện thao tác này");
    }
  }

    let PostComponent = null;
    if (item.type === 'review' && item.reviewDetails) {
      PostComponent = (
        <TouchableOpacity onPress={handlePostPress}>
          <ReviewPost
            reviewDetails={item.reviewDetails}
            caption={item.caption}
            hashtags={item.hashtags}
            category={item.category}
            location={item.location}
          />
        </TouchableOpacity>
      );
    } else if (item.type === 'recipe' && item.recipeDetails) {
      PostComponent = (
        <TouchableOpacity onPress={handlePostPress}>
          <RecipePost
            recipeDetails={item.recipeDetails}
            caption={item.caption}
          />
        </TouchableOpacity>
      );
    } else {
      PostComponent = (
        <TouchableOpacity onPress={handlePostPress}>
          <View style={styles.postContainer}>
            <View style={styles.postHeader}>
              <Image
                source={item.userAvatar ? { uri: item.userAvatar } : require('../../assets/images/defaultuser.png')}
                style={styles.avatar}
                defaultSource={require('../../assets/images/defaultuser.png')}
              />
              <Text style={styles.username}>{item.username}</Text>
            </View>
            {item.mediaUrls && item.mediaUrls.length > 0 && (
              <Image
                source={{ uri: item.mediaUrls[0] }}
                style={styles.postImage}
                defaultSource={require('../../assets/images/defaultuser.png')}
              />
            )}
            <Text style={styles.caption}>{item.caption}</Text>
            {item.hashtags && (
              <View style={styles.hashtagRow}>
                {item.hashtags.map((tag: any) => (
                  <Text key={tag} style={styles.hashtag}>#{tag}</Text>
                ))}
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.postWrapper}>
        {PostComponent}
        <View style={styles.socialRow}>
          <TouchableOpacity onPress={() => handleLikePress(item.id)} style={styles.actionBtn}>
            <Icon name={isLiked ? 'heart' : 'heart-o'} size={24} color={isLiked ? '#FF4C61' : '#888'} />
            <Text style={[styles.actionText, { color: isLiked ? '#FF4C61' : '#888' }]}>{likeCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleComment(item)} style={styles.actionBtn}>
            <Icon name="comment-o" size={24} color="#888" />
            <Text style={styles.actionText}>{item.commentCount || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleShare(item)}>
            <Icon name="share" size={22} color="#888" style={styles.socialIcon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleBookmark(item.id)} style={{ marginLeft: 'auto' }}>
            <Icon name={bookmarked[item.id] ? 'bookmark' : 'bookmark-o'} size={24} color={bookmarked[item.id] ? '#FFD700' : '#888'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Animated header
  const headerTranslate = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -80],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.animatedHeader, { transform: [{ translateY: headerTranslate }] }]}>
        <View style={styles.searchRow}>
          <Icon name="search" size={18} color={colors.darkGray} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm món ăn, người dùng..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <View style={[styles.filterRow, { justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              style={[styles.filterBtn, filterMode === 'type' && styles.filterBtnActive]}
              onPress={() => setFilterMode('type')}
            >
              <Text style={[styles.filterText, filterMode === 'type' && styles.filterTextActive]}>Lọc theo thể loại</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterBtn, filterMode === 'category' && styles.filterBtnActive]}
              onPress={() => setFilterMode('category')}
            >
              <Text style={[styles.filterText, filterMode === 'category' && styles.filterTextActive]}>Lọc theo danh mục</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={SORT_OPTIONS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.key}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.filterBtn, sortBy === item.key && styles.filterBtnActive]}
                onPress={() => setSortBy(item.key)}
              >
                <Text style={[styles.filterText, sortBy === item.key && styles.filterTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
        {filterMode === 'type' ? (
          <FlatList
            data={POST_TYPES}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.key}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.filterBtn, selectedPostType === item.key && styles.filterBtnActive]}
                onPress={() => setSelectedPostType(item.key)}
              >
                <Text style={[styles.filterText, selectedPostType === item.key && styles.filterTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            )}
            style={{ marginLeft: 8, marginBottom: 2 }}
          />
        ) : (
          <View style={{ marginLeft: 8, marginBottom: 2 }}>
            <TouchableOpacity style={[
              styles.filterBtn,
              { flexDirection: 'row', alignItems: 'center', minWidth: 120 },
              selectedCategory !== 'all' && styles.filterBtnActive
            ]}
              onPress={() => setCategoryModalVisible(true)}
            >
              <Text style={[
                styles.filterText,
                { flex: 1 },
                selectedCategory !== 'all' && { color: '#fff', fontWeight: 'bold' }
              ]}>
                {categories.find(c => c.categoryId === selectedCategory)?.name || 'Chọn danh mục'}
              </Text>
              <Icon
                name="chevron-down"
                size={14}
                color={selectedCategory !== 'all' ? '#fff' : '#888'}
                style={{ marginLeft: 6 }} />
            </TouchableOpacity>
            <Modal
              visible={categoryModalVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setCategoryModalVisible(false)}
            >
              <Pressable style={styles.modalOverlay} onPress={() => setCategoryModalVisible(false)}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Chọn danh mục</Text>
                  <ScrollView style={{ maxHeight: 300 }}>
                    {categories.map((item: Category) => (
                      <TouchableOpacity
                        key={item.categoryId}
                        style={[styles.modalOption, selectedCategory === item.categoryId && styles.modalOptionActive]}
                        onPress={() => {
                          setSelectedCategory(item.categoryId);
                          setCategoryModalVisible(false);
                        }}
                      >
                        <Text style={[styles.modalOptionText, selectedCategory === item.categoryId && styles.modalOptionTextActive]}>
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </Pressable>
            </Modal>
          </View>
        )}
      </Animated.View>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary || '#FF4C61'} style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.emptyText}>{error}</Text>
      ) : (
        <Animated.FlatList
          data={filteredPosts}
          keyExtractor={item => item.id}
          renderItem={renderPost} contentContainerStyle={{ paddingTop: 200, paddingBottom: 24 }}
          ListEmptyComponent={<Text style={styles.emptyText}>Không tìm thấy bài viết phù hợp.</Text>}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  }, 
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    zIndex: 999,
    paddingTop: 24,
    paddingBottom: 8,
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary || '#FF4C61',
    marginLeft: 20,
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    color: colors.text,
    backgroundColor: 'transparent',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 2,
    marginHorizontal: 8,
  },
  filterBtn: {
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 4,
  },
  filterBtnActive: {
    backgroundColor: colors.primary || '#FF4C61',
  },
  filterText: {
    color: '#333',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  postWrapper: {
    marginBottom: 18,
    marginHorizontal: 0,
  },
  postContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 18,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  }, 
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#f2f2f2',
    resizeMode: 'cover',
  },
  username: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
  },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 8,
    marginTop: 2,
    backgroundColor: '#f8f8f8',
  },
  caption: {
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
  },
  hashtagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  hashtag: {
    color: colors.primary || '#FF4C61',
    fontSize: 13,
    marginRight: 8,
    fontWeight: '500',
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginHorizontal: 24,
    justifyContent: 'space-between',
  },
  socialIcon: {
    marginRight: 10,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  actionText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    minWidth: 260,
    elevation: 5,
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.primary || '#FF4C61',
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  modalOptionActive: {
    backgroundColor: colors.primary || '#FF4C61',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  modalOptionTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
