import React, { useState, useRef, useEffect } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import authService from '../services/authService';

const OTP_LENGTH = 6;
const RESEND_TIMER = 30;

export default function ResetPasswordScreen({ route, navigation }) {
    const { email } = route.params || {};
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(RESEND_TIMER);
    const [canResend, setCanResend] = useState(false);
    
    const inputs = useRef([]);

    useEffect(() => {
        let interval;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer(prev => prev - 1);
            }, 1000);
        } else {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleOtpChange = (value, index) => {
        const sanitized = value.replace(/[^0-9]/g, '');
        const newOtp = [...otp];
        newOtp[index] = sanitized;
        setOtp(newOtp);

        if (sanitized && index < OTP_LENGTH - 1) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const getOtpValue = () => otp.join('');

    const handleResendOtp = async () => {
        if (!canResend) return;
        
        setIsLoading(true);
        try {
            const result = await authService.forgotPassword(email);
            if (result.success) {
                Alert.alert('Success', 'A new OTP has been sent to your email.');
                setResendTimer(RESEND_TIMER);
                setCanResend(false);
                setOtp(['', '', '', '', '', '']);
                inputs.current[0]?.focus();
            } else {
                Alert.alert('Error', result.message || 'Failed to resend OTP');
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        const otpValue = getOtpValue();
        if (otpValue.length < OTP_LENGTH) {
            Alert.alert('Error', 'Please enter the 6-digit OTP');
            return;
        }
        if (!newPassword || newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            const result = await authService.resetPassword(email, otpValue, newPassword);

            if (result.success) {
                Alert.alert(
                    'Success', 
                    'Password reset successful. You can now login with your new password.',
                    [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
                );
            } else {
                Alert.alert('Error', result.message || 'Failed to reset password');
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'An error occurred during password reset');
        } finally {
            setIsLoading(false);
        }
    };

    const maskedEmail = email
        ? email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(b.length) + c)
        : '';

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <LinearGradient
                    colors={['#1a1200', '#2d1f00', '#121212']}
                    style={styles.headerGradient}
                >
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()}
                        style={styles.backBtn}
                    >
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>

                    <View style={styles.iconCircle}>
                        <Text style={styles.iconText}>🛡️</Text>
                    </View>
                    <Text style={styles.title}>Reset Password</Text>
                    <Text style={styles.subtitle}>Enter OTP sent to your email {maskedEmail}</Text>
                </LinearGradient>

                <View style={styles.formCard}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Enter 6-Digit OTP</Text>
                        <View style={styles.otpRow}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={ref => (inputs.current[index] = ref)}
                                    style={[
                                        styles.otpBox,
                                        digit ? styles.otpBoxFilled : null,
                                    ]}
                                    value={digit}
                                    onChangeText={(v) => handleOtpChange(v, index)}
                                    onKeyPress={(e) => handleKeyPress(e, index)}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    editable={!isLoading}
                                />
                            ))}
                        </View>
                        
                        <View style={styles.resendContainer}>
                            {canResend ? (
                                <TouchableOpacity onPress={handleResendOtp} disabled={isLoading}>
                                    <Text style={styles.resendLink}>Resend OTP</Text>
                                </TouchableOpacity>
                            ) : (
                                <Text style={styles.resendTimerText}>Resend OTP in {resendTimer}s</Text>
                            )}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>New Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Min. 6 characters"
                            placeholderTextColor="#777"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                            editable={!isLoading}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Confirm New Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Re-enter new password"
                            placeholderTextColor="#777"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            editable={!isLoading}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                        onPress={handleResetPassword}
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
                                <Text style={styles.buttonText}>Reset Password</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
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
        flexGrow: 1,
    },
    headerGradient: {
        paddingTop: 52,
        paddingBottom: 32,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    backBtn: {
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    backText: {
        color: '#2e7d32',
        fontSize: 15,
        fontWeight: '700',
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#e8f5e9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        borderWidth: 1.5,
        borderColor: '#c8e6c9',
    },
    iconText: {
        fontSize: 28,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1b3223',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 13,
        color: '#4caf50',
        textAlign: 'center',
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
        marginBottom: 18,
    },
    inputLabel: {
        color: '#1b3223',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
    },
    otpRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    otpBox: {
        width: 44,
        height: 52,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#e8f5e9',
        backgroundColor: '#f9f9f9',
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1b3223',
    },
    otpBoxFilled: {
        borderColor: '#2e7d32',
        backgroundColor: '#f1f8e9',
    },
    resendContainer: {
        alignItems: 'flex-end',
        marginTop: 10,
    },
    resendLink: {
        color: '#2e7d32',
        fontSize: 14,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
    resendTimerText: {
        color: '#888',
        fontSize: 13,
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
    button: {
        borderRadius: 14,
        overflow: 'hidden',
        marginTop: 10,
        marginBottom: 20,
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
});
