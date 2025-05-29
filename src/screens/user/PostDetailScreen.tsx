import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView,
  Share,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  FlatList,
  Alert,
  Modal
} from 'react-native';
import { colors } from '../../utils/colors';
import Icon from 'react-native-vector-icons/FontAwesome';
import { getPostById, toggleFavoritePost, isPostFavorited } from '../../services/postServices';
import { usePostContext } from '../../components/context/PostContext';
import { addComment, getComments, deleteComment, updateComment } from '../../services/commentServices';
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
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Use the PostContext for likes
  const { likedPosts, likeCounts, toggleLike, initializePostStates } = usePostContext();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [selectedComment, setSelectedComment] = useState<any>(null);
  const [showCommentMenu, setShowCommentMenu] = useState(false);
  const [editCommentText, setEditCommentText] = useState('');
  const [showEditCommentModal, setShowEditCommentModal] = useState(false);
  const [editingComment, setEditingComment] = useState<any>(null);
  const currentUser = getAuth().currentUser;

  // Lấy thông tin bài đăng và comments  // Force refresh when component mounts or when postId changes  
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching post data for ID:", postId);
        const postData = await getPostById(postId);
        if (postData) {
          console.log("Post data received:", postData);
          setPost(postData);
          console.log("Comment count from database:", postData.commentCount || 0);
          
          // Initialize post state through context
          initializePostStates([postData]);
          
          const favorited = await isPostFavorited(postId);
          setIsFavorite(favorited);
        }

        // Fetch comments
        await fetchComments();
      } catch (error) {
        // Convert error to string to avoid direct rendering of error objects
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error fetching post details:", errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [postId]); // Remove initializePostStates from dependencies

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      // Get the comments first
      const commentsData = await getComments(postId);
      setComments(commentsData);
      console.log(`[UPDATE] Fetched ${commentsData.length} comments for post ${postId}`);
      
      // If comment count doesn't match, then refresh post data
      if (post && (post.commentCount || 0) !== commentsData.length) {
        console.log(`Refreshing post data due to comment count mismatch`);
        const refreshedPost = await getPostById(postId);
        if (refreshedPost) {
          setPost(refreshedPost);
          // Re-initialize post states with fresh data from the server
          initializePostStates([refreshedPost]);
        }
      }
    } catch (error) {
      // Convert error to string to avoid direct rendering of error objects
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error fetching comments:", errorMessage);
    } finally {
      setLoadingComments(false);
    }
  };// Xử lý khi người dùng nhấn nút thích
  const handleLike = async () => {
    try {
      const currentUser = getAuth().currentUser;
      if (!currentUser) {
        setShowLoginModal(true);
        return; // Người dùng chưa đăng nhập
      }

      console.log(`Attempting to toggle like for post ID: ${postId}`);
      await toggleLike(postId);
      console.log(`Like toggled successfully via Post Context`);
    } catch (error) {
      // Convert error to string to avoid direct rendering of error objects
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error toggling like:", errorMessage);
      Alert.alert("Lỗi", "Không thể thích bài viết này. Vui lòng thử lại sau.");
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
      setIsFavorite(!isFavorite);    } catch (error) {
      // Convert error to string to avoid direct rendering of error objects
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error toggling favorite:", errorMessage);
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

  // Gửi bình luận
  const handleComment = async () => {
    if (!commentText.trim()) return;
    
    const currentUser = getAuth().currentUser;
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }
    
    setIsSubmitting(true);
    try {
      console.log(`Adding comment to post ${postId}`);
      const result = await addComment(postId, commentText.trim());
      if (result.success) {
        setCommentText('');
        Keyboard.dismiss();
        
        // First get the latest post data to ensure consistent comment count
        const refreshedPost = await getPostById(postId);
        if (refreshedPost) {
          console.log(`[UPDATE] Post data refreshed with comment count: ${refreshedPost.commentCount || 0}`);
          setPost(refreshedPost);
        }
        
        // Then update comments list
        await fetchComments();
      } else {
        Alert.alert('Lỗi', 'Không thể thêm bình luận. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      Alert.alert('Lỗi', 'Không thể thêm bình luận. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sửa bình luận
  const handleEditComment = (comment: any) => {
    setShowCommentMenu(false);
    setEditingComment(comment);
    setEditCommentText(comment.content);
    setShowEditCommentModal(true);
  };

  const handleSaveEditComment = async () => {
    if (!editCommentText.trim() || !editingComment) return;
    
    try {
      setIsSubmitting(true);
      const result = await updateComment(editingComment.id, editCommentText.trim());
      if (result.success) {
        setEditCommentText('');
        setEditingComment(null);
        setShowEditCommentModal(false);
        Keyboard.dismiss();
        
        // Refresh comments
        await fetchComments();
      } else {
        Alert.alert('Lỗi', 'Không thể sửa bình luận. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Error editing comment:', error);
      Alert.alert('Lỗi', 'Không thể sửa bình luận. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
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

  const handleEditCommentAction = (comment: any) => {
    setEditingComment(comment);
    setEditCommentText(comment.content);
    setShowEditCommentModal(true);
  };
  const handleDeleteComment = async (comment: any) => {
    setShowCommentMenu(false);
    try {
      await deleteComment(comment.id, comment.postId);
      // Refetch comments after deletion
      await fetchComments();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error deleting comment:", errorMessage);
      Alert.alert("Lỗi", "Không thể xóa bình luận. Vui lòng thử lại sau.");
    }
  };

  const CommentItem = ({ comment }: { comment: any }) => {
    const defaultAvatar = require('../../assets/images/defaultuser.png');
    
    return (
      <View style={styles.commentItem}>
        <Image
          source={comment.userAvatar ? { uri: comment.userAvatar } : defaultAvatar}
          defaultSource={defaultAvatar}
          style={styles.commentAvatar}
        />
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentUsername}>{comment.username || 'Người dùng'}</Text>
            {currentUser && comment.userId === currentUser.uid && (
              <TouchableOpacity
                style={styles.commentMenuButton}
                onPress={() => {
                  setSelectedComment(comment);
                  setShowCommentMenu(true);
                }}
              >
                <Icon name="ellipsis-h" size={18} color={colors.darkGray} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.commentText}>{comment.content}</Text>
          <Text style={styles.commentTime}>
            {comment.createdAt ? formatTimeAgo(comment.createdAt) : ''}
          </Text>
        </View>
      </View>
    );
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
        <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        {/* Main content */}
        <FlatList
          data={comments}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <CommentItem comment={item} />}
          ItemSeparatorComponent={() => <View style={styles.commentSeparator} />}
          contentContainerStyle={{ paddingBottom: 16 }}
          ListHeaderComponent={() => (
            <>
              {/* Existing post content */}
              <View style={styles.postContainer}>
                {/* User header */}
                <View style={styles.userHeader}>
                  <Image 
                    source={post?.userAvatar ? { uri: post.userAvatar } : require('../../assets/images/defaultuser.png')} 
                    style={styles.avatar} 
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.username}>{post?.username || 'User'}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.time}>
                        {post?.createdAt ? formatTimeAgo(post.createdAt) : ''}
                      </Text>
                      <Text style={styles.time}> {'\u00B7'} </Text>
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
                      name={likedPosts[post.id] ? 'heart' : 'heart-o'} 
                      size={22} 
                      color="#FF4C61" 
                    />
                    <Text style={[styles.actionText, { color: '#FF4C61', fontWeight: 'bold' }]}> {likeCounts[post.id] || 0} </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn}>
                    <Icon name="comment-o" size={22} color={colors.primary} />
                    <Text style={[styles.actionText, { color: colors.primary }]}> {post.commentCount || 0} </Text>
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
              
              {/* Comments section header */}
              <View style={styles.commentsSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Bình luận ({post.commentCount || 0})</Text>
                </View>
                
                {loadingComments && comments.length === 0 ? (
                  <ActivityIndicator style={{ padding: 20 }} color={colors.primary} />
                ) : null}
              </View>
            </>
          )}
          ListFooterComponent={() => (
            <View style={{ height: 16 }} />
          )}
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1 }}
          ListEmptyComponent={() => (
            !loadingComments ? (
              <View style={[styles.noComments, { marginTop: 8 }]}>
                <Icon name="comments-o" size={40} color={colors.lightGray} />
                <Text style={styles.noCommentsText}>Hãy là người đầu tiên bình luận</Text>
                <Text style={styles.noCommentsSubText}>Chia sẻ suy nghĩ của bạn về bài viết này</Text>
              </View>
            ) : null
          )}
          refreshing={loadingComments}
          onRefresh={fetchComments}
        />

        {/* Comment input section */}
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Viết bình luận..."
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!commentText.trim() || isSubmitting) && styles.sendButtonDisabled
            ]}
            onPress={handleComment}
            disabled={!commentText.trim() || isSubmitting}
          >
            <Icon
              name="send"
              size={20}
              color={!commentText.trim() || isSubmitting ? colors.darkGray : colors.primary}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Login modal */}
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

      {/* Modal menu cho sửa/xóa comment */}
      <Modal
        visible={showCommentMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCommentMenu(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 8, padding: 20, minWidth: 200 }}>
            <TouchableOpacity
              style={{ paddingVertical: 10 }}
              onPress={() => handleEditComment(selectedComment)}
            >
              <Text style={{ color: colors.primary, fontSize: 16 }}>Sửa bình luận</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ paddingVertical: 10 }}
              onPress={() => handleDeleteComment(selectedComment)}
            >
              <Text style={{ color: 'red', fontSize: 16 }}>Xóa bình luận</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ paddingVertical: 10 }}
              onPress={() => setShowCommentMenu(false)}
            >
              <Text style={{ color: colors.darkGray, fontSize: 16 }}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal sửa bình luận */}
      <Modal
        visible={showEditCommentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditCommentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: '90%' }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowEditCommentModal(false)}
            >
              <Icon name="close" size={18} color={colors.darkGray} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Chỉnh sửa bình luận</Text>
            <TextInput
              style={[styles.commentInput, { width: '100%', marginVertical: 20 }]}
              value={editCommentText}
              onChangeText={setEditCommentText}
              multiline
              maxLength={500}
              placeholder="Nhập nội dung bình luận..."
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', width: '100%' }}>
              <TouchableOpacity
                style={[styles.modalButton, { marginRight: 10, backgroundColor: colors.darkGray }]}
                onPress={() => setShowEditCommentModal(false)}
              >
                <Text style={[styles.modalButtonText]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton]}
                onPress={handleSaveEditComment}
              >
                <Text style={styles.modalButtonText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginTop: 8,
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
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
    color: colors.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: 12,
  },
  commentContent: {
    flex: 1,
    marginLeft: 20,
  },
  commentUsername: {
    fontWeight: '600',
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  commentTime: {
    fontSize: 12,
    color: colors.darkGray,
    marginTop: 4,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    
  },
  commentMenuButton: {
    padding: 4,
    marginRight: 20
  },
  commentSeparator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  editCommentModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  editCommentContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  editCommentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  editCommentInput: {
    width: '100%',
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
    fontSize: 16,
    color: colors.text,
    textAlignVertical: 'top',
  },
});

export default PostDetailScreen;