import React, { useState, useEffect } from 'react';
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

// Inject CSS on web to override RN Web's overflow:hidden on html/body/#root
function useWebScrollFix() {
    useEffect(() => {
        if (Platform.OS !== 'web') return;
        const styleEl = document.createElement('style');
        styleEl.id = 'rn-web-scroll-fix';
        styleEl.innerHTML = [
            'html { overflow: auto !important; height: auto !important; }',
            'body { overflow: auto !important; height: auto !important; }',
            '#root { overflow: auto !important; height: auto !important; }',
        ].join(' ');
        document.head.appendChild(styleEl);
        // Restore when screen unmounts
        return () => {
            const el = document.getElementById('rn-web-scroll-fix');
            if (el) el.remove();
        };
    }, []);
}

export default function RegisterScreen({ navigation }) {
    useWebScrollFix(); // enable page scroll on web
    const { sendOtp } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleSendOtp = async () => {
        const { name, email, phone, password, confirmPassword } = formData;

        if (!name || !email || !phone || !password || !confirmPassword) {
            Alert.alert('Missing Fields', 'Please fill in all fields.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }

        if (phone.length < 10) {
            Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Passwords Mismatch', 'Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters.');
            return;
        }

        setIsLoading(true);
        try {
            const result = await sendOtp({ name, email, phone, password });

            if (result.success) {
                // Navigate directly — OTP is sent to the user's email only
                navigation.navigate('OtpVerification', { email, name });
            } else {
                const errorMsg = result.message || 'Failed to send OTP. Please try again.';
                const details = result.serverError ? `\n\n${result.serverError}` : '';
                Alert.alert('Error', errorMsg + details);
            }
        } catch (error) {
            console.error('handleSendOtp error:', error);
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const updateFormData = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header Section */}
                <LinearGradient
                    colors={['#e8f5e9', '#f1f8e9', '#f1f8e9']}
                    style={styles.headerGradient}
                >
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoText}>✦ NTJ</Text>
                    </View>
                    <Text style={styles.title}>Create Account</Text>
                </LinearGradient>

                {/* Form Card */}
                <View style={styles.formCard}>
                    {/* Step indicator */}
                    <View style={styles.stepRow}>
                        <View style={[styles.step, styles.stepActive]}>
                            <Text style={styles.stepTextActive}>1</Text>
                        </View>
                        <View style={styles.stepLine} />
                        <View style={styles.step}>
                            <Text style={styles.stepText}>2</Text>
                        </View>
                    </View>
                    <Text style={styles.stepLabel}>Step 1 of 2 — Enter your details</Text>

                    {/* Inputs */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Ragunath Kumar"
                            placeholderTextColor="#777"
                            value={formData.name}
                            onChangeText={(v) => updateFormData('name', v)}
                            editable={!isLoading}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Email Address</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="example@gmail.com"
                            placeholderTextColor="#777"
                            value={formData.email}
                            onChangeText={(v) => updateFormData('email', v)}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!isLoading}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Phone Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="10-digit mobile number"
                            placeholderTextColor="#777"
                            value={formData.phone}
                            onChangeText={(v) => updateFormData('phone', v)}
                            keyboardType="phone-pad"
                            editable={!isLoading}
                            maxLength={10}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Password</Text>
                        <View style={styles.passwordRow}>
                            <TextInput
                                style={[styles.input, styles.passwordInput]}
                                placeholder="Min. 6 characters"
                                placeholderTextColor="#777"
                                value={formData.password}
                                onChangeText={(v) => updateFormData('password', v)}
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

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Confirm Password</Text>
                        <View style={styles.passwordRow}>
                            <TextInput
                                style={[styles.input, styles.passwordInput]}
                                placeholder="Re-enter password"
                                placeholderTextColor="#777"
                                value={formData.confirmPassword}
                                onChangeText={(v) => updateFormData('confirmPassword', v)}
                                secureTextEntry={!showConfirm}
                                editable={!isLoading}
                            />
                            <TouchableOpacity
                                style={styles.eyeBtn}
                                onPress={() => setShowConfirm(!showConfirm)}
                            >
                                <Text style={styles.eyeText}>{showConfirm ? '🙈' : '👁️'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                        onPress={handleSendOtp}
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
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.buttonText}>✓ Register & Verify OTP →</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {isLoading && (
                        <Text style={styles.loadingHint}>Sending OTP to your email address...</Text>
                    )}

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.link}>Login</Text>
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
        backgroundColor: '#f1f8e9',
    },
    scrollContent: {
        // flexGrow:0 is critical: lets content be taller than the screen → scroll activates
        flexGrow: 0,
        paddingBottom: 40,
    },
    headerGradient: {
        paddingTop: 60,
        paddingBottom: 36,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logoText: {
        fontSize: 40,
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
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    step: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#e8f5e9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepActive: {
        backgroundColor: '#2e7d32',
        borderColor: '#2e7d32',
    },
    stepText: {
        color: '#81c784',
        fontWeight: 'bold',
        fontSize: 14,
    },
    stepTextActive: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    stepLine: {
        width: 40,
        height: 2,
        backgroundColor: '#e8f5e9',
        marginHorizontal: 8,
    },
    stepLabel: {
        textAlign: 'center',
        color: '#4caf50',
        fontSize: 12,
        marginBottom: 24,
        fontWeight: '600'
    },
    inputGroup: {
        marginBottom: 14,
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
    loadingHint: {
        textAlign: 'center',
        color: '#2e7d32',
        fontSize: 13,
        marginBottom: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
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
