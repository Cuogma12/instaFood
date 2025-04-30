import React, { createContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from '@react-native-firebase/auth';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';

interface AuthContextProps {
  user: any;
  role: 'user' | 'admin' | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextProps>({
  user: null,
  role: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'user' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {

      if (firebaseUser) {
        try {
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, 'Users', firebaseUser.uid));
          const userData = userDoc.data();

          if (userData) {
            setUser(firebaseUser);
            setRole(userData.role || 'user');
          } else {
            setUser(null);
            setRole(null);
          }
        } catch (error) {
          setUser(null);
          setRole(null);
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
    <AuthContext.Provider value={{ user, role, loading}}>
      {children}
    </AuthContext.Provider>
  );
};
