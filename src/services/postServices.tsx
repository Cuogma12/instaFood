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
  arrayRemove,
  arrayUnion
} from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import { CreatePostData, PostType, BasePost } from '../types/post';
import { uploadMediaToCloudinary, uploadMultipleMedia } from './mediaServices';

const db = getFirestore();

//like
export const likePost = async (postId: string, userId: string, hasLiked: boolean) => {
  try {
    const postRef = doc(db, 'Posts', postId);
    let updatedLikes;

    if (hasLiked) {
      // Nếu người dùng đã like, xóa họ khỏi danh sách likes
      updatedLikes = arrayRemove(userId);
    } else {
      // Nếu người dùng chưa like, thêm họ vào danh sách likes
      updatedLikes = arrayUnion(userId);
    }

    // Cập nhật danh sách likes trong bài đăng
    await updateDoc(postRef, {
      likes: updatedLikes,
    });
  } catch (error) {
    console.error('Error liking post:', error);
  }
};

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
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const userRef = doc(db, 'Users', user.uid);
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
      commentCount: 0,
      hashtags: postData.hashtags || [] ,
      categoryIds: postData.categoryIds || [],
      postType: postData.postType,
      createdAt: serverTimestamp(),
      location: postData.location || '',
      ...(postData.recipeDetails && { recipeDetails: postData.recipeDetails }),
      ...(postData.reviewDetails && { reviewDetails: postData.reviewDetails }),
      ...(postData.restaurantDetails && { restaurantDetails: postData.restaurantDetails }),
    };

    const postsCollection = collection(db, 'Posts');
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
    const postsRef = collection(db, 'Posts');
    const postsQuery = query(postsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(postsQuery);
    const posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return posts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
};
