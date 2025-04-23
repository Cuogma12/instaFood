import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import type { RegisterResult } from '../type/user';

const db = firestore();

// ✅ Kiểm tra username đã tồn tại chưa
const isUsernameAvailable = async (username: string): Promise<boolean> => {
  const usersRef = db.collection('Users');
  const q = usersRef.where('username', '==', username);
  const querySnapshot = await q.get();
  return querySnapshot.empty;
};

// ✅ Đăng nhập
export const login = async (
  email: string,
  password: string
): Promise<RegisterResult> => {
  try {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    const userId = userCredential.user.uid;
    const userRef = db.collection('Users').doc(userId);
    const userSnap = await userRef.get();

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

    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    const userId = userCredential.user.uid;

    const userRef = db.collection('Users').doc(userId);
    await userRef.set({
      uid: userId,
      email,
      username,
      displayName,
      photoURL: null,
      bio: '',
      role: 'user',
      createdAt: firestore.FieldValue.serverTimestamp(),
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
