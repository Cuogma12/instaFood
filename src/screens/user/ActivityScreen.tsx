import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, ActivityIndicator, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { getFirestore, doc, getDoc, arrayRemove, updateDoc } from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import { getPostById } from '../../services/postServices';
import HomeScreen from '../user/HomeScreen'; // Import thành phần PostItem từ HomeScreen
import { PostItem } from '../user/HomeScreen';
import { colors } from '../../utils/colors';
// You might need to install this package if not already installed
import Icon from 'react-native-vector-icons/MaterialIcons';

const ActivityScreen = () => {
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const auth = getAuth();
  const db = getFirestore();
  const userId = auth.currentUser?.uid;

  const fetchLikedPosts = async () => {
    try {
      if (!userId) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Show loading indicator when manually refreshing
      if (!loading) setLoading(true);
      
      const activityRef = doc(db, 'UserActivities', userId);
      const activitySnap = await getDoc(activityRef);

      if (activitySnap.exists) {
        const { likedPosts = [] } = activitySnap.data() || {};
        
        if (likedPosts && likedPosts.length > 0) {
          const postPromises = likedPosts.map((postId: string) => getPostById(postId));
          const posts = await Promise.all(postPromises);
          setLikedPosts(posts.filter(Boolean)); // lọc các post null (nếu đã bị xóa)
        } else {
          setLikedPosts([]);
        }
      } else {
        setLikedPosts([]);
      }
    } catch (error) {
      console.error('Error fetching liked posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Xử lý refresh khi kéo xuống
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLikedPosts();
  };

  // Xử lý refresh khi nhấn nút
  const handleRefreshButtonPress = () => {
    fetchLikedPosts();
  };

  useEffect(() => {
    fetchLikedPosts();
  }, [userId]);

  const handleToggleLike = async (postId: string, hasLiked: boolean) => {
    try {
      // Cập nhật UI trước
      const updatedPosts = likedPosts.filter(post => post.id !== postId);
      setLikedPosts(updatedPosts);
      
      // Sau đó cập nhật Firestore
      if (userId) {
        const activityRef = doc(db, 'UserActivities', userId);
        await updateDoc(activityRef, {
          likedPosts: arrayRemove(postId)
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
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
      {/* Header with refresh button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bài viết đã thích</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={handleRefreshButtonPress}
          disabled={loading || refreshing}
        >
          <Icon name="refresh" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {likedPosts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Bạn chưa thả tim bài viết nào.</Text>
        </View>
      ) : (
        <FlatList
          data={likedPosts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <PostItem 
              post={item} 
              userId={userId!} 
              onToggleLike={handleToggleLike}
            />
          )}
          contentContainerStyle={{ paddingBottom: 16 }}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
};

export default ActivityScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray || '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text || '#000',
  },
  refreshButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: colors.darkGray,
    marginTop: 20,
  },
});