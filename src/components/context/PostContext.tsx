import React, { createContext, useState, useEffect, useContext } from 'react';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from '@react-native-firebase/firestore';

type LikedPostsState = {
  [postId: string]: boolean;
};

type LikeCountsState = {
  [postId: string]: number;
};

interface PostContextType {
  likedPosts: LikedPostsState;
  likeCounts: LikeCountsState;
  toggleLike: (postId: string) => Promise<void>;
  initializePostStates: (posts: any[]) => void;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

export const PostProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [likedPosts, setLikedPosts] = useState<LikedPostsState>({});
  const [likeCounts, setLikeCounts] = useState<LikeCountsState>({});

  // Initialize post states based on user's like status and post data
  const initializePostStates = (posts: any[]) => {
    const currentUser = getAuth().currentUser;
    if (!currentUser) return;

    const newLikedPosts: LikedPostsState = { ...likedPosts };
    const newLikeCounts: LikeCountsState = { ...likeCounts };

    posts.forEach(post => {
      if (!post.id) return;
      
      const userLiked = post.likes?.includes(currentUser.uid) || false;
      newLikedPosts[post.id] = userLiked;
      newLikeCounts[post.id] = post.likes?.length || 0;
    });

    setLikedPosts(newLikedPosts);
    setLikeCounts(newLikeCounts);
  };

  // Toggle like for a post
  const toggleLike = async (postId: string): Promise<void> => {
    const currentUser = getAuth().currentUser;
    if (!currentUser) {
      throw new Error("Yêu cầu đăng nhập để thích bài viết");
    }

    const isLiked = likedPosts[postId] || false;
    const likeCount = likeCounts[postId] || 0;
    const firestore = getFirestore();

    try {
      // Check if post exists before updating
      const postRef = doc(firestore, 'Posts', postId);
      const postDoc = await getDoc(postRef);
      
      if (!postDoc.exists) {
        // Try lowercase collection name as fallback
        const fallbackRef = doc(firestore, 'posts', postId);
        const fallbackDoc = await getDoc(fallbackRef);
        
        if (fallbackDoc.exists) {
          // Use the fallback reference
          if (isLiked) {
            await updateDoc(fallbackRef, {
              likes: arrayRemove(currentUser.uid)
            });
          } else {
            await updateDoc(fallbackRef, {
              likes: arrayUnion(currentUser.uid)
            });
          }
        } else {
          throw new Error(`Post with ID ${postId} not found`);
        }
      } else {
        if (isLiked) {
          await updateDoc(postRef, {
            likes: arrayRemove(currentUser.uid)
          });
        } else {
          await updateDoc(postRef, {
            likes: arrayUnion(currentUser.uid)
          });
        }
      }
      
      // Update UI state for all components using this context
      setLikeCounts(prev => ({
        ...prev,
        [postId]: isLiked ? likeCount - 1 : likeCount + 1
      }));
      
      setLikedPosts(prev => ({
        ...prev,
        [postId]: !isLiked
      }));
      
    } catch (error) {
      console.error("Error toggling like:", error);
      throw error;
    }
  };

  return (
    <PostContext.Provider value={{ 
      likedPosts, 
      likeCounts, 
      toggleLike,
      initializePostStates
    }}>
      {children}
    </PostContext.Provider>
  );
};

// Custom hook to use the Post context
export const usePostContext = () => {
  const context = useContext(PostContext);
  if (context === undefined) {
    throw new Error('usePostContext must be used within a PostProvider');
  }
  return context;
};
