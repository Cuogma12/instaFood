import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Modal,
  Share,
  Alert
} from 'react-native';
import { colors } from '../../utils/colors';
import Icon from 'react-native-vector-icons/FontAwesome';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFirestore, collection, doc, getDoc, query, where, orderBy, getDocs } from '@react-native-firebase/firestore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../types/stackparamlist';
import { UserProfile } from '../../types/user';
import { Post, ProfilePost } from '../../types/post';
import useAuth from '../../hooks/useAuth';
import AuthRequired from '../../components/auth/AuthRequired';
import RecipePost from '../../components/user/RecipePost';
import ReviewPost from '../../components/user/ReviewPost';
import { getFavoritePostsDetails, toggleFavoritePost, isPostFavorited } from '../../services/postServices';
import { usePostContext } from '../../components/context/PostContext';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width / 3;
const ITEM_HEIGHT = 1.5*ITEM_WIDTH;

// Mở rộng kiểu ProfileScreenNavigationProp để bao gồm phương thức jumpTo
type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList> & {
  jumpTo?: (name: string, params?: object) => void;
};

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { isAuthenticated, authChecked, user } = useAuth();
  const { likedPosts, likeCounts, toggleLike, initializePostStates } = usePostContext();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [favoritePosts, setFavoritePosts] = useState<ProfilePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'detail' | 'feed'>('detail'); // Chế độ xem: chi tiết hoặc feed
  const [initialScrollIndex, setInitialScrollIndex] = useState(0); // Vị trí scroll ban đầu trong FlatList
  const [activeTab, setActiveTab] = useState<'posts' | 'favorites'>('posts'); // Tab đang hiển thị: bài đăng hoặc yêu thích
  const [favoriteStates, setFavoriteStates] = useState<{ [key: string]: boolean }>({});
  const db = getFirestore();

  const fetchUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userDocRef = doc(db, 'Users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.data();

      if (userData) {
        setUserProfile({
          username: userData.username || '',
          displayName: userData.displayName || '',
          posts: userData.posts || 0,
          followers: userData.followers || 0,
          following: userData.following || 0,
          avatar: userData.photoURL || null,
          bio: userData.bio || 'no bio yet',
        });
      }

      const postsRef = collection(db, 'Posts');
      const postsQuery = query(
        postsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const postsSnapshot = await getDocs(postsQuery);

      const userPosts = postsSnapshot.docs.map((doc) => {
        const postData = doc.data();
        return {
          id: doc.id,
          ...postData,
          imageUrl: 
            postData.mediaUrls && postData.mediaUrls.length > 0
              ? postData.mediaUrls[0]
              : `https://picsum.photos/200/200?random=${Math.random()}`,
        };
      });

      setPosts(userPosts);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
    }
  };

  // Tải danh sách bài đăng yêu thích
  const fetchFavoritePosts = async () => {
    if (!user) return;
    
    try {
      setLoadingFavorites(true);
      const favoritePostsData = await getFavoritePostsDetails();
      
      const formattedFavoritePosts = favoritePostsData.map((post: any) => ({
        id: post.id,
        ...post,
        imageUrl: post.mediaUrls && post.mediaUrls.length > 0
          ? post.mediaUrls[0]
          : `https://picsum.photos/200/200?random=${Math.random()}`
      }));
      
      setFavoritePosts(formattedFavoritePosts);
      setLoadingFavorites(false);
    } catch (error) {
      console.error('Error fetching favorite posts:', error);
      setLoadingFavorites(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
      return () => {
        // Cleanup nếu cần
      };
    }, [user])
  );

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  // Tải danh sách bài đăng yêu thích khi chuyển tab
  useEffect(() => {
    if (activeTab === 'favorites' && user) {
      fetchFavoritePosts();
    }
  }, [activeTab, user]);

  // Initialize favoriteStates for posts in modal feed
  useEffect(() => {
    const initializeFavorites = async () => {
      let allPosts = activeTab === 'posts' ? posts : favoritePosts;
      const states: { [key: string]: boolean } = {};
      for (const post of allPosts) {
        try {
          states[post.id] = await isPostFavorited(post.id);
        } catch (e) {
          states[post.id] = false;
        }
      }
      setFavoriteStates(states);
    };
    if (modalVisible && viewMode === 'feed') {
      initializeFavorites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalVisible, viewMode, posts, favoritePosts, activeTab]);

  // Handle favorite/bookmark toggle
  const handleFavorite = async (postId: string) => {
    try {
      const current = favoriteStates[postId] || false;
      await toggleFavoritePost(postId, !current);
      setFavoriteStates((prev) => ({ ...prev, [postId]: !current }));
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái yêu thích.');
    }
  };

  // Handle share
  const handleShare = async (item: any) => {
    try {
      const message = `${item.caption?.substring(0, 50) || ''}\n${item.mediaUrls && item.mediaUrls[0] ? item.mediaUrls[0] : ''}`;
      await Share.share({ message });
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chia sẻ bài viết.');
    }
  };

  const navigateToCreatePost = () => {
    navigation.navigate('MainApp', { screen: 'CreatePost' });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{userProfile?.username || 'Trang cá nhân'}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity style={{ marginRight: 15 }}>
          <Icon name="plus-square" size={24} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity onPress ={() => navigation.navigate('SettingScreen')}>
          <Icon name="bars" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProfileInfo = () => (
    <View style={styles.profileInfo}>
      <View style={styles.avatarContainer}>
        <Image
          source={userProfile?.avatar ? { uri: userProfile.avatar } : require('../../assets/images/defaultuser.png')}
          style={styles.avatarImage}
        />
        <Text style={styles.bioText}>{userProfile?.bio || 'Chưa có giới thiệu'}</Text>
      </View>
      <View style={styles.userInfoContainer}>
        <Text style={styles.displayName}>{userProfile?.displayName || 'Chưa đặt tên'}</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userProfile?.posts || 0}</Text>
            <Text style={styles.statLabel}>Bài viết</Text>
          </View>
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statNumber}>{userProfile?.followers || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statNumber}>{userProfile?.following || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderActions = () => (
    <View style={styles.actionsContainer}>
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => navigation.navigate('EditProfile')}
      >
        <Text style={styles.editButtonText}>Chỉnh sửa</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.shareButton}>
        <Icon name="user-plus" size={20} color={colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity 
        style={[styles.tabItem, activeTab === 'posts' && styles.activeTabItem]}
        onPress={() => setActiveTab('posts')}
      >
        <Icon name="th" size={22} color={activeTab === 'posts' ? colors.primary : colors.text} />
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tabItem, activeTab === 'favorites' && styles.activeTabItem]}
        onPress={() => setActiveTab('favorites')}
      >
        <Icon name="bookmark" size={22} color={activeTab === 'favorites' ? colors.primary : colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderPostItem = ({ item, index }: { item: ProfilePost; index: number }) => (
    <TouchableOpacity 
      style={styles.postItem}
      onPress={() => {
        setSelectedPost(item as unknown as Post);
        setInitialScrollIndex(index); // Lưu vị trí của bài đăng được nhấn
        setViewMode('detail'); // Bắt đầu ở chế độ chi tiết
        setModalVisible(true);
      }}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.postImage}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  const renderModalPostItem = ({ item }: { item: Post }) => {
    return (
      <View style={styles.modalPostItem}>
        {/* Header của post */}
        <View style={styles.modalPostHeader}>
          <Image 
            source={userProfile?.avatar ? { uri: userProfile.avatar } : require('../../assets/images/defaultuser.png')}
            style={styles.modalPostAvatar}
          />
          <Text style={styles.modalPostUsername}>{userProfile?.username}</Text>
        </View>

        {/* Ảnh bài đăng */}
        {item.mediaUrls && item.mediaUrls.length > 0 && (
          <Image 
            source={{ uri: item.mediaUrls[0] }} 
            style={styles.modalPostImage}
            resizeMode="cover"
          />
        )}

        {/* Caption (giới hạn 2 dòng) */}
        <View style={styles.modalPostCaption}>
          <Text style={styles.modalPostText} numberOfLines={2} ellipsizeMode="tail">
            {item.caption}
          </Text>
        </View>

        {/* Nút tương tác đồng bộ với HomeScreen */}
        <View style={styles.modalPostActions}>
          <TouchableOpacity 
            style={styles.modalPostAction}
            onPress={() => toggleLike(item.id)}
          >
            <Icon 
              name={likedPosts[item.id] ? 'heart' : 'heart-o'} 
              size={20} 
              color={likedPosts[item.id] ? '#FF4C61' : colors.text} 
            />
            <Text style={{ marginLeft: 4, fontSize: 14, color: likedPosts[item.id] ? '#FF4C61' : colors.text, fontWeight: likedPosts[item.id] ? 'bold' : 'normal' }}>
              {likeCounts[item.id] || 0}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.modalPostAction}
            onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
          >
            <Icon name="comment-o" size={20} color={colors.primary} />
            <Text style={{ marginLeft: 4, fontSize: 14, color: colors.primary, fontWeight: 'bold' }}>
              {item.commentCount || 0}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.modalPostAction}
            onPress={() => handleShare(item)}
          >
            <Icon name="share" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.modalPostAction}
            onPress={() => handleFavorite(item.id)}
          >
            <Icon 
              name={favoriteStates && favoriteStates[item.id] ? 'bookmark' : 'bookmark-o'} 
              size={20} 
              color={favoriteStates && favoriteStates[item.id] ? '#FFD700' : colors.primary} 
            />
          </TouchableOpacity>
        </View>

        {/* Nút xem chi tiết */}
        <TouchableOpacity 
          style={styles.viewDetailButton}
          onPress={() => {
            setSelectedPost(item);
            setViewMode('detail');
          }}
        >
          <Text style={styles.viewDetailText}>Xem chi tiết</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderPosts = () => {
    // Hiển thị bài đăng thông thường
    if (activeTab === 'posts') {
      if (loading) {
        return (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        );
      }

      if (posts.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Icon name="camera" size={50} color={colors.lightGray} />
            <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={navigateToCreatePost}
            >
              <Text style={styles.emptyButtonText}>Tạo bài viết đầu tiên</Text>
            </TouchableOpacity>
          </View>
        );
      }

      return (
        <FlatList
          data={posts}
          renderItem={renderPostItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          scrollEnabled={false}
          style={styles.postsGrid}
        />
      );
    }
    // Hiển thị bài đăng yêu thích
    else {
      if (loadingFavorites) {
        return (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        );
      }

      if (favoritePosts.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Icon name="heart" size={50} color={colors.lightGray} />
            <Text style={styles.emptyText}>Chưa có bài viết yêu thích nào</Text>
          </View>
        );
      }

      return (
        <FlatList
          data={favoritePosts}
          renderItem={renderPostItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          scrollEnabled={false}
          style={styles.postsGrid}
        />
      );
    }
  };

  return (
    <AuthRequired
      authChecked={authChecked}
      isAuthenticated={isAuthenticated}
      message="Vui lòng đăng nhập để xem thông tin cá nhân"
    >
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <ScrollView showsVerticalScrollIndicator={false}>
          {renderProfileInfo()}
          {renderActions()}
          {renderTabs()}
          <View style={styles.content}>{renderPosts()}</View>
        </ScrollView>

        {/* Modal chi tiết bài đăng */}
        <Modal
          visible={modalVisible}
          transparent={false}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <SafeAreaView style={styles.modalFullContainer}>
            <View style={styles.modalContent}>
              {/* Header modal */}
              <View style={styles.modalHeader}>
                <View style={styles.modalUser}>
                  <Image 
                    source={userProfile?.avatar ? { uri: userProfile.avatar } : require('../../assets/images/defaultuser.png')}
                    style={styles.modalAvatar}
                  />
                  <Text style={styles.modalUsername}>{userProfile?.username}</Text>
                </View>
                <View style={styles.modalHeaderActions}>
                  {/* Nút chuyển chế độ xem */}
                  <TouchableOpacity 
                    style={[
                      styles.viewModeButton, 
                      viewMode === 'feed' ? styles.activeViewModeButton : null
                    ]}
                    onPress={() => setViewMode('feed')}
                  >
                    <Icon name="list" size={18} color={viewMode === 'feed' ? colors.primary : colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.viewModeButton, 
                      viewMode === 'detail' ? styles.activeViewModeButton : null
                    ]}
                    onPress={() => setViewMode('detail')}
                  >
                    <Icon name="info-circle" size={18} color={viewMode === 'detail' ? colors.primary : colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={() => setModalVisible(false)}
                  >
                    <Icon name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Body modal - Chi tiết bài đăng */}
              {viewMode === 'detail' && selectedPost && (
                <ScrollView style={styles.modalBody}>
                  {/* Carousel ảnh */}
                  {selectedPost.mediaUrls && selectedPost.mediaUrls.length > 0 && (
                    <ScrollView 
                      horizontal 
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      style={styles.imageCarousel}
                    >
                      {selectedPost.mediaUrls.map((url, index) => (
                        <Image 
                          key={`media-${index}`} 
                          source={{ uri: url }}
                          style={styles.carouselImage}
                          resizeMode="cover"
                        />
                      ))}
                    </ScrollView>
                  )}

                  {/* Các nút tương tác */}
                  <View style={styles.interactionButtons}>
                    <TouchableOpacity style={styles.interactionButton}>
                      <Icon name="heart-o" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.interactionButton}>
                      <Icon name="comment-o" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.interactionButton}>
                      <Icon name="share" size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>

                  {/* Nội dung bài đăng */}
                  <View style={styles.postContent}>
                    {/* Hiển thị nội dung theo loại bài đăng */}
                    {selectedPost.postType === 'general' && (
                      <Text style={styles.caption}>{selectedPost.caption}</Text>
                    )}

                    {selectedPost.postType === 'recipe' && selectedPost.recipeDetails && (
                      <RecipePost 
                        recipeDetails={{
                          recipeName: selectedPost.recipeDetails.title || 'Công thức món ăn',
                          ingredients: selectedPost.recipeDetails.ingredients || [],
                          instructions: selectedPost.recipeDetails.instructions || []
                        }} 
                        caption={selectedPost.caption}
                      />
                    )}

                    {selectedPost.postType === 'review' && selectedPost.reviewDetails && (
                      <ReviewPost 
                        reviewDetails={selectedPost.reviewDetails} 
                        caption={selectedPost.caption}
                      />
                    )}

                    {/* Hashtags */}
                    {selectedPost.hashtags && selectedPost.hashtags.length > 0 && (
                      <View style={styles.hashtagsContainer}>
                        {selectedPost.hashtags.map((tag, index) => (
                          <Text key={`tag-${index}`} style={styles.hashtag}>#{tag}</Text>
                        ))}
                      </View>
                    )}

                    {/* Thời gian đăng */}
                    {selectedPost.createdAt && (
                      <Text style={styles.timestamp}>
                        {selectedPost.createdAt instanceof Date
                          ? selectedPost.createdAt.toLocaleDateString()
                          : new Date(selectedPost.createdAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </ScrollView>
              )}

              {/* Body modal - Danh sách bài đăng */}
              {viewMode === 'feed' && (
                <FlatList
                  data={activeTab === 'posts' ? posts as unknown as Post[] : favoritePosts as unknown as Post[]}
                  renderItem={renderModalPostItem}
                  keyExtractor={(item) => item.id}
                  initialScrollIndex={initialScrollIndex}
                  getItemLayout={(data, index) => ({
                    length: 350, // Chiều cao ước tính của mỗi mục
                    offset: 350 * index,
                    index,
                  })}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.feedContainer}
                />
              )}
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </AuthRequired>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 15,
    height: 65,
    justifyContent: 'space-between',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginLeft: 8,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingBottom: 10,
  },
  avatarContainer: {
    alignItems: 'center',
    marginRight: 15,
    width: 90,
  },
  userInfoContainer: {
    flex: 1,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: colors.lightGray,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.darkGray,
    marginTop: 2,
  },
  displayName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 5,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 15,
    marginTop: 5,
  },
  editButton: {
    flex: 1,
    backgroundColor: colors.background,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  editButtonText: {
    color: colors.text,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  shareButton: {
    backgroundColor: colors.background,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingBottom: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTabItem: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  content: {
    flex: 1,
  },
  postsGrid: {
    flex: 1,
  },
  postItem: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    padding: 1,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  bioText: {
    fontSize: 12,
    color: colors.darkGray,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 90,
    flexWrap: 'wrap',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    height: 300,
  },
  emptyText: {
    fontSize: 16,
    color: colors.darkGray,
    marginTop: 10,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  modalFullContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    backgroundColor: colors.primary,
  },
  modalUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  modalUsername: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewModeButton: {
    padding: 8,
    marginHorizontal: 5,
    borderRadius: 5,
  },
  activeViewModeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  closeButton: {
    padding: 8,
    marginLeft: 5,
  },
  modalBody: {
    padding: 10,
    flex: 1,
  },
  imageCarousel: {
    marginBottom: 10,
  },
  carouselImage: {
    width: Dimensions.get('window').width * 0.9,
    height: width * 0.9,
    borderRadius: 10,
  },
  interactionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  interactionButton: {
    padding: 10,
  },
  postContent: {
    marginTop: 10,
  },
  caption: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 10,
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  hashtag: {
    fontSize: 12,
    color: colors.primary,
    marginRight: 5,
  },
  timestamp: {
    fontSize: 12,
    color: colors.darkGray,
    marginTop: 10,
  },
  modalPostItem: {
    marginVertical: 10,
    marginHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  modalPostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  modalPostUsername: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalPostImage: {
    width: '100%',
    height: width * 0.6,
  },
  modalPostCaption: {
    padding: 15,
  },
  modalPostText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  modalPostActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.lightGray,
  },
  modalPostAction: {
    padding: 10,
  },
  viewDetailButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 5,
    marginHorizontal: 15,
    marginVertical: 15,
  },
  viewDetailText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
  },
  feedContainer: {
    paddingVertical: 10,
  },
});