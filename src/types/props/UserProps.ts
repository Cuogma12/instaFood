import { StyleProp, ViewStyle } from 'react-native';
import { UserProfile, UserProfileData } from '../user';

/**
 * Props cho các component liên quan đến người dùng
 */

// Props cho component hiển thị thông tin người dùng
export interface UserProfileCardProps {
  userProfile: UserProfile | UserProfileData;
  onEditPress?: () => void;
  onFollowPress?: () => void;
  isCurrentUser?: boolean;
  style?: StyleProp<ViewStyle>;
}

// Props cho component hiển thị avatar người dùng
export interface UserAvatarProps {
  uri?: string | null;
  size?: number;
  onPress?: () => void;
  showBorder?: boolean;
  borderColor?: string;
}

// Props cho component hiển thị danh sách người dùng
export interface UserListProps {
  users: UserProfile[] | UserProfileData[];
  onUserPress?: (user: UserProfile | UserProfileData) => void;
  loading?: boolean;
  onEndReached?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  emptyText?: string;
}

// Props cho component chỉnh sửa từng trường thông tin
export interface EditFieldModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  value: string;
  onSave: (value: string) => void;
  maxLength?: number;
  multiline?: boolean;
  description?: string;
}

// Props cho component hiển thị số liệu thống kê người dùng
export interface UserStatsProps {
  posts: number;
  followers: number;
  following: number;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
}

// Props cho component thông tin bio
export interface UserBioProps {
  bio: string | null;
  username?: string;
  website?: string;
}