import {
  getFirestore,
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp,
  updateDoc,
  deleteDoc
} from '@react-native-firebase/firestore';

const db = getFirestore();

export interface Category {
  categoryId: string;
  name: string;
  type: string;
  description: string;
  imageUrl?: string;
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
  type: string;
}): Promise<{ success: boolean; categoryId?: string; error?: string }> => {
  try {
    const newCategory = {
      ...categoryData,
      createdAt: serverTimestamp()
    };
    
    const categoriesCollection = collection(db, 'Categories');
    const docRef = await addDoc(categoriesCollection, newCategory);
    
    return {
      success: true,
      categoryId: docRef.id,
      error: undefined
    };
  } catch (error: any) {
    console.error('Error creating category:', error);
    return { success: false, error: error?.message || 'Lỗi khi tạo danh mục' };
  }
};

// Cập nhật thông tin category
export const updateCategory = async (
  categoryId: string,
  updateData: {
    name?: string;
    description?: string;
    imageUrl?: string | '';
    type?: string;
  }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const categoryRef = doc(db, 'Categories', categoryId);
    await updateDoc(categoryRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return { success: true, error: undefined };
  } catch (error: any) {
    console.error('Error updating category:', error);
    return { success: false, error: error?.message || 'Lỗi khi cập nhật danh mục' };
  }
};

// Xóa category
export const deleteCategory = async (categoryId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const categoryRef = doc(db, 'Categories', categoryId);
    
    // Kiểm tra xem có danh mục con không
    const subCategoriesQuery = query(collection(db, 'Categories'), where('parentId', '==', categoryId));
    const subCategoriesSnapshot = await getDocs(subCategoriesQuery);
    
    if (!subCategoriesSnapshot.empty) {
      return { 
        success: false, 
        error: 'Không thể xóa danh mục này vì có danh mục con' 
      };
    }
    
    // Kiểm tra xem có bài đăng nào thuộc danh mục này không
    const postsQuery = query(collection(db, 'Posts'), where('categoryIds', 'array-contains', categoryId));
    const postsSnapshot = await getDocs(postsQuery);
    
    if (!postsSnapshot.empty) {
      return { 
        success: false, 
        error: 'Không thể xóa danh mục này vì có bài đăng thuộc danh mục' 
      };
    }
    
    await deleteDoc(categoryRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, error: 'Lỗi khi xóa danh mục' };
  }
};