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
    Alert,
    Image,
    ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';  // Hoặc các bộ icon khác như Ionicons, MaterialIcons

import { useNavigation } from '@react-navigation/native';
import { AuthInput } from '../../components/auth/AuthInput';
import { colors } from '../../utils/colors';
import { register } from '../../services/authServices';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    MainApp: undefined;
};


type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

export default function RegisterScreen() {
    const navigation = useNavigation<RegisterScreenNavigationProp>();
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const [usernameError, setUsernameError] = useState('');
    const [displayNameError, setDisplayNameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const validateForm = () => {
        let isValid = true;

        // Reset all errors
        setUsernameError('');
        setDisplayNameError('');
        setEmailError('');
        setPasswordError('');

        // Validate username
        if (!username.trim()) {
            setUsernameError('Vui lòng nhập tên đăng nhập');
            isValid = false;
        } else if (username.length < 3) {
            setUsernameError('Tên đăng nhập phải có ít nhất 3 ký tự');
            isValid = false;
        } else if (!username.match(/^[a-zA-Z0-9_]+$/)) {
            setUsernameError('Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới');
            isValid = false;
        } else if (username.length > 30) {
            setUsernameError('Tên đăng nhập không được quá 30 ký tự');
            isValid = false;
        }

        // Validate displayName
        if (!displayName.trim()) {
            setDisplayNameError('Vui lòng nhập tên đầy đủ của bạn!');
            isValid = false;
        }

        // Validate email
        if (!email.trim()) {
            setEmailError('Vui lòng nhập email');
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            setEmailError('Email không hợp lệ');
            isValid = false;
        }

        // Validate password
        if (!password) {
            setPasswordError('Vui lòng nhập mật khẩu');
            isValid = false;
        } else if (password.length < 6) {
            setPasswordError('Mật khẩu phải có ít nhất 6 ký tự');
            isValid = false;
        }

        return isValid;
    };

    const handleRegister = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const result = await register(email, password, username, displayName);

            if (result.success) {
                Alert.alert(
                    'Thành công',
                    'Đăng ký tài khoản thành công!',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.navigate('Login'),
                        },
                    ],
                    { cancelable: false }
                );
            } else {
                Alert.alert('Lỗi', result.message || 'Đã có lỗi xảy ra khi đăng ký');
            }
        } catch (error) {
            console.error('Lỗi đăng ký:', error);
            Alert.alert('Lỗi', 'Đã có lỗi xảy ra khi đăng ký');
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

                        <Text style={styles.title}>Tạo tài khoản</Text>
                        <Text style={styles.subtitle}>Nhập thông tin để đăng ký</Text>

                        <View style={styles.form}>
                            <AuthInput
                                placeholder="Tên đăng nhập"
                                value={username}
                                onChangeText={setUsername}
                                error={usernameError}
                                leftIcon={<Icon name='User' size={20} color={colors.darkGray} />}
                            />

                            <AuthInput
                                placeholder="Tên hiển thị"
                                value={displayName}
                                onChangeText={setDisplayName}
                                error={displayNameError}
                                leftIcon={<Icon name='User' size={20} color={colors.darkGray} />}
                            />

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
                                onPress={handleRegister}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Đăng ký</Text>
                                )}
                            </TouchableOpacity>

                            <Text style={styles.orText}>or</Text>

                            <TouchableOpacity
                                style={styles.loginLink}
                                onPress={() => navigation.navigate('Login')}
                            >
                                <Text style={styles.loginLinkText}>
                                    Đã có tài khoản? Nhấn vào để đăng nhập
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
        marginVertical: 20,
    },
    loginLink: {
        marginTop: 0,
    },
    loginLinkText: {
        color: colors.primary,
        textAlign: 'center',
        fontSize: 14,
    },
    keyboardView: {
        flex: 1,
    },
});