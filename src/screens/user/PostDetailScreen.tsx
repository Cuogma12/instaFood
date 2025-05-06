import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import moment from 'moment';
import 'moment/locale/vi';
import { RouteProp, useRoute } from '@react-navigation/native';
import { getPostById, deletePost } from '../../services/postServices';
import { RootStackParamList } from '../../types/stackparamlist';
import { colors } from '../../utils/colors';
import ReviewPost from '../../components/user/ReviewPost';
import RecipePost from '../../components/user/RecipePost';

type PostDetailRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;

export default function PostDetailScreen() {
  const route = useRoute<PostDetailRouteProp>();
  const { postId } = route.params;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFullCaption, setShowFullCaption] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      const data = await getPostById(postId);
      setPost(data);
      setLoading(false);
    };
    fetchPost();
  }, [postId]);

  const handleDelete = async () => {
    Alert.alert(
      'Xóa bài đăng',
      'Bạn có chắc chắn muốn xóa bài đăng này?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost(postId);
              Alert.alert('Thành công', 'Bài đăng đã được xóa.');
              // Sau khi xóa, bạn có thể quay lại trang trước hoặc làm mới dữ liệu
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa bài đăng. Vui lòng thử lại sau.');
            }
          },
        },
      ],
      { cancelable: false }
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
      <View style={styles.loadingContainer}>
        <Text>Không tìm thấy bài viết.</Text>
      </View>
    );
  }

  const renderCaption = () => {
    const CAPTION_LIMIT = 150;
    const shouldTruncate = post.caption.length > CAPTION_LIMIT;
    const displayedText = shouldTruncate && !showFullCaption
      ? post.caption.slice(0, CAPTION_LIMIT) + '...'
      : post.caption;

    return (
      <View>
        <Text style={styles.caption}>{displayedText}</Text>
        {shouldTruncate && (
          <TouchableOpacity onPress={() => setShowFullCaption(!showFullCaption)}>
            <Text style={styles.readMoreText}>
              {showFullCaption ? 'Thu gọn' : 'Xem thêm'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderPostContent = () => {
    if (post.postType === 'review') {
      return (
        <ReviewPost reviewDetails={post.reviewDetails} caption={post.caption} location={post.location} />
      );
    }
    if (post.postType === 'recipe') {
      return (
        <RecipePost recipeDetails={post.recipeDetails} caption={post.caption} />
      );
    }
    return renderCaption();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Image source={{ uri: post.userAvatar || require('../../assets/images/defaultuser.png') }} style={styles.avatar} />
        <View>
          <Text style={styles.username}>{post.username || 'Người dùng'}</Text>
          <Text style={styles.time}>{moment(post.createdAt?.seconds ? post.createdAt.seconds * 1000 : post.createdAt).fromNow()}</Text>
        </View>
      </View>

      {renderPostContent()}

      {post.hashtags?.length > 0 && (
        <Text style={styles.hashtag}>#{post.hashtags[0]}</Text>
      )}

      {post.mediaUrls?.length > 0 && (
        <Image source={{ uri: post.mediaUrls[0] }} style={styles.image} resizeMode="cover" />
      )}

      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionBtn}>
          <Icon name="heart-o" size={22} color="#FF4C61" />
          <Text style={styles.actionText}>{post.likes?.length || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Icon name="comment-o" size={22} color={colors.primary} />
          <Text style={styles.actionText}>{post.commentCount || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Icon name="share" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Nút xóa bài */}
      <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
        <Icon name="trash-o" size={24} color="red" />
        <Text style={styles.deleteText}>Xóa bài</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.lightGray,
  },
  username: {
    fontWeight: '600',
    fontSize: 16,
    color: colors.text,
  },
  time: {
    fontSize: 13,
    color: colors.darkGray,
  },
  caption: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  readMoreText: {
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 12,
  },
  hashtag: {
    color: colors.primary,
    fontWeight: '500',
    fontSize: 14,
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: colors.lightGray,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    alignSelf: 'center',
  },
  deleteText: {
    marginLeft: 8,
    color: 'red',
    fontWeight: '600',
  },
});
