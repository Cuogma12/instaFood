import {
  getFirestore,
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp
} from '@react-native-firebase/firestore';

const db = getFirestore();

export interface Category {
  categoryId: string;
  name: string;
  type: string;
  description: string;
  imageUrl?: string;
  parentId?: string;
  createdAt: Date;
}

// Lấy danh sách tất cả categories
export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const categoriesCollection = collection(db, 'Categories');
    const categoriesSnapshot = await getDocs(categoriesCollection);
    
    return categoriesSnapshot.docs.map(doc => ({
      categoryId: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    })) as Category[];
  } catch (error) {
    console.error('Error getting categories:', error);
    return [];
  }
};

// Lấy danh sách categories cấp cao nhất (không có parentId)
export const getRootCategories = async (): Promise<Category[]> => {
  try {
    const categoriesCollection = collection(db, 'Categories');
    const rootCategoriesQuery = query(categoriesCollection, where('parentId', '==', null));
    const categoriesSnapshot = await getDocs(rootCategoriesQuery);
    
    return categoriesSnapshot.docs.map(doc => ({
      categoryId: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    })) as Category[];
  } catch (error) {
    console.error('Error getting root categories:', error);
    return [];
  }
};

// Lấy danh sách categories con của một category
export const getSubCategories = async (parentId: string): Promise<Category[]> => {
  try {
    const categoriesCollection = collection(db, 'Categories');
    const subCategoriesQuery = query(categoriesCollection, where('parentId', '==', parentId));
    const categoriesSnapshot = await getDocs(subCategoriesQuery);
    
    return categoriesSnapshot.docs.map(doc => ({
      categoryId: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    })) as Category[];
  } catch (error) {
    console.error('Error getting sub-categories:', error);
    return [];
  }
};

// Tạo category mới (Thường chỉ dành cho admin)
export const createCategory = async (categoryData: {
  name: string;
  description: string;
  imageUrl?: string;
  parentId?: string;
  type: string;
}): Promise<{ success: boolean; categoryId?: string }> => {
  try {
    const newCategory = {
      ...categoryData,
      createdAt: serverTimestamp()
    };
    
    const categoriesCollection = collection(db, 'Categories');
    const docRef = await addDoc(categoriesCollection, newCategory);
    
    return {
      success: true,
      categoryId: docRef.id
    };
  } catch (error) {
    console.error('Error creating category:', error);
    return { success: false };
  }
};