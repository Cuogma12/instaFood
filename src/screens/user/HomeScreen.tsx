import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { colors } from '../../utils/colors';
import { getPosts } from '../../services/postServices';
import Icon from 'react-native-vector-icons/FontAwesome';
import moment from 'moment';
import 'moment/locale/vi';
import RecipePost from '../../components/user/RecipePost';

function PostItem({ post }: { post: any }) {
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(true);
  const [showFullCaption, setShowFullCaption] = React.useState(false);
  const CAPTION_LIMIT = 120;

  moment.locale('vi');

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    // TODO: Gọi API thêm/xóa khỏi danh sách yêu thích nếu cần
  };

  const handleHide = () => {
    setIsVisible(false);
  };

  const renderCaption = () => {
    if (!post.caption) return null;
    if (post.caption.length <= CAPTION_LIMIT) {
      return <Text style={styles.caption}>{post.caption}</Text>;
    }
    return (
      <>
        <Text style={styles.caption}>
          {showFullCaption ? post.caption : post.caption.slice(0, CAPTION_LIMIT) + '...'}
        </Text>
        <TouchableOpacity onPress={() => setShowFullCaption(!showFullCaption)}>
          <Text style={{ color: colors.primary, marginLeft: 14, marginBottom: 4, fontWeight: 'bold' }}>
            {showFullCaption ? 'Thu gọn' : 'Xem thêm'}
          </Text>
        </TouchableOpacity>
      </>
    );
  };

  const renderPostContent = () => {
    if (post.postType === 'review' && post.reviewDetails) {
      return (
        <View>
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Nhà hàng: {post.reviewDetails.restaurantName}</Text>
          <Text>Đánh giá: {post.reviewDetails.rating} ⭐</Text>
          <Text>{post.reviewDetails.content}</Text>
        </View>
      );
    }
    if (post.postType === 'recipe' && post.recipeDetails) {
      return(
        <RecipePost recipeDetails={post.recipeDetails} caption={post.caption} />
      );
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
        <TouchableOpacity style={styles.actionBtn}>
          <Icon name="heart-o" size={22} color="#FF4C61" />
          <Text style={[styles.actionText, { color: '#FF4C61', fontWeight: 'bold' }]}>{post.likes ? post.likes.length : 0}</Text>
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
    borderRadius: 18,
    marginHorizontal: 8,
    padding: 0,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F8F8FF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  favoriteBtn: {
    padding: 6,
    marginLeft: 6,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: colors.lightGray,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  username: {
    fontWeight: 'bold',
    color: colors.text, // Đổi màu tên nổi bật
    fontSize: 17,
    marginBottom: 2,
  },
  time: {
    color: colors.darkGray,
    fontSize: 12,
  },
  caption: {
    color: colors.text,
    fontSize: 16,
    marginBottom: 4,
    marginHorizontal: 14,
    marginTop: 8,
    fontWeight: '500',
  },
  hashtag: {
    color: '#1DA1F2', // Đổi màu hashtag xanh nổi bật
    fontSize: 15,
    marginBottom: 6,
    marginHorizontal: 14,
    fontWeight: 'bold',
  },
  postImage: {
    width: '100%',
    height: 220,
    borderRadius: 0,
    marginBottom: 8,
    backgroundColor: colors.lightGray,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f2f2f2',
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 14,
    backgroundColor: '#F8F8FF',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 30,
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#FF4C61',
    shadowOpacity: 0.05,
    shadowRadius: 0.5,
    elevation: 1,
  },
  actionBtn1: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 90,
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#FF4C61',
    shadowOpacity: 0.05,
    shadowRadius: 0.5,
    elevation: 1,
  },
  actionText: {
    marginLeft: 6,
    color: colors.text,
    fontSize: 15,
  },
  hideBtn: {
    padding: 6,
    marginLeft: 6,
  },
});