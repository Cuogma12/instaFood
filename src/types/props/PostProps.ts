import { StyleProp, ViewStyle } from 'react-native';
import { Post, PostType } from '../post';
import { Category } from '../../services/categoriesServices';

/**
 * Props cho các component liên quan đến bài đăng
 */

// Props cơ bản cho component hiển thị bài đăng
export interface PostCardProps {
  post: Post;
  onLikePress?: () => void;
  onCommentPress?: () => void;
  onUserPress?: () => void;
  onOptionsPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

// Props cho component hiển thị danh sách bài đăng
export interface PostListProps {
  posts: Post[];
  loading?: boolean;
  onEndReached?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  style?: StyleProp<ViewStyle>;
  ListEmptyComponent?: React.ReactNode;
  ListHeaderComponent?: React.ReactNode;
}

// Props cho màn hình tạo bài đăng
export interface CreatePostScreenProps {
  initialType?: PostType;
}

// Props cho tab loại bài đăng
export interface PostTypeTabProps {
  title: string;
  icon: string;
  active: boolean;
  onPress: () => void;
}

// Props cho modal chọn danh mục
export interface CategorySelectorProps {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategories: Category[];
  onCategorySelect: (category: Category) => void;
  loading?: boolean;
  onConfirm: () => void;
}

// Props cho thành phần thêm hashtag
export interface HashtagInputProps {
  hashtags: string[];
  onAddHashtag: (hashtag: string) => void;
  onRemoveHashtag: (index: number) => void;
}

// Props cho thành phần chọn ảnh
export interface MediaSelectorProps {
  selectedImages: any[];
  onSelectImages: () => void;
  onTakePhoto: () => void;
  onRemoveImage: (index: number) => void;
}

// Props cho component đánh giá sao
export interface RatingProps {
  value: number;
  onChange: (rating: number) => void;
  size?: number;
  color?: string;
}