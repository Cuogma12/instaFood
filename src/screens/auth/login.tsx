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


type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    MainApp: undefined;
};

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
        } else {
            setEmailError('');
        }
        
        // Validate password
        if (!password) {
            setPasswordError('Vui lòng nhập mật khẩu');
            isValid = false;
        } else {
            setPasswordError('');
        }
        
        return isValid;
    };

    const handleLogin = async () => {
        // Reset error messages
        setEmailError('');
        setPasswordError('');

        // Kiểm tra hợp lệ trước khi login
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const result = await login(email, password);
            
            if (result.success) {
                navigation.navigate('MainApp');
            } else {
                const errorMessage = result.message || 'Đăng nhập thất bại';
                // Hiển thị lỗi dựa trên loại lỗi trả về
                if (errorMessage.includes('Email') || errorMessage.includes('email')) {
                    setEmailError(errorMessage);
                } else if (errorMessage.includes('Mật khẩu')) {
                    setPasswordError(errorMessage);
                } else {
                    // Nếu lỗi không xác định được là email hay password
                    setEmailError(errorMessage);
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            setEmailError('Đăng nhập thất bại');
        } finally {
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
                                leftIcon={<Icon name='Mail' size={20} color={colors.darkGray} />}
                            />

                            <AuthInput
                                placeholder="Mật khẩu"
                                value={password}
                                onChangeText={setPassword}
                                error={passwordError}
                                secureTextEntry
                                leftIcon={<Icon name='Lock' size={20} color={colors.darkGray} />}
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
                                onPress={() => navigation.navigate('MainApp')}
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