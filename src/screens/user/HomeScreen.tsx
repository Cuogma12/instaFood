import { getFirestore, doc, updateDoc, arrayUnion, arrayRemove } from '@react-native-firebase/firestore';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { colors } from '../../utils/colors';
import { getPosts } from '../../services/postServices';
import Icon from 'react-native-vector-icons/FontAwesome';
import moment from 'moment';
import 'moment/locale/vi';
import RecipePost from '../../components/user/RecipePost';
import ReviewPost from '../../components/user/ReviewPost';
import { likePost } from '../../services/postServices'
import { getAuth } from '@react-native-firebase/auth';

const db = getFirestore();
const auth = getAuth();
const userId = auth.currentUser?.uid;

type PostItemProps = {
  post: any;
  userId: string;
  onToggleLike: (postId: string, hasLiked: boolean) => void;
};


function PostItem({ post, userId, onToggleLike  }: PostItemProps) {
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(true);
  const [showFullCaption, setShowFullCaption] = React.useState(false);
  const CAPTION_LIMIT = 150; // Tăng giới hạn ký tự lên 150
  
  const hasLiked = Array.isArray(post.likes) ? post.likes.includes(userId) : false;

  const handleLikePress = () => {
    onToggleLike(post.id, hasLiked);
  };

  moment.locale('vi');

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
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
      {/* Image */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <Image source={{ uri: post.mediaUrls[0] }} style={styles.postImage} resizeMode="cover" />
      )}
      {/* Action bar */}
      <View style={styles.actionBar}>
        {/* <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(post.id)}>
          <Icon name="heart-o" size={22} color="#FF4C61" />
          <Text style={[styles.actionText, { color: '#FF4C61', fontWeight: 'bold' }]}>{post.likes ? post.likes.length : 0}</Text>
        </TouchableOpacity> */}

        <TouchableOpacity style={styles.actionBtn}  onPress={handleLikePress}>
          <Icon name={hasLiked ? 'heart' : 'heart-o'} size={22} color="#FF4C61" />
          <Text style={[styles.actionText, { color: '#FF4C61', fontWeight: 'bold' }]}>
            {post.likes?.length || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <Icon name="comment-o" size={22} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary, fontWeight: 'bold' }]}>{post.commentCount || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Icon name="share" size={22} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn1} onPress={handleFavorite}>
          <Icon name={isFavorite ? 'bookmark' : 'bookmark-o'} size={22} color={isFavorite ? '#FFD700' : colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // Thêm state cho refresh


  const handleToggleLike = async (postId: string, hasLiked: boolean) => {
    try {
      const updatedPosts = posts.map(post => {
        if (post.id === postId) {
          const currentLikes = Array.isArray(post.likes) ? post.likes : [];
  
          const updatedLikes = hasLiked
            ? currentLikes.filter((id: string) => id !== userId)
            : [...currentLikes, userId];
  
          return { ...post, likes: updatedLikes };
        }
        return post;
      });
  
      setPosts(updatedPosts);
  
      // Gọi hàm Firestore
      await likePost(postId, userId!, hasLiked);
  
      // Gọi cập nhật UserActivities
      if (hasLiked) {
        await removeLikeFromActivity(userId!, postId);
      } else {
        await addLikeToActivity(userId!, postId);
      }
  
    } catch (error) {
      console.error('Toggle like error:', error);
    }
  };
  
  


  const fetchPosts = async () => {
    setLoading(true);
    const data = await getPosts();
    setPosts(data);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const data = await getPosts();
    setPosts(data);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

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
        renderItem={({ item }) => <PostItem post={item} userId={userId!} onToggleLike={handleToggleLike}/>}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      />
    </View>
  );
}

const addLikeToActivity = async (userId: string, postId: string) => {
  try {
    const activityRef = doc(db, 'UserActivities', userId);
    const activityDoc = await activityRef.get();

    if (activityDoc.exists) {
      await activityRef.update({
        likedPosts: arrayUnion(postId),
      });
    } else {
      await activityRef.set({
        likedPosts: [postId],
        createdAt: new Date(),
      });
    }
  } catch (error) {
    console.error("Error adding like to activity:", error);
  }
};

const removeLikeFromActivity = async (userId: string, postId: string) => {
  try {
    const activityRef = doc(db, 'UserActivities', userId);
    await activityRef.update({
      likedPosts: arrayRemove(postId),
    });
  } catch (error) {
    console.error("Error removing like from activity:", error);
  }
};

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
    color: colors.primary,
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
});