import React, { useState, useEffect, useRef } from 'react';
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
    Animated,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function OtpVerificationScreen({ route, navigation }) {
    // Now receives `email` from RegisterScreen (not phone)
    const { email, name } = route.params || {};
    const { verifyOtpAndRegister, resendOtp } = useAuth();

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
    const [canResend, setCanResend] = useState(false);

    const inputs = useRef([]);
    const shakeAnim = useRef(new Animated.Value(0)).current;

    // Countdown timer
    useEffect(() => {
        if (countdown <= 0) {
            setCanResend(true);
            return;
        }
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    const shakeBoxes = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start();
    };

    const handleOtpChange = (value, index) => {
        const sanitized = value.replace(/[^0-9]/g, '');
        const newOtp = [...otp];

        if (sanitized.length > 1) {
            // Handle paste — fill from current index
            const chars = sanitized.split('');
            for (let i = 0; i < OTP_LENGTH - index; i++) {
                if (chars[i]) newOtp[index + i] = chars[i];
            }
            setOtp(newOtp);
            const nextIdx = Math.min(index + chars.length, OTP_LENGTH - 1);
            inputs.current[nextIdx]?.focus();
            return;
        }

        newOtp[index] = sanitized;
        setOtp(newOtp);

        if (sanitized && index < OTP_LENGTH - 1) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace') {
            const newOtp = [...otp];
            if (!newOtp[index] && index > 0) {
                newOtp[index - 1] = '';
                setOtp(newOtp);
                inputs.current[index - 1]?.focus();
            } else {
                newOtp[index] = '';
                setOtp(newOtp);
            }
        }
    };

    const getOtpValue = () => otp.join('');

    const handleVerify = async () => {
        const otpValue = getOtpValue();
        if (otpValue.length < OTP_LENGTH) {
            shakeBoxes();
            Alert.alert('Incomplete OTP', 'Please enter all 6 digits of the OTP.');
            return;
        }

        setIsVerifying(true);
        try {
            // Pass email (not phone) to the context
            const result = await verifyOtpAndRegister(email, otpValue);

            if (result.success) {
                // isAuthenticated becomes true in AuthContext → AppNavigator auto-navigates
            } else {
                shakeBoxes();
                setOtp(['', '', '', '', '', '']);
                inputs.current[0]?.focus();
                Alert.alert('Verification Failed', result.message || 'Invalid OTP. Please try again.');
            }
        } catch (error) {
            shakeBoxes();
            Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;
        setIsResending(true);
        try {
            // Pass email to resend
            const result = await resendOtp(email);
            if (result.success) {
                setOtp(['', '', '', '', '', '']);
                inputs.current[0]?.focus();
                setCountdown(RESEND_COOLDOWN);
                setCanResend(false);
                Alert.alert('OTP Resent', `A new OTP has been sent to ${email}.`);
            } else {
                Alert.alert('Failed', result.message || 'Could not resend OTP. Please try again.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to resend OTP.');
        } finally {
            setIsResending(false);
        }
    };

    // Mask email: ra*****@gmail.com
    const maskedEmail = email
        ? email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(b.length) + c)
        : '';

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            {/* Header */}
            <LinearGradient
                colors={['#1a1200', '#2d1f00', '#121212']}
                style={styles.headerGradient}
            >
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>

                <View style={styles.iconCircle}>
                    <Text style={styles.iconText}>✉️</Text>
                </View>
                <Text style={styles.title}>Verify Your Email</Text>
                <Text style={styles.subtitle}>
                    Hi {name ? name.split(' ')[0] : 'there'}! We sent a 6-digit OTP to
                </Text>
                <Text style={styles.emailText}>{maskedEmail}</Text>
                <Text style={styles.emailHint}>Check your inbox & spam folder</Text>
            </LinearGradient>

            {/* Card */}
            <View style={styles.card}>
                {/* Step indicator */}
                <View style={styles.stepRow}>
                    <View style={[styles.step, styles.stepDone]}>
                        <Text style={styles.stepTextDone}>✓</Text>
                    </View>
                    <View style={[styles.stepLine, styles.stepLineDone]} />
                    <View style={[styles.step, styles.stepActive]}>
                        <Text style={styles.stepTextActive}>2</Text>
                    </View>
                </View>
                <Text style={styles.stepLabel}>Step 2 of 2 — Enter OTP sent to your email</Text>

                {/* OTP Boxes */}
                <Animated.View
                    style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}
                >
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
                            maxLength={6}
                            selectTextOnFocus
                            returnKeyType="next"
                            caretHidden={true}
                        />
                    ))}
                </Animated.View>

                <Text style={styles.otpHint}>Check your email inbox (and spam/junk folder).</Text>

                {/* Verify Button */}
                <TouchableOpacity
                    style={[styles.button, isVerifying && styles.buttonDisabled]}
                    onPress={handleVerify}
                    disabled={isVerifying}
                    activeOpacity={0.85}
                >
                    <LinearGradient
                        colors={['#2e7d32', '#1b5e20']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.buttonGradient}
                    >
                        {isVerifying ? (
                            <View style={styles.loadingRow}>
                                <ActivityIndicator color="#FFFFFF" size="small" />
                                <Text style={[styles.buttonText, { marginLeft: 8 }]}>Verifying...</Text>
                            </View>
                        ) : (
                            <Text style={styles.buttonText}>✓ Verify & Create Account</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                {/* Resend */}
                <View style={styles.resendRow}>
                    {canResend ? (
                        <TouchableOpacity onPress={handleResend} disabled={isResending}>
                            {isResending ? (
                                <ActivityIndicator color="#2e7d32" size="small" />
                            ) : (
                                <Text style={styles.resendLink}>Resend OTP to email</Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <Text style={styles.countdownText}>
                            Resend OTP in{' '}
                            <Text style={styles.countdownNum}>{countdown}s</Text>
                        </Text>
                    )}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Wrong email? </Text>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.link}>Go back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f8e9',
    },
    headerGradient: {
        paddingTop: 52,
        paddingBottom: 32,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    backBtn: {
        alignSelf: 'flex-start',
        marginBottom: 20,
    },
    backText: {
        color: '#2e7d32',
        fontSize: 15,
        fontWeight: '700',
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#e8f5e9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        borderWidth: 1.5,
        borderColor: '#c8e6c9',
    },
    iconText: {
        fontSize: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1b3223',
        marginBottom: 8,
    },
    subtitle: {
        color: '#4caf50',
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '500',
    },
    emailText: {
        color: '#2e7d32',
        fontSize: 15,
        fontWeight: '700',
        marginTop: 4,
    },
    emailHint: {
        color: '#81c784',
        fontSize: 12,
        marginTop: 4,
        fontWeight: '500',
    },
    card: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 28,
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
    stepDone: { backgroundColor: '#43a047', borderColor: '#43a047' },
    stepActive: { backgroundColor: '#2e7d32', borderColor: '#2e7d32' },
    stepTextDone: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    stepTextActive: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
    stepLine: { width: 40, height: 2, backgroundColor: '#e8f5e9', marginHorizontal: 8 },
    stepLineDone: { backgroundColor: '#43a047' },
    stepLabel: {
        textAlign: 'center',
        color: '#4caf50',
        fontSize: 12,
        marginBottom: 28,
        fontWeight: '600',
    },
    otpRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    otpBox: {
        width: 48,
        height: 58,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#e8f5e9',
        backgroundColor: '#f9f9f9',
        textAlign: 'center',
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1b3223',
    },
    otpBoxFilled: {
        borderColor: '#2e7d32',
        backgroundColor: '#f1f8e9',
    },
    otpHint: {
        color: '#81c784',
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 24,
        marginTop: 4,
        fontWeight: '500',
    },
    button: {
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#2e7d32',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    buttonGradient: { paddingVertical: 16, alignItems: 'center' },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
    loadingRow: { flexDirection: 'row', alignItems: 'center' },
    resendRow: { alignItems: 'center', marginBottom: 16 },
    resendLink: {
        color: '#2e7d32',
        fontWeight: 'bold',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    countdownText: { color: '#81c784', fontSize: 13, fontWeight: '500' },
    countdownNum: { color: '#2e7d32', fontWeight: 'bold' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
    footerText: { color: '#666', fontSize: 14 },
    link: { color: '#2e7d32', fontSize: 14, fontWeight: 'bold' },
});
