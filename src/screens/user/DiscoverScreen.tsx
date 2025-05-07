import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../../utils/colors';
import { getPosts } from '../../services/postServices';
import moment from 'moment';
import 'moment/locale/vi';
import RecipePost from '../../components/user/RecipePost';
import ReviewPost from '../../components/user/ReviewPost';

function PostItem({ post }: { post: any }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const CAPTION_LIMIT = 150;

  moment.locale('vi');

  const handleFavorite = () => setIsFavorite(!isFavorite);
  const handleHide = () => setIsVisible(false);

  const renderCaption = () => {
    if (!post.caption) return null;
    const shouldTruncate = post.caption.length > CAPTION_LIMIT;
    const displayedText =
      shouldTruncate && !showFullCaption
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
    if (post.postType === 'review' && post.reviewDetails) {
      return (
        <ReviewPost
          reviewDetails={post.reviewDetails}
          caption={post.caption}
          location={post.location}
        />
      );
    }
    if (post.postType === 'recipe' && post.recipeDetails) {
      return (
        <RecipePost recipeDetails={post.recipeDetails} caption={post.caption} />
      );
    }
    return renderCaption();
  };

  if (!isVisible) return null;

  return (
    <View style={styles.postContainer}>
      <View style={styles.header}>
        <Image
          source={{
            uri: post.userAvatar || require('../../assets/images/defaultuser.png'),
          }}
          style={styles.avatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.username}>{post.username || 'User'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.time}>
              {post.createdAt
                ? moment(
                    post.createdAt.seconds
                      ? post.createdAt.seconds * 1000
                      : post.createdAt
                  ).fromNow()
                : ''}{' '}
              ·{' '}
            </Text>
            <Icon name="globe" size={12} color={colors.darkGray} />
          </View>
        </View>
        <TouchableOpacity style={styles.hideBtn} onPress={handleHide}>
          <Icon name="close" size={20} color={colors.darkGray} />
        </TouchableOpacity>
      </View>

      {renderPostContent()}

      {post.hashtags && post.hashtags.length > 0 && (
        <Text style={styles.hashtag}>#{post.hashtags[0]}</Text>
      )}

      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <Image
          source={{ uri: post.mediaUrls[0] }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}

      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionBtn}>
          <Icon name="heart-o" size={22} color="#FF4C61" />
          <Text style={[styles.actionText, { color: '#FF4C61', fontWeight: 'bold' }]}>
            {post.likes?.length || 0}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Icon name="comment-o" size={22} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary, fontWeight: 'bold' }]}>
            {post.commentCount || 0}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Icon name="share" size={22} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn1} onPress={handleFavorite}>
          <Icon
            name={isFavorite ? 'bookmark' : 'bookmark-o'}
            size={22}
            color={isFavorite ? '#FFD700' : colors.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPostType, setSelectedPostType] = useState<string | null>('all');
  const [availablePostTypes, setAvailablePostTypes] = useState<string[]>([]);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [sortOption, setSortOption] = useState<'newest' | 'oldest'>('newest');

  const fetchPosts = async () => {
    setLoading(true);
    const data: any[] = await getPosts();
    setPosts(data);
    const allowedTypes = ['general', 'recipe', 'review'];
    const types = Array.from(new Set(data.map(post => post.postType))).filter(type =>
      allowedTypes.includes(type)
    );
    setAvailablePostTypes(['all', ...types]);
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

  const filteredPosts = posts
    .filter(post => {
      const matchSearch = post.username?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPostType = selectedPostType === 'all' || post.postType === selectedPostType;
      return matchSearch && matchPostType;
    })
    .sort((a, b) => {
      const aTime = a.createdAt?.seconds || a.createdAt || 0;
      const bTime = b.createdAt?.seconds || b.createdAt || 0;
      return sortOption === 'newest' ? bTime - aTime : aTime - bTime;
    });

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Tìm kiếm món ăn, công thức..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        <TouchableOpacity onPress={() => setSortModalVisible(true)} style={styles.filterBtn}>
          <Icon name="filter" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        {availablePostTypes.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.filterButton, selectedPostType === type && styles.activeFilter]}
            onPress={() => setSelectedPostType(type)}
          >
            <Text style={[styles.filterText, selectedPostType === type && styles.activeFilterText]}>
              {type === 'all' ? 'Tất cả' : type === 'recipe' ? 'Công thức' : type === 'review' ? 'Đánh giá' : 'Bài viết'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredPosts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <PostItem post={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      />

      {sortModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Sắp xếp theo</Text>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setSortOption('newest');
                setSortModalVisible(false);
              }}
            >
              <Text style={styles.modalText}>Mới nhất</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setSortOption('oldest');
                setSortModalVisible(false);
              }}
            >
              <Text style={styles.modalText}>Cũ nhất</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSortModalVisible(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    margin: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterBtn: {
    marginLeft: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    paddingHorizontal: 12,
    marginLeft: 7,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  activeFilter: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: colors.text,
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  postContainer: {
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  time: {
    fontSize: 12,
    color: colors.darkGray,
  },
  hideBtn: {
    padding: 8,
  },
  caption: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  readMoreText: {
    fontSize: 12,
    color: colors.primary,
  },
  hashtag: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 8,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
  },
  actionBtn1: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalOption: {
    paddingVertical: 10,
  },
  modalText: {
    fontSize: 16,
  },
  modalClose: {
    marginTop: 16,
    alignItems: 'flex-end',
  },
  modalCloseText: {
    color: colors.primary,
    fontSize: 16,
  },
  
});
