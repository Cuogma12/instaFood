import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  limit,
  serverTimestamp, 
  updateDoc,
  Timestamp,
  deleteDoc
} from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';

// Định nghĩa kiểu thông báo
export type NotificationType = 'like' | 'favorite' | 'comment' | 'follow' | 'mention';

export interface Notification {
  id?: string;
  type: NotificationType;
  senderId: string;
  senderUsername?: string;
  senderAvatar?: string;
  receiverId: string;
  postId?: string;
  postImage?: string;
  read: boolean;
  createdAt: Timestamp | Date;
  message?: string;
}

// Tạo thông báo mới
export const createNotification = async (
  notificationData: Omit<Notification, 'read' | 'createdAt' | 'id'>
): Promise<string | null> => {
  try {
    const db = getFirestore();
    
    // Kiểm tra xem đã tồn tại thông báo tương tự chưa (tránh trùng lặp)
    const notificationsRef = collection(db, 'Notifications');
    const existingQuery = query(
      notificationsRef,
      where('senderId', '==', notificationData.senderId),
      where('receiverId', '==', notificationData.receiverId),
      where('type', '==', notificationData.type),
      where('postId', '==', notificationData.postId || '')
    );
    
    const existingDocs = await getDocs(existingQuery);
    
    // Nếu đã tồn tại thông báo tương tự trong vòng 1 giờ, không tạo thông báo mới
    if (!existingDocs.empty) {
      const latestDoc = existingDocs.docs[0];
      const latestData = latestDoc.data();
      const latestTimestamp = latestData.createdAt.toDate();
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      if (latestTimestamp > oneHourAgo) {
        // Cập nhật thời gian thông báo
        await updateDoc(doc(db, 'Notifications', latestDoc.id), {
          createdAt: serverTimestamp(),
          read: false
        });
        return latestDoc.id;
      }
    }
    
    // Lấy thông tin người gửi
    if (!notificationData.senderUsername || !notificationData.senderAvatar) {
      const senderRef = doc(db, 'Users', notificationData.senderId);
      const senderDoc = await getDoc(senderRef);
      if (senderDoc.exists) {
        const senderData = senderDoc.data();
        notificationData.senderUsername = senderData?.username || 'Người dùng';
        notificationData.senderAvatar = senderData?.photoURL || null;
      }
    }
    
    // Lấy ảnh bài viết nếu có
    if (notificationData.postId && !notificationData.postImage) {
      const postRef = doc(db, 'Posts', notificationData.postId);
      const postDoc = await getDoc(postRef);
      if (postDoc.exists) {
        const postData = postDoc.data();
        notificationData.postImage = postData?.mediaUrls && postData.mediaUrls.length > 0 
          ? postData.mediaUrls[0] 
          : null;
      }
    }
    
    // Tạo message cho thông báo dựa trên loại
    if (!notificationData.message) {
      switch(notificationData.type) {
        case 'like':
          notificationData.message = 'đã thích bài viết của bạn';
          break;
        case 'favorite':
          notificationData.message = 'đã yêu thích bài viết của bạn';
          break;
        case 'comment':
          notificationData.message = 'đã bình luận về bài viết của bạn';
          break;
        case 'follow':
          notificationData.message = 'đã theo dõi bạn';
          break;
        case 'mention':
          notificationData.message = 'đã nhắc đến bạn trong một bình luận';
          break;
        default:
          notificationData.message = 'đã tương tác với bạn';
      }
    }
    
    // Tạo thông báo mới
    const newNotification = {
      ...notificationData,
      read: false,
      createdAt: serverTimestamp()
    };
    
    // Không gửi thông báo cho chính mình
    if (notificationData.senderId === notificationData.receiverId) {
      return null;
    }
    
    // Thêm thông báo vào Firestore
    const docRef = await addDoc(notificationsRef, newNotification);
    return docRef.id;
    
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Lấy danh sách thông báo của người dùng hiện tại
export const getNotificationsForCurrentUser = async (limitCount: number = 20): Promise<Notification[]> => {
  try {
    const db = getFirestore();
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return [];
    }
    
    const notificationsRef = collection(db, 'Notifications');
    const notificationsQuery = query(
      notificationsRef,
      where('receiverId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(notificationsQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Notification));
    
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

// Đánh dấu thông báo đã đọc
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const db = getFirestore();
    const notificationRef = doc(db, 'Notifications', notificationId);
    
    await updateDoc(notificationRef, {
      read: true
    });
    
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

// Đánh dấu tất cả thông báo đã đọc
export const markAllNotificationsAsRead = async (): Promise<boolean> => {
  try {
    const db = getFirestore();
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return false;
    }
    
    const notificationsRef = collection(db, 'Notifications');
    const unreadQuery = query(
      notificationsRef,
      where('receiverId', '==', currentUser.uid),
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(unreadQuery);
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
};

// Xóa thông báo
export const deleteNotification = async (notificationId: string): Promise<boolean> => {
  try {
    const db = getFirestore();
    const notificationRef = doc(db, 'Notifications', notificationId);
    
    await deleteDoc(notificationRef);
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
};

// Lấy số lượng thông báo chưa đọc
export const getUnreadNotificationCount = async (): Promise<number> => {
  try {
    const db = getFirestore();
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return 0;
    }
    
    const notificationsRef = collection(db, 'Notifications');
    const unreadQuery = query(
      notificationsRef,
      where('receiverId', '==', currentUser.uid),
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(unreadQuery);
    return snapshot.docs.length;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }
};