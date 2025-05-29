import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Image,
    Alert,
    ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';  // Hoặc các bộ icon khác như Ionicons, MaterialIcons

import { useNavigation } from '@react-navigation/native';
import { AuthInput } from '../../components/auth/AuthInput';
import { colors } from '../../utils/colors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { login } from '../../services/authServices';
import { RootStackParamList } from '../../types/stackparamlist';


type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
    const navigation = useNavigation<LoginScreenNavigationProp>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

const validateForm = () => {
    let isValid = true;

    // Validate email
    if (!email.trim()) {
        setEmailError('Vui lòng nhập email');
        isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
        setEmailError('Email không hợp lệ');
        isValid = false;
    } else if (email.length > 50) {
        setEmailError('Email không được vượt quá 50 ký tự');
        isValid = false;
    } else {
        setEmailError('');
    }

    // Validate password
    if (!password) {
        setPasswordError('Vui lòng nhập mật khẩu');
        isValid = false;
    } else if (password.length < 6) {
        setPasswordError('Mật khẩu phải có ít nhất 6 ký tự');
        isValid = false;
    } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
        setPasswordError('Mật khẩu phải chứa ít nhất 1 chữ cái và 1 số');
        isValid = false;
    } else if (/\s/.test(password)) {
        setPasswordError('Mật khẩu không được chứa khoảng trắng');
        isValid = false;
    } else {
        setPasswordError('');
    }

    return isValid;
};


    const handleLogin = async () => {
        setEmailError('');
        setPasswordError('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);
    try {
  const result = await login(email, password);
  if (!result.success) {
    const errorMessage = result.message || 'Đăng nhập thất bại';
    if (errorMessage.toLowerCase().includes('email')) {
      setEmailError(errorMessage);
    } else if (errorMessage.toLowerCase().includes('mật khẩu') || errorMessage.toLowerCase().includes('password')) {
      setPasswordError(errorMessage);
    } else {
      // Các lỗi khác chung chung
      setEmailError(errorMessage);
    }
    setLoading(false); // Tắt loading khi login thất bại
    return;
  }

  // ✅ Nếu login thành công
  if (result.user?.role === 'admin') {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Admin' }],
    });
  } else {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainApp' }],
    });
  }
  
} catch (error: any) {
  console.error('Login error:', error.message);
  setEmailError('Đã xảy ra lỗi, vui lòng thử lại.');
  setLoading(false);
}
    };

    return (
        <ImageBackground
            source={require('../../assets/images/backgroudlogin.png')}
            style={styles.backgroundImage}
        >
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView contentContainerStyle={styles.scrollView}>
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../../assets/images/mainiconapp.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>

                        <Text style={styles.title}>Đăng nhập</Text>
                        <Text style={styles.subtitle}>Nhập email và mật khẩu để đăng nhập</Text>

                        <View style={styles.form}>
                            <AuthInput
                                placeholder="Email"
                                value={email}
                                onChangeText={setEmail}
                                error={emailError}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                leftIcon={<Icon name='envelope' size={20} color={colors.darkGray} />}
                            />

                            <AuthInput
                                placeholder="Mật khẩu"
                                value={password}
                                onChangeText={setPassword}
                                error={passwordError}
                                secureTextEntry
                                leftIcon={<Icon name='lock' size={20} color={colors.darkGray} />}
                            />

                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Đăng nhập</Text>
                                )}
                            </TouchableOpacity>

                            {/* <Text style={styles.orText}>or</Text> */}

                            <TouchableOpacity
                                style={styles.registerLink}
                                onPress={() => navigation.navigate('Register')}
                            >
                                <Text style={styles.registerLinkText}>
                                    Chưa có tài khoản? Nhấn vào để đăng kí
                                </Text>
                            </TouchableOpacity>

                            <Text style={styles.orText}>or</Text>

                            <TouchableOpacity
                                style={styles.registerLink}
                                onPress={() => navigation.navigate('MainApp', { screen: 'HomeSreen' })}
                            >
                                <Text style={styles.registerLinkText}>
                                    Dùng với tư cách khách
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    container: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.9)', // Semi-transparent white
    },
    scrollView: {
        flexGrow: 1,
        padding: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 20,
    },
    logo: {
        width: 150,
        height: 150,
    },
    logoText: {
        fontSize: 16,
        color: colors.text,
        marginTop: 10,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 8,
        marginTop: 20,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: colors.darkGray,
        marginBottom: 15,
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    button: {
        backgroundColor: colors.primary,
        padding: 15,
        borderRadius: 8,
        marginTop: 20,
        marginBottom: 15,
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 16,
    },
    orText: {
        color: colors.darkGray,
        textAlign: 'center',
        marginVertical: 5,
    },
    registerLink: {
        marginTop: 0,
    },
    registerLinkText: {
        color: colors.primary,
        textAlign: 'center',
        fontSize: 14,
    },
    keyboardView: {
        flex: 1,
    },
});