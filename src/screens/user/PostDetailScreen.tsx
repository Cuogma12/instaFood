import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView,
  Share
} from 'react-native';
import { colors } from '../../utils/colors';
import Icon from 'react-native-vector-icons/FontAwesome';
import { getPostById, toggleLikePost, isPostLiked, toggleFavoritePost, isPostFavorited } from '../../services/postServices';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../types/stackparamlist';
import { formatTimeAgo } from '../../utils/dateUtils';
import { getAuth } from '@react-native-firebase/auth';
import RecipePost from '../../components/user/RecipePost';
import ReviewPost from '../../components/user/ReviewPost';

type PostDetailRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;

const PostDetailScreen = () => {
  const route = useRoute<PostDetailRouteProp>();
  const { postId } = route.params;
  const navigation = useNavigation();

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Lấy thông tin bài đăng
  useEffect(() => {
    const fetchPostDetail = async () => {
      try {
        const postData = await getPostById(postId);
        if (postData) {
          setPost(postData);
          setLikeCount(postData.likes ? postData.likes.length : 0);
          
          // Kiểm tra trạng thái like và favorite
          const currentUser = getAuth().currentUser;
          if (currentUser && postData.likes) {
            setIsLiked(postData.likes.includes(currentUser.uid));
          }
          
          const favorited = await isPostFavorited(postId);
          setIsFavorite(favorited);
        }
      } catch (error) {
        console.error("Error fetching post details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPostDetail();
  }, [postId]);

  // Xử lý khi người dùng nhấn nút thích
  const handleLike = async () => {
    try {
      const currentUser = getAuth().currentUser;
      if (!currentUser) {
        setShowLoginModal(true);
        return; // Người dùng chưa đăng nhập
      }

      const result = await toggleLikePost(postId);
      if (result.success) {
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  // Xử lý khi người dùng nhấn nút yêu thích
  const handleFavorite = async () => {
    try {
      const currentUser = getAuth().currentUser;
      if (!currentUser) {
        setShowLoginModal(true);
        return;
      }

      await toggleFavoritePost(postId, !isFavorite);
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  // Xử lý chia sẻ bài đăng
  const handleShare = async () => {
    try {
      const message = `Xem bài đăng "${post.caption?.substring(0, 50)}..." trên InstaFood`;
      await Share.share({
        message,
        // Có thể thêm URL chia sẻ nếu có
      });
    } catch (error) {
      console.error("Error sharing post:", error);
    }
  };

  // Hiển thị nội dung bài đăng tùy theo loại
  const renderPostContent = () => {
    if (!post) return null;
    
    if (post.postType === 'recipe' && post.recipeDetails) {
      return <RecipePost recipeDetails={post.recipeDetails} caption={post.caption} />;
    } else if (post.postType === 'review' && post.reviewDetails) {
      return <ReviewPost 
        reviewDetails={post.reviewDetails} 
        caption={post.caption}
        location={post.location}
      />;
    } else {
      return (
        <View>
          <Text style={styles.caption}>{post.caption}</Text>
          {post.hashtags && post.hashtags.length > 0 && (
            <Text style={styles.hashtag}>#{post.hashtags.join(' #')}</Text>
          )}
        </View>
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết bài đăng</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.errorContainer}>
          <Icon name="exclamation-circle" size={60} color={colors.lightGray} />
          <Text style={styles.errorText}>Không tìm thấy bài đăng</Text>
          <Text style={styles.errorSubText}>Bài đăng có thể đã bị xóa hoặc không tồn tại</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết bài đăng</Text>
        <View style={{ width: 22 }} />
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.postContainer}>
          {/* User header */}
          <View style={styles.userHeader}>
            <Image 
              source={{ uri: post.userAvatar || require('../../assets/images/defaultuser.png') }} 
              style={styles.avatar} 
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.username}>{post.username || 'User'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.time}>
                  {formatTimeAgo(post.createdAt)} · 
                </Text>
                <Icon name="globe" size={12} color={colors.darkGray} style={{ marginLeft: 4 }} />
              </View>
            </View>
          </View>
          
          {/* Post content */}
          <View style={styles.contentContainer}>
            {renderPostContent()}
          </View>
          
          {/* Post media */}
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <Image 
              source={{ uri: post.mediaUrls[0] }} 
              style={styles.mediaImage} 
              resizeMode="cover" 
            />
          )}
          
          {/* Action buttons */}
          <View style={styles.actionBar}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
              <Icon 
                name={isLiked ? 'heart' : 'heart-o'} 
                size={22} 
                color="#FF4C61" 
              />
              <Text style={[styles.actionText, { color: '#FF4C61' }]}>
                {likeCount}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionBtn}>
              <Icon name="comment-o" size={22} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>
                {post.commentCount || 0}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <Icon name="share" size={22} color={colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionBtnRight} onPress={handleFavorite}>
              <Icon 
                name={isFavorite ? 'bookmark' : 'bookmark-o'} 
                size={22} 
                color={isFavorite ? '#FFD700' : colors.primary} 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Comments section */}
        <View style={styles.commentsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bình luận</Text>
          </View>
          
          {/* Comment list - phần này sẽ được mở rộng sau */}
          <View style={styles.noComments}>
            <Icon name="comments-o" size={40} color={colors.lightGray} />
            <Text style={styles.noCommentsText}>Chưa có bình luận nào</Text>
            <Text style={styles.noCommentsSubText}>Hãy là người đầu tiên bình luận</Text>
          </View>
        </View>
      </ScrollView>

      {/* Login Modal */}
      {showLoginModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowLoginModal(false)}
            >
              <Icon name="close" size={18} color={colors.darkGray} />
            </TouchableOpacity>
            <Icon name="exclamation-circle" size={40} color={colors.primary} style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Yêu cầu đăng nhập</Text>
            <Text style={styles.modalText}>Vui lòng đăng nhập để thích và lưu bài viết vào mục yêu thích.</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowLoginModal(false);
                navigation.navigate('Login' as never);
              }}
            >
              <Text style={styles.modalButtonText}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubText: {
    fontSize: 14,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    height: 65,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  postContainer: {
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  contentContainer: {
    padding: 16,
  },
  caption: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  hashtag: {
    color: colors.hashtag,
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  mediaImage: {
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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  actionBtnRight: {
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
  commentsSection: {
    backgroundColor: '#fff',
    marginBottom: 40,
  },
  sectionHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  noComments: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noCommentsText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  noCommentsSubText: {
    fontSize: 14,
    color: colors.darkGray,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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

export default PostDetailScreen;