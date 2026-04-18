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
import authService from '../services/authService';

export default function ForgotPasswordScreen({ navigation }) {
    const [identifier, setIdentifier] = useState(''); // email or phone
    const [isLoading, setIsLoading] = useState(false);

    const handleRequestOtp = async () => {
        if (!identifier.trim()) {
            Alert.alert('Error', 'Please enter your email address or phone number');
            return;
        }

        setIsLoading(true);
        try {
            const result = await authService.forgotPassword(identifier.trim());

            if (result.success) {
                Alert.alert(
                    'OTP Sent',
                    `A password reset OTP has been sent to your registered email (${result.maskedEmail || 'your email'}). Please check your inbox.`,
                    [{ text: 'OK', onPress: () => navigation.navigate('ResetPassword', { email: result.email || identifier.trim() }) }]
                );
            } else {
                Alert.alert('Error', result.message || 'Check your details and try again.');
            }
        } catch (error) {
            Alert.alert('Network Error', error.message || 'Could not connect to server. Check your backend and network.');
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
                <LinearGradient
                    colors={['#e8f5e9', '#f1f8e9', '#f1f8e9']}
                    style={styles.headerGradient}
                >
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()}
                        style={styles.backBtn}
                    >
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>

                    <View style={styles.iconCircle}>
                        <Text style={styles.iconText}>🔑</Text>
                    </View>
                    <Text style={styles.title}>Forgot Password</Text>
                    <Text style={styles.subtitle}>Enter your email or phone number to receive a reset OTP via Email</Text>
                </LinearGradient>

                <View style={styles.formCard}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Email or Phone Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Email or 10-digit phone number"
                            placeholderTextColor="#777"
                            value={identifier}
                            onChangeText={setIdentifier}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="default"
                            editable={!isLoading}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                        onPress={handleRequestOtp}
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
                                <Text style={styles.buttonText}>Send OTP →</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Back to </Text>
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
        flexGrow: 1,
    },
    headerGradient: {
        paddingTop: 60,
        paddingBottom: 40,
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
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1b3223',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: '#4caf50',
        textAlign: 'center',
        fontWeight: '500'
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
        marginBottom: 24,
        marginTop: 10,
    },
    inputLabel: {
        color: '#1b3223',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
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
