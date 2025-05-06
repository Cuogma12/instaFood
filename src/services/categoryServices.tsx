import { getDocs, collection } from 'firebase/firestore';
import { db } from '../config/firebase';

export const getCategories = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'categories'));
    const categories = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return categories;
  } catch (error) {
    console.error('Lỗi khi lấy danh mục:', error);
    return [];
  }
};
