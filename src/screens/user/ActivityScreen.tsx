import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Image,
  StyleSheet,
} from 'react-native';

const db = getFirestore();

const ActivityPost = ({ userId }: { userId: string }) => {
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLikedPosts = async () => {
      try {
        const activityRef = doc(db, 'UserActivities', userId);
        const activityDoc = await getDoc(activityRef);

        if (activityDoc.exists) {
          const likedPostIds = activityDoc.data()?.likedPosts || [];

          const postsPromises = likedPostIds.map(async (postId: string) => {
            const postRef = doc(db, 'Posts', postId);
            const postSnap = await getDoc(postRef);
            if (postSnap.exists) {
              return { id: postSnap.id, ...postSnap.data() };
            }
            return null;
          });

          const posts = (await Promise.all(postsPromises)).filter(Boolean);
          setLikedPosts(posts);
        }
      } catch (error) {
        console.error('Error fetching liked posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedPosts();
  }, [userId]);

  const renderPost = (post: any) => {
    if (!post) {
      return <Text style={{ color: 'gray' }}>Bài viết không hợp lệ</Text>;
    }

    // Kiểm tra an toàn mediaUrls
    const mediaUrls = Array.isArray(post.mediaUrls) ? post.mediaUrls : [];
    const mediaUrl = typeof mediaUrls[0] === 'string' ? mediaUrls[0] : null;

    return (
      <View key={post.id} style={styles.postContainer}>
        <Text style={styles.caption}>{post.caption || '(Không có chú thích)'}</Text>

        {mediaUrl ? (
          <Image source={{ uri: mediaUrl }} style={styles.image} />
        ) : (
          <Text style={{ color: 'gray' }}>Không có ảnh</Text>
        )}

        <Text style={styles.description}>Địa điểm: {post.location || 'Không rõ'}</Text>
        <Text style={styles.likes}>
          {Array.isArray(post.likes) ? post.likes.length : 0} lượt thích
        </Text>
      </View>
    );
  };

  if (loading) return <ActivityIndicator size="large" />;

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Bài viết bạn đã thích</Text>
      <FlatList
        data={likedPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderPost(item)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  postContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  caption: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
  },
  likes: {
    fontSize: 12,
    color: '#888',
  },
  image: {
    height: 200,
    width: '100%',
    borderRadius: 8,
    marginBottom: 8,
  },
});

export default ActivityPost;
