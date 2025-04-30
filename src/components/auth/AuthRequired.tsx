import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../../utils/colors';
import { useNavigation, CommonActions } from '@react-navigation/native';

interface AuthRequiredProps {
  authChecked: boolean;
  isAuthenticated: boolean;
  message?: string;
  children: React.ReactNode;
}

const AuthRequired: React.FC<AuthRequiredProps> = ({
  authChecked,
  isAuthenticated,
  message = 'Vui lòng đăng nhập để tiếp tục.',
  children,
}) => {
  const navigation = useNavigation();

  // Hiển thị loading khi đang kiểm tra trạng thái đăng nhập
  if (!authChecked) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Hiển thị màn hình yêu cầu đăng nhập nếu chưa xác thực
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notAuthContainer}>
          <Icon name="lock" size={60} color={colors.primary} style={styles.lockIcon} />
          <Text style={styles.notAuthTitle}>Bạn chưa đăng nhập</Text>
          <Text style={styles.notAuthMessage}>{message}</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => {
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                })
              );
            }}
          >
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Nếu đã đăng nhập, hiển thị nội dung bình thường
  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  notAuthContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  lockIcon: {
    marginBottom: 20,
  },
  notAuthTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  notAuthMessage: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AuthRequired;