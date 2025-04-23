import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { colors } from '../../utils/colors';

interface AuthInputProps extends TextInputProps {
    error?: string;
    leftIcon?: React.ReactNode;
}

export const AuthInput: React.FC<AuthInputProps> = ({ 
    error, 
    leftIcon,
    style,
    ...props 
}) => {
    return (
        <View style={styles.container}>
            <View style={[
                styles.inputContainer,
                error ? styles.inputError : null
            ]}>
                {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
                <TextInput
                    style={[styles.input, style]}
                    placeholderTextColor={colors.darkGray}
                    {...props}
                />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 15,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.lightGray,
        borderRadius: 5,
        backgroundColor: '#fff',
    },
    iconContainer: {
        paddingLeft: 12,
    },
    input: {
        flex: 1,
        padding: 12,
        fontSize: 16,
        color: colors.text,
    },
    inputError: {
        borderColor: colors.error,
    },
    errorText: {
        color: colors.error,
        fontSize: 12,
        marginTop: 5,
    },
});