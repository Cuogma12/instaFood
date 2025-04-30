import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from '@react-native-firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  getDocs,
  updateDoc,
  serverTimestamp 
} from '@react-native-firebase/firestore';
import type { RegisterResult, UserProfileData } from '../types/user';

const db = getFirestore();

// ✅ Kiểm tra username đã tồn tại chưa
const isUsernameAvailable = async (username: string): Promise<boolean> => {
  const usersRef = collection(db, 'Users');
  const q = query(usersRef, where('username', '==', username));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty;
};

// Kiểm tra username mới có sẵn không (loại trừ người dùng hiện tại)
export const isUsernameAvailableForUpdate = async (username: string, currentUid: string): Promise<boolean> => {
  try {
    const usersRef = collection(db, 'Users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return true;
    
    // Nếu username đã tồn tại, kiểm tra xem có phải là username của chính người dùng hiện tại không
    const docs = querySnapshot.docs;
    return docs.length === 1 && docs[0].id === currentUid;
  } catch (error) {
    console.error('Error checking username availability:', error);
    return false;
  }
};

// ✅ Đăng nhập
export const login = async (
  email: string,
  password: string
): Promise<RegisterResult> => {
  try {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    const userRef = doc(db, 'Users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists) {
      throw new Error('Người dùng không tồn tại');
    }

    const userData = userSnap.data();

    return {
      success: true,
      message: 'Đăng nhập thành công!',
      user: {
        uid: userId,
        email: userData?.email,
        username: userData?.username,
        displayName: userData?.displayName,
        photoURL: userData?.photoURL,
        bio: userData?.bio || '',
        role: userData?.role || 'user',
        createdAt: userData?.createdAt.toDate(),
      },
    };
  } catch (error: any) {
    console.log('Login error:', error.code);
    let errorMessage = 'Đăng nhập thất bại';

    switch (error.code) {
      case 'auth/invalid-email':
        errorMessage = 'Email không hợp lệ';
        break;
      case 'auth/user-not-found':
        errorMessage = 'Email chưa được đăng ký';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Mật khẩu không chính xác';
        break;
      case 'auth/invalid-credential':
        errorMessage = 'Thông tin đăng nhập không hợp lệ';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Lỗi kết nối mạng';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Quá nhiều yêu cầu, vui lòng thử lại sau';
        break;
    }

    return { success: false, message: errorMessage };
  }
};

// ✅ Đăng ký
export const register = async (
  email: string,
  password: string,
  username: string,
  displayName: string
): Promise<RegisterResult> => {
  try {
    if (!username.match(/^[a-zA-Z0-9_]+$/)) {
      return {
        success: false,
        message: 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới',
      };
    }

    const isAvailable = await isUsernameAvailable(username);
    if (!isAvailable) {
      return {
        success: false,
        message: 'Tên đăng nhập đã được sử dụng',
      };
    }

    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;

    const userRef = doc(db, 'Users', userId);
    await setDoc(userRef, {
      uid: userId,
      email,
      username,
      displayName,
      photoURL: null,
      bio: '',
      role: 'user',
      createdAt: serverTimestamp(),
    });

    return {
      success: true,
      message: 'Đăng ký thành công!',
    };
  } catch (error: any) {
    console.error('Register error:', error);
    let message = 'Đã có lỗi xảy ra';

    if (error.code === 'auth/email-already-in-use') {
      message = 'Email này đã được sử dụng';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Email không hợp lệ';
    } else if (error.code === 'auth/weak-password') {
      message = 'Mật khẩu không đủ mạnh';
    }

    return { success: false, message };
  }
};

// Lấy thông tin người dùng từ Firestore
export const getUserProfile = async (uid: string): Promise<UserProfileData | null> => {
  try {
    const userRef = doc(db, 'Users', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists) return null;
    
    const userData = userSnap.data();
    return {
      ...userData,
      createdAt: userData?.createdAt?.toDate()
    } as UserProfileData;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (
  uid: string,
  data: {
    displayName?: string;
    username?: string,
    bio?: string;
    photoURL?: string;
  }
): Promise<{success : boolean; message: string}> => {
  try {
    const userRef = doc(db, 'Users', uid);
    await updateDoc(userRef, data);
    return { success: true, message: 'Cập nhật thông tin thành công' };
  } catch (error: any) {
    if (error.code === 'unavailable') {
      return { success: false, message: 'Lỗi mạng, vui lòng thử lại sau' };
    }

    console.error('Update user profile error:', error);
    return { success: false, message: 'Cập nhật thông tin thất bại' };
  }
};