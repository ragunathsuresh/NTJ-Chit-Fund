import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen({ navigation }) {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setIsLoading(true);
        try {
            const result = await login({ email, password });

            if (result.success) {
                // Navigation will be handled by app state change
            } else {
                Alert.alert('Error', result.message || 'Login failed');
            }
        } catch (error) {
            Alert.alert('Error', 'An error occurred during login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                {/* Header Section */}
                <LinearGradient
                    colors={['#e8f5e9', '#f1f8e9', '#f1f8e9']}
                    style={styles.headerGradient}
                >
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoText}>✦ NTJ</Text>
                    </View>
                    <Text style={styles.title}>Welcome Back</Text>
                </LinearGradient>

                {/* Form Card */}
                <View style={styles.formCard}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Email or Phone</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="example@gmail.com"
                            placeholderTextColor="#777"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!isLoading}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Password</Text>
                        <View style={styles.passwordRow}>
                            <TextInput
                                style={[styles.input, styles.passwordInput]}
                                placeholder="Your password"
                                placeholderTextColor="#777"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                editable={!isLoading}
                            />
                            <TouchableOpacity
                                style={styles.eyeBtn}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity 
                        onPress={() => navigation.navigate('ForgotPassword')}
                        style={styles.forgotPasswordContainer}
                    >
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={isLoading}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={['#2e7d32', '#1b5e20']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.buttonGradient}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>Login →</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.link}>Register</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f8e9', // Light green background
    },
    scrollContent: {
        flexGrow: 1,
    },
    headerGradient: {
        paddingTop: 80,
        paddingBottom: 40,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoText: {
        fontSize: 48,
        fontWeight: '900',
        color: '#2e7d32',
        letterSpacing: 6,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1b3223',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: '#4caf50',
    },
    formCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        marginTop: -12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        color: '#1b3223',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: '#1b3223',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    passwordRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    passwordInput: {
        flex: 1,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        borderRightWidth: 0,
    },
    eyeBtn: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    eyeText: {
        fontSize: 16,
    },
    forgotPasswordContainer: {
        alignSelf: 'flex-end',
        marginBottom: 24,
        marginTop: -4,
    },
    forgotPasswordText: {
        color: '#4caf50',
        fontSize: 13,
        fontWeight: '500',
    },
    button: {
        borderRadius: 14,
        overflow: 'hidden',
        marginTop: 10,
        marginBottom: 8,
        elevation: 4,
        shadowColor: '#2e7d32',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    buttonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        color: '#666',
        fontSize: 14,
    },
    link: {
        color: '#2e7d32',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
