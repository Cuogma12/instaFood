import React, { createContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from '@react-native-firebase/auth';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';

interface AuthContextProps {
  user: any;
  role: 'user' | 'admin' | null;
  loading: boolean;
  handleSignOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps>({
  user: null,
  role: null,
  loading: true,
  handleSignOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'user' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);

  const handleSignOut = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      setUser(null);
      setRole(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      if (firebaseUser) {
        try {
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, 'Users', firebaseUser.uid));
          const userData = userDoc.data();

          if (userData) {
            setUser({
              ...firebaseUser,
              ...userData
            });
            setRole(userData.role || 'user');
          } else {
            await handleSignOut();
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          await handleSignOut();
        }
      } else {
        setUser(null);
        setRole(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading, handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
};
