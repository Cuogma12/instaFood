import {
  getFirestore,
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  increment,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  arrayUnion,
  arrayRemove
} from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import { CreatePostData, PostType, BasePost } from '../types/post';
import { uploadMediaToCloudinary, uploadMultipleMedia } from './mediaServices';

const db = getFirestore();

// Upload ảnh hoặc video lên Cloudinary
export const uploadMedia = async (
  uri: string,
  type: 'image' | 'video'
): Promise<string> => {
  try {
    const response = await uploadMediaToCloudinary(uri, type);
    
    if (response.success && response.url) {
      return response.url;
    } else {
      throw new Error(response.error || 'Upload failed');
    }
  } catch (error) {
    console.error('Error uploading media:', error);
    throw error;
  }
};

// Upload nhiều ảnh/video cùng lúc
export const uploadMediaFiles = async (
  uris: string[],
  type: 'image' | 'video'
): Promise<string[]> => {
  try {
    const response = await uploadMultipleMedia(uris, type);
    
    if (response.success && response.urls) {
      return response.urls;
    } else {
      throw new Error(response.error || 'Upload multiple files failed');
    }
  } catch (error) {
    console.error('Error uploading multiple media:', error);
    throw error;
  }
};

// Tạo bài đăng mới với bất kỳ loại nào
export const createPost = async (
  postData: CreatePostData
): Promise<{ success: boolean; postId?: string; error?: string }> => {
  try {
    const user = getAuth().currentUser;
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const userRef = doc(getFirestore(), 'Users', user.uid);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();

    const basePostData = {
      userId: user.uid,
      username: userData?.username || '',
      userAvatar: userData?.photoURL || '',
      caption: postData.caption,
      mediaUrls: postData.mediaUrls,
      mediaType: postData.mediaType,
      likes: [],
      favorites: [],    // Thêm mảng favorites rỗng
      commentCount: 0,
      hashtags: postData.hashtags || [] ,
      categoryIds: postData.categoryIds || [],
      postType: postData.postType,
      createdAt: serverTimestamp(),
      location: postData.location || '',
      ...(postData.recipeDetails && { recipeDetails: postData.recipeDetails }),
      ...(postData.reviewDetails && { reviewDetails: postData.reviewDetails }),
    };

    const postsCollection = collection(getFirestore(), 'Posts');
    const postRef = await addDoc(postsCollection, basePostData);

    await updateDoc(userRef, {
      posts: increment(1),
    });

    return { success: true, postId: postRef.id };
  } catch (error: any) {
    console.error('Error creating post:', error);
    return { success: false, error: error.message };
  }
};

// Lấy danh sách bài đăng (có thể mở rộng thêm điều kiện lọc nếu cần)
export const getPosts = async () => {
  try {
    const postsRef = collection(getFirestore(), 'Posts');
    const postsQuery = query(postsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(postsQuery);
    const posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return posts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
};

// Lấy tất cả bài đăng (cho admin)
export const getAllPosts = async () => {
  try {
    const postsRef = collection(getFirestore(), 'Posts');
    const snapshot = await getDocs(postsRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting all posts:', error);
    throw error;
  }
};

// Xóa bài đăng
export const deletePost = async (postId: string) => {
  try {
    const postRef = doc(getFirestore(), 'Posts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists) {
      throw new Error('Bài đăng không tồn tại');
    }

    const postData = postDoc.data();
    if (!postData) {
      throw new Error('postData is undefined');
    }
    const userRef = doc(getFirestore(), 'Users', postData.userId);

    await deleteDoc(postRef);
    await updateDoc(userRef, {
      posts: increment(-1)
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

// Ẩn/hiện bài đăng
export const togglePostVisibility = async (postId: string, isHidden: boolean) => {
  try {
    const postRef = doc(getFirestore(), 'Posts', postId);
    await updateDoc(postRef, {
      isHidden: isHidden
    });
    return { success: true };
  } catch (error) {
    console.error('Error toggling post visibility:', error);
    throw error;
  }
};

// Thêm bài đăng vào danh sách yêu thích của người dùng
export const toggleFavoritePost = async (postId: string, isFavorite: boolean) => {
  try {
    const user = getAuth().currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const userRef = doc(getFirestore(), 'Users', user.uid);
    
    if (isFavorite) {
      // Thêm vào danh sách yêu thích
      await updateDoc(userRef, {
        favoritePosts: [...(await getUserFavoritePosts()), postId]
      });
      
      // Tạo thông báo khi người dùng yêu thích bài viết
      try {
        // Lấy thông tin bài đăng để biết người viết
        const postRef = doc(getFirestore(), 'Posts', postId);
        const postDoc = await getDoc(postRef);
        
        if (postDoc.exists) {
          const postData = postDoc.data();
          
          // Chỉ tạo thông báo nếu người đăng khác với người yêu thích
          if (postData?.userId && postData?.userId !== user.uid) {
            // Import theo yêu cầu để tránh circular dependency
            const { createNotification } = require('./notificationServices');
            
            // Lấy thông tin người dùng hiện tại để thêm vào thông báo
            const userRef = doc(getFirestore(), 'Users', user.uid);
            const userDoc = await getDoc(userRef);
            const userData = userDoc.data();
            
            console.log('Creating favorite notification from', user.uid, 'to', postData.userId, 'for post', postId);
            
            await createNotification({
              type: 'favorite',
              senderId: user.uid,
              senderUsername: userData?.username || 'Người dùng',
              senderAvatar: userData?.photoURL || null,
              receiverId: postData.userId,
              postId: postId
            });
          }
        }
      } catch (notificationError) {
        console.error('Error creating favorite notification:', notificationError);
        // Vẫn tiếp tục xử lý dù có lỗi tạo thông báo
      }
    } else {
      // Xóa khỏi danh sách yêu thích
      const currentFavorites = await getUserFavoritePosts();
      await updateDoc(userRef, {
        favoritePosts: currentFavorites.filter(id => id !== postId)
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error toggling favorite post:', error);
    throw error;
  }
};

// Lấy danh sách ID bài đăng yêu thích của người dùng
export const getUserFavoritePosts = async (): Promise<string[]> => {
  try {
    const user = getAuth().currentUser;
    
    if (!user) {
      return [];
    }
    
    const userRef = doc(getFirestore(), 'Users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists) {
      return [];
    }
    
    const userData = userDoc.data();
    return userData?.favoritePosts || [];
  } catch (error) {
    console.error('Error getting user favorite posts:', error);
    return [];
  }
};

// Lấy thông tin chi tiết các bài đăng yêu thích của người dùng
export const getFavoritePostsDetails = async () => {
  try {
    const favoriteIds = await getUserFavoritePosts();
    if (favoriteIds.length === 0) {
      return [];
    }
    
    const postsRef = collection(getFirestore(), 'Posts');
    const favoritePosts = [];
    
    for (const id of favoriteIds) {
      const postRef = doc(postsRef, id);
      const postDoc = await getDoc(postRef);
      
      if (postDoc.exists) {
        favoritePosts.push({ id: postDoc.id, ...postDoc.data() });
      }
    }
    
    return favoritePosts;
  } catch (error) {
    console.error('Error fetching favorite posts details:', error);
    return [];
  }
};

// Kiểm tra xem một bài đăng có được yêu thích hay không
export const isPostFavorited = async (postId: string): Promise<boolean> => {
  try {
    const favoriteIds = await getUserFavoritePosts();
    return favoriteIds.includes(postId);
  } catch (error) {
    console.error('Error checking if post is favorited:', error);
    return false;
  }
};

// Thêm hoặc xóa like của người dùng hiện tại đối với bài đăng
export const toggleLikePost = async (postId: string) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const postRef = doc(getFirestore(), 'Posts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists) {
      throw new Error('Post does not exist');
    }
    
    const postData = postDoc.data();
    const likes = postData?.likes || [];
    const isLiked = likes.includes(user.uid);
    
    if (isLiked) {
      // Xóa like
      await updateDoc(postRef, {
        likes: likes.filter((id: string) => id !== user.uid)
      });
    } else {
      // Thêm like
      await updateDoc(postRef, {
        likes: [...likes, user.uid]
      });
      
      // Tạo thông báo khi người dùng thích bài viết (chỉ khi thêm like, không tạo khi bỏ like)
      try {
        const { createNotification } = require('./notificationServices');
        
        if (postData?.userId && postData?.userId !== user.uid) {
          // Lấy thông tin người dùng hiện tại để thêm vào thông báo
          const userRef = doc(getFirestore(), 'Users', user.uid);
          const userDoc = await getDoc(userRef);
          const userData = userDoc.data();
          
          console.log('Creating like notification from', user.uid, 'to', postData.userId, 'for post', postId);
          
          await createNotification({
            type: 'like',
            senderId: user.uid,
            senderUsername: userData?.username || 'Người dùng',
            senderAvatar: userData?.photoURL || null,
            receiverId: postData.userId,
            postId: postId
          });
        }
      } catch (notificationError) {
        console.error('Error creating like notification:', notificationError);
        // Vẫn tiếp tục xử lý dù có lỗi tạo thông báo
      }
    }
    
    return { success: true, isLiked: !isLiked };
  } catch (error) {
    console.error('Error toggling like post:', error);
    throw error;
  }
};

// Kiểm tra xem người dùng hiện tại đã like bài đăng chưa
export const isPostLiked = async (postId: string): Promise<boolean> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      return false;
    }
    
    const postRef = doc(db, 'Posts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc) {
      return false;
    }
    
    const postData = postDoc.data();
    const likes = postData?.likes || [];
    
    return likes.includes(user.uid);
  } catch (error) {
    console.error('Error checking if post is liked:', error);
    return false;
  }
};

// Thêm/xóa bài đăng khỏi mảng favorites của bài đăng (khác với lưu vào danh sách yêu thích của người dùng)
export const togglePostFavorite = async (postId: string) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const postRef = doc(db, 'Posts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc) {
      throw new Error('Post does not exist');
    }
    
    const postData = postDoc.data();
    const favorites = postData?.favorites || [];
    const isFavorited = favorites.includes(user.uid);
    
    if (isFavorited) {
      // Xóa khỏi favorites
      await updateDoc(postRef, {
        favorites: favorites.filter((id: string) => id !== user.uid)
      });
    } else {
      // Thêm vào favorites
      await updateDoc(postRef, {
        favorites: [...favorites, user.uid]
      });
    }
    
    return { success: true, isFavorited: !isFavorited };
  } catch (error) {
    console.error('Error toggling post favorite:', error);
    throw error;
  }
};

// Kiểm tra xem post có trong favorites array
export const isPostInFavorites = async (postId: string): Promise<boolean> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      return false;
    }
    
    const postRef = doc(db, 'Posts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc) {
      return false;
    }
    
    const postData = postDoc.data();
    const favorites = postData?.favorites || [];
    
    return favorites.includes(user.uid);
  } catch (error) {
    console.error('Error checking if post is in favorites:', error);
    return false;
  }
};

// Lấy chi tiết một bài đăng theo ID
export const getPostById = async (postId: string): Promise<any | null> => {
  try {
    const postRef = doc(getFirestore(), 'Posts', postId);
    const postSnap = await getDoc(postRef);
    
    if (postSnap.exists) {
      return { id: postSnap.id, ...postSnap.data() };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching post by ID:', error);
    return null;
  }
};
