import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, Alert } from 'react-native';
import { colors } from '../../utils/colors';
import { getPosts, isPostFavorited, toggleFavoritePost } from '../../services/postServices';
import Icon from 'react-native-vector-icons/FontAwesome';
import moment from 'moment';
import 'moment/locale/vi';
import RecipePost from '../../components/user/RecipePost';
import ReviewPost from '../../components/user/ReviewPost';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from '@react-native-firebase/firestore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/stackparamlist';
import { usePostContext } from '../../components/context/PostContext';

function PostItem({ post }: { post: any }) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(true);
  const [showFullCaption, setShowFullCaption] = React.useState(false);
  const [showLoginModal, setShowLoginModal] = React.useState(false);
  const CAPTION_LIMIT = 150;
  
  // Use the post context for likes
  const { likedPosts, likeCounts, toggleLike } = usePostContext();

  moment.locale('vi');

  // Handle post press to navigate to detail
  const handlePostPress = () => {
    navigation.navigate('PostDetail', { postId: post.id });
  };  // Kiểm tra trạng thái like và favorite khi component được tạo
  React.useEffect(() => {
    // Kiểm tra xem bài đăng có được yêu thích không
    const checkFavoriteStatus = async () => {
      try {
        const favorited = await isPostFavorited(post.id);
        setIsFavorite(favorited);
      } catch (error) {
        console.error("Error checking favorite status:", error);
      }
    };
    
    checkFavoriteStatus();
    
    // Note: We don't need to check like status here anymore as it's handled by the PostContext
  }, [post.id]);  // Xử lý khi người dùng nhấn nút like - Using PostContext now
  const handleLike = async () => {
    try {
      const currentUser = getAuth().currentUser;
      if (!currentUser) {
        setShowLoginModal(true);
        return; // Người dùng chưa đăng nhập
      }
      
      // Use the toggleLike function from context to handle the like operation
      await toggleLike(post.id);
      
    } catch (error) {
      console.error("Error toggling like:", error);
      Alert.alert("Lỗi", "Không thể thực hiện thao tác này");
    }
  };

  // Xử lý khi người dùng nhấn nút favorite
  const handleFavorite = async () => {
    try {
      const currentUser = getAuth().currentUser;
      if (!currentUser) {
        setShowLoginModal(true);
        return; // Người dùng chưa đăng nhập
      }
      
      await toggleFavoritePost(post.id, !isFavorite);
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleHide = () => {
    setIsVisible(false);
  };

  const renderCaption = () => {
    if (!post.caption) return null;
    
    const shouldTruncate = post.caption.length > CAPTION_LIMIT;
    const displayedText = shouldTruncate && !showFullCaption 
      ? post.caption.slice(0, CAPTION_LIMIT) + '...'
      : post.caption;

    return (
      <View>
        <Text style={styles.caption}>{displayedText}</Text>
        {shouldTruncate && (
          <TouchableOpacity 
            onPress={() => setShowFullCaption(!showFullCaption)}
            style={styles.readMoreButton}
          >
            <Text style={styles.readMoreText}>
              {showFullCaption ? 'Thu gọn' : 'Xem thêm'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderPostContent = () => {
    if (post.postType === 'review' && post.reviewDetails) {
      return <ReviewPost 
        reviewDetails={post.reviewDetails} 
        caption={post.caption}
        location={post.location}
      />;
    }
    if (post.postType === 'recipe' && post.recipeDetails) {
      return <RecipePost recipeDetails={post.recipeDetails} caption={post.caption} />;
    }
    // Mặc định cho post thường hoặc các loại khác
    return renderCaption();
  };

  if (!isVisible) return null;

  return (
    <View style={styles.postContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={{ uri: post.userAvatar || require('../../assets/images/defaultuser.png') }} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.username}>{post.username || 'User'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.time}>{post.createdAt ? moment(post.createdAt.seconds ? post.createdAt.seconds * 1000 : post.createdAt).fromNow() : ''} · </Text>
            <Icon name="globe" size={12} color={colors.darkGray} />
          </View>
        </View>
        <TouchableOpacity style={styles.hideBtn} onPress={handleHide}>
          <Icon name="close" size={20} color={colors.darkGray} />
        </TouchableOpacity>
      </View>
      {/* Nội dung post tuỳ loại */}
      {renderPostContent()}
      {/* Hashtag */}
      {post.hashtags && post.hashtags.length > 0 && (
        <Text style={styles.hashtag}>#{post.hashtags[0]}</Text>
      )}
      <TouchableOpacity onPress={handlePostPress}>
        {/* Image */}
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <Image source={{ uri: post.mediaUrls[0] }} style={styles.postImage} resizeMode="cover" />
        )}
      </TouchableOpacity>
      {/* Action bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <Icon name={likedPosts[post.id] ? 'heart' : 'heart-o'} size={22} color="#FF4C61" />
          <Text style={[styles.actionText, { color: '#FF4C61', fontWeight: 'bold' }]}>{likeCounts[post.id] || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handlePostPress}>
          <Icon name="comment-o" size={22} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary, fontWeight: 'bold' }]}>{post.commentCount || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Icon name="share" size={22} color={colors.text} />
          {/* Always wrap any text or space in <Text> */}
          <Text style={[styles.actionText, { color: colors.text }]}>{' '}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn1} onPress={handleFavorite}>
          <Icon name={isFavorite ? 'bookmark' : 'bookmark-o'} size={22} color={isFavorite ? '#FFD700' : colors.primary} />
          {/* Always wrap any text or space in <Text> */}
          <Text style={[styles.actionText, { color: isFavorite ? '#FFD700' : colors.primary }]}>{' '}</Text>
        </TouchableOpacity>
      </View>
      {/* Modal thông báo đăng nhập */}
      <Modal
        visible={showLoginModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLoginModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowLoginModal(false)}
            >
              <Icon name="close" size={18} color={colors.darkGray} />
            </TouchableOpacity>
            <Icon name="exclamation-circle" size={40} color={colors.primary} style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Yêu cầu đăng nhập</Text>
            <Text style={styles.modalText}>Vui lòng đăng nhập để tương tác với bài đăng.</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowLoginModal(false);
                navigation.navigate('Login');
              }}
            >
              <Text style={styles.modalButtonText}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function HomeScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { initializePostStates } = usePostContext();

  // Only call fetchPosts on mount
  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đảm bảo KHÔNG có bất kỳ useFocusEffect hoặc callback nào gọi fetchPosts hoặc onRefresh ở đây!
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await getPosts();
      console.log(`Fetched ${data.length} posts`);
      setPosts(data);
      // Initialize post states with the fetched data
      initializePostStates(data);
    } catch (error) {
      // Convert error to string to avoid direct rendering of error objects
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error fetching posts:", errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await getPosts();
      console.log(`Refreshed ${data.length} posts`);
      setPosts(data);
      // Re-initialize post states with refreshed data
      initializePostStates(data);
    } catch (error) {
      // Convert error to string to avoid direct rendering of error objects
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error refreshing posts:", errorMessage);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <PostItem post={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  postContainer: {
    backgroundColor: '#fff',
    marginBottom: 18,
    borderRadius: 20,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  favoriteBtn: {
    padding: 6,
    marginLeft: 6,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: colors.lightGray,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  username: {
    fontWeight: '600',
    color: colors.text,
    fontSize: 16,
    marginBottom: 2,
  },
  time: {
    color: colors.darkGray,
    fontSize: 13,
  },
  caption: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 4,
    marginHorizontal: 16,
    marginTop: 12,
  },
  hashtag: {
    color: colors.hashtag,
    fontSize: 14,
    marginBottom: 8,
    marginHorizontal: 16,
    fontWeight: '500',
  },
  postImage: {
    width: '100%',
    height: 300,
    backgroundColor: colors.lightGray,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  actionBtn1: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  hideBtn: {
    padding: 6,
    marginLeft: 6,
  },
  readMoreButton: {
    marginLeft: 16,
    marginBottom: 8,
  },
  readMoreText: {
    color: colors.primary,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 6,
  },
  modalIcon: {
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
