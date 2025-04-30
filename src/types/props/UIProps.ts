import { StyleProp, TextStyle, ViewStyle } from 'react-native';

/**
 * Props dùng cho các thành phần UI cơ bản
 */

// Props chung cho tất cả các component
export interface BaseComponentProps {
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// Props cho các button
export interface ButtonProps extends BaseComponentProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  titleStyle?: StyleProp<TextStyle>;
  leftIcon?: string;
  rightIcon?: string;
}

// Props cho Input
export interface InputProps extends BaseComponentProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  label?: string;
  error?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
}

// Props cho Card
export interface CardProps extends BaseComponentProps {
  children: React.ReactNode;
  onPress?: () => void;
  elevation?: number;
}

// Props cho Badge
export interface BadgeProps extends BaseComponentProps {
  label: string;
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

// Props cho Avatar
export interface AvatarProps extends BaseComponentProps {
  uri?: string | null;
  name?: string;
  size?: number;
  onPress?: () => void;
}

// Props cho các tab
export interface TabProps extends BaseComponentProps {
  title: string;
  active: boolean;
  onPress: () => void;
  icon?: string;
}

// Props cho Modal
export interface ModalProps extends BaseComponentProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export interface SettingItemProps {
  icon: string;
  title: string;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  onPress?: () => void;
}