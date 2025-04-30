import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

export interface AuthState {
  isAuthenticated: boolean;
  authChecked: boolean;
  user: FirebaseAuthTypes.User | null;
}

/**
 * Hook để quản lý trạng thái đăng nhập
 * @returns Trạng thái đăng nhập
 */
export const useAuth = (): AuthState => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    authChecked: false,
    user: null
  });

  useEffect(() => {
    // Sử dụng API mới của Firebase theo hướng dẫn di chuyển
    const auth = getAuth();
    
    // Đăng ký lắng nghe sự thay đổi trạng thái xác thực
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setState({
        isAuthenticated: !!user,
        authChecked: true,
        user
      });
    });
    
    // Hủy đăng ký khi component unmount
    return () => unsubscribe();
  }, []);

  return state;
};

export default useAuth;