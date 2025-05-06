// Định nghĩa các loại bài đăng
export enum PostType {
  RECIPE = 'recipe',      // Công thức nấu ăn
  REVIEW = 'review',      // Đánh giá món ăn
  GENERAL = 'normal'     // Bài đăng thông thường
}

// Interface cơ bản cho bài đăng
export interface BasePost {
  id: string;
  userId: string;
  username?: string;
  userAvatar?: string;
  caption: string;
  mediaUrls: string[];    // Có thể có nhiều ảnh
  mediaType: 'image' | 'video';
  likes: string[];        // Danh sách userId đã like
  commentCount: number;
  hashtags: string[];
  categoryIds?: string[]; // Liên kết với Categories
  postType: PostType;
  createdAt: Date;
  location?: {
    name: string;
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
}

// Công thức nấu ăn
export interface RecipePost extends BasePost {
  postType: PostType.RECIPE;
  recipeDetails: {
    title: string;
    preparationTime: number; // Thời gian chuẩn bị (phút)
    cookingTime: number;     // Thời gian nấu (phút)
    servings: number;        // Số người ăn
    ingredients: string[];   // Danh sách nguyên liệu
    instructions: string[];  // Các bước thực hiện
    difficulty: 'easy' | 'medium' | 'hard'; // Độ khó
  };
}

// Đánh giá món ăn
export interface ReviewPost extends BasePost {
  postType: PostType.REVIEW;
  reviewDetails: {
    name: string;           // Tên món ăn
    rating: number;         // Đánh giá từ 1-5
    price?: number;         // Giá (nếu có)
    pros: string[];         // Điểm tốt
    cons: string[];         // Điểm chưa tốt
    restaurantInfo?: {
      name: string;         // Tên nhà hàng
      cuisineType?: string[]; // Loại ẩm thực
      priceRange?: 'low' | 'medium' | 'high'; // Mức giá
      contactInfo?: {
        phone?: string;
        website?: string;
      };
      openingHours?: string;
    };
  };
}

// Bài đăng thông thường
export interface GeneralPost extends BasePost {
  postType: PostType.GENERAL;
}

// Union type cho tất cả loại bài đăng
export type Post = RecipePost | ReviewPost | GeneralPost;

// Type dùng khi tạo bài đăng mới
export interface CreatePostData {
  caption: string;
  mediaUrls: string[];
  mediaType: 'image' | 'video';
  hashtags: string[];
  categoryIds?: string[];
  postType: PostType;
  location?: {
    name: string;
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  recipeDetails?: RecipePost['recipeDetails'];
  reviewDetails?: ReviewPost['reviewDetails'];
  createdAt: String;
}

// Interface cho bài đăng hiển thị trong profile grid
export interface ProfilePost {
  id: string;
  imageUrl: string;
}

export interface AdminPost {
  id: string;
  caption: string;
  username: string;
  mediaUrls: string[];
  postType: PostType;
  createdAt: any;
  isHidden?: boolean;
  recipeDetails?: {
    title: string;
  };
  reviewDetails?: {
    name: string;
  };
}