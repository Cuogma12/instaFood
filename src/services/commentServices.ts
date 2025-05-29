import { auth } from '../config/firebase';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  increment,
  serverTimestamp,
  FieldValue
} from '@react-native-firebase/firestore';

const db = getFirestore();

export const addComment = async (postId: string, content: string) => {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    // Get full user data from Users collection
    const userRef = doc(db, 'Users', currentUser.uid);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data() || {};
    
    const commentData = {
      postId,
      content,
      userId: currentUser.uid,
      username: userData.username || currentUser.displayName || 'Người dùng',
      userAvatar: userData.photoURL || currentUser.photoURL || '',
      createdAt: serverTimestamp(),
      likes: []
    };

    // Add the comment first
    const commentRef = await addDoc(collection(db, 'Comments'), commentData);
    console.log(`Comment added with ID: ${commentRef.id}`);
    
    // Then update the post's comment count using increment operator for atomic operation
    const postRef = doc(db, 'Posts', postId);
    await updateDoc(postRef, {
      commentCount: increment(1)
    });
    
    // Get post owner ID to send notification
    const postDoc = await getDoc(postRef);
    const postData = postDoc.data();
    
    // Create notification for comment if post owner is not the commenter
    try {
      if (postData && postData.userId && postData.userId !== currentUser.uid) {
        // Import on demand to avoid circular dependency
        const { createNotification } = require('./notificationServices');
        
        console.log('Creating comment notification from', currentUser.uid, 'to', postData.userId, 'for post', postId);
        
        await createNotification({
          type: 'comment',
          senderId: currentUser.uid,
          senderUsername: userData.username || currentUser.displayName || 'Người dùng',
          senderAvatar: userData.photoURL || currentUser.photoURL || '',
          receiverId: postData.userId,
          postId: postId
        });
      }
    } catch (notificationError) {
      console.error('Error creating comment notification:', notificationError);
      // Continue execution even if notification creation fails
    }
    
    console.log(`Comment count incremented for post ${postId}`);
    return { success: true };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { success: false, error };
  }
};

export const getComments = async (postId: string) => {
  try {
    const commentsQuery = query(
      collection(db, 'Comments'),
      where('postId', '==', postId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(commentsQuery);
    
    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Retrieved ${comments.length} comments for post ${postId}`);
    return comments;
  } catch (error) {
    console.error('Error getting comments:', error);
    return [];
  }
};

export const updateComment = async (commentId: string, newContent: string) => {
  try {
    const commentRef = doc(db, 'Comments', commentId);
    await updateDoc(commentRef, {
      content: newContent,
      updatedAt: serverTimestamp(),
    });
    console.log(`Comment ${commentId} updated.`);
    return { success: true };
  } catch (error) {
    console.error('Error updating comment:', error);
    return { success: false, error };
  }
};

export const deleteComment = async (commentId: string, postId: string) => {
  try {
    const commentRef = doc(db, 'Comments', commentId);
    await deleteDoc(commentRef);
    
    // Giảm số lượng comment của post
    const postRef = doc(db, 'Posts', postId);
    await updateDoc(postRef, {
      commentCount: increment(-1)
    });
    console.log(`Comment ${commentId} deleted and commentCount decremented for post ${postId}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting comment:', error);
    return { success: false, error };
  }
};
