import axios from 'axios';
import { Platform } from 'react-native';
import { getAuth } from '@react-native-firebase/auth';
import * as FileSystem from 'react-native-fs';
import { 
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
  CLOUDINARY_API_KEY
} from '@env';
import type { UploadResponse } from '../types/media';

export const uploadMediaToCloudinary = async (
    uri: string,
    type: 'image' | 'video'
  ): Promise<UploadResponse> => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        console.log('⚠️ Không có user đăng nhập');
        return { success: false, error: 'Bạn cần đăng nhập để tải lên media' };
      }
  
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const fileName = uri.split('/').pop() || `${Date.now()}.jpg`;
      const mimeType = type === 'image' ? 'image/jpeg' : 'video/mp4';
      const cloudinaryFileName = `${user.uid}_${Date.now()}`;
  
      const formData = new FormData();
  
      console.log('📸 URI:', uri);
      console.log('📝 fileName:', fileName);
      console.log('🔢 timestamp:', timestamp);
      console.log('📂 mimeType:', mimeType);
      console.log('🆔 public_id:', cloudinaryFileName);
  
      if (Platform.OS === 'ios' && uri.startsWith('file://')) {
        console.log('📱 Đang xử lý ảnh trên iOS với base64');
        const fileData = await FileSystem.readFile(uri, 'base64');
        const base64File = `data:${mimeType};base64,${fileData}`;
        formData.append('file', base64File);
      } else {
        console.log('🤖 Đang xử lý ảnh trên Android hoặc base không phải iOS');
        const file = {
          uri,
          type: mimeType,
          name: fileName,
        };
        formData.append('file', file as any);
      }
  
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('api_key', CLOUDINARY_API_KEY);
      formData.append('timestamp', timestamp);
      formData.append('folder', type === 'image' ? 'instaFood/images' : 'instaFood/videos');
      formData.append('public_id', cloudinaryFileName);
  
      const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${type === 'image' ? 'image' : 'video'}/upload`;
      console.log('🚀 Upload URL:', uploadUrl);
  
      const response = await axios.post(uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      if (response.data && response.data.secure_url) {
        console.log('✅ Upload thành công:', response.data.secure_url);
        return {
          success: true,
          url: response.data.secure_url,
        };
      } else {
        console.log('❌ Không có URL trả về:', response.data);
        return {
          success: false,
          error: 'Không nhận được URL sau khi upload',
        };
      }
    } catch (error: any) {
      console.log('❗ Lỗi khi upload:', error?.response?.data || error.message);
      return {
        success: false,
        error: error.message || 'Lỗi không xác định khi upload media',
      };
    }
  };
  

/**
 * Upload nhiều tệp media cùng lúc
 * @param uris Danh sách URI của các tệp cần upload
 * @param type Loại media ('image' hoặc 'video')
 * @returns Danh sách các URL sau khi upload
 */
export const uploadMultipleMedia = async (
  uris: string[],
  type: 'image' | 'video'
): Promise<{
  success: boolean;
  urls?: string[];
  error?: string;
}> => {
  try {
    const uploadPromises = uris.map(uri => uploadMediaToCloudinary(uri, type));
    const results = await Promise.all(uploadPromises);
    
    // Kiểm tra xem có lỗi nào không
    const failedUploads = results.filter(r => !r.success);
    if (failedUploads.length > 0) {
      return {
        success: false,
        error: `${failedUploads.length}/${results.length} tệp tải lên thất bại`
      };
    }
    
    // Trả về danh sách URL
    const urls = results
      .filter(r => r.success && r.url)
      .map(r => r.url as string);
    
    return {
      success: true,
      urls
    };
  } catch (error: any) {
    console.error('Error uploading multiple files:', error);
    return {
      success: false,
      error: error.message || 'Lỗi khi tải lên nhiều tệp'
    };
  }
};
// day la services mediaServices.tsx