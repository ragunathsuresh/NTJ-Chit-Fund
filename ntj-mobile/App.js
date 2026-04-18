import React, { useEffect, useRef, useState } from 'react';
import { StatusBar, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import InAppNotificationBanner from './src/components/InAppNotificationBanner';
import {
    requestNotificationPermission,
    sendPriceAlertNotification,
    checkAlertConditions,
} from './src/services/notificationService';
import api from './src/services/api';

const SETTINGS_KEY = 'app_notification_settings';

// ─── Error Boundary ──────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('App Error:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Something went wrong!</Text>
                    <Text style={styles.errorDetails}>{this.state.error?.toString()}</Text>
                </View>
            );
        }
        return this.props.children;
    }
}

// ─── Biometric Gate ──────────────────────────────────────────────────────────
function BiometricGate({ children }) {
    // Default to true so the app renders immediately (no spinner blink on startup)
    // Only block if biometric IS enabled and hardware IS available
    const [authenticated, setAuthenticated] = useState(true);
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        checkBiometric();
    }, []);

    const checkBiometric = async () => {
        try {
            const saved = await AsyncStorage.getItem(SETTINGS_KEY);
            const settings = saved ? JSON.parse(saved) : {};

            // If biometric not enabled in settings, skip entirely — no blink
            if (!settings.biometricEnabled) return;

            // Biometric IS enabled — now block the app and check
            setChecking(true);
            setAuthenticated(false);

            let LocalAuthentication;
            try {
                LocalAuthentication = require('expo-local-authentication');
            } catch (e) {
                // Not available in Expo Go — skip silently
                setAuthenticated(true);
                setChecking(false);
                return;
            }

            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (!hasHardware || !isEnrolled) {
                setAuthenticated(true);
                setChecking(false);
                return;
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate to access NTJ',
                cancelLabel: 'Cancel',
                disableDeviceFallback: false,
            });

            setAuthenticated(result.success);
            setChecking(false);

            if (!result.success) {
                setTimeout(checkBiometric, 1500);
            }
        } catch (error) {
            console.log('Biometric check skipped:', error.message);
            setAuthenticated(true);
            setChecking(false);
        }
    };

    if (checking && !authenticated) {
        return (
            <View style={styles.authContainer}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.authText}>Authenticating...</Text>
            </View>
        );
    }

    if (!authenticated) {
        return (
            <View style={styles.authContainer}>
                <Text style={styles.authText}>Authentication required</Text>
                <Text style={styles.authSubText}>Please authenticate to continue</Text>
            </View>
        );
    }

    return children;
}

// ─── Price Alert Poller ──────────────────────────────────────────────────────
function AlertPoller() {
    const pollingRef = useRef(null);
    const firedAlertIds = useRef(new Set());
    const isFirstRun = useRef(true);

    useEffect(() => {
        requestNotificationPermission();

        // Delay first check by 3s to let auth/app load settle
        const firstCheckTimer = setTimeout(() => {
            checkPricesAndNotify();
            pollingRef.current = setInterval(checkPricesAndNotify, 30000);
        }, 3000);

        return () => {
            clearTimeout(firstCheckTimer);
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, []);

    const getSettings = async () => {
        try {
            const saved = await AsyncStorage.getItem(SETTINGS_KEY);
            return saved ? JSON.parse(saved) : { pushNotifications: true, priceAlerts: true };
        } catch {
            return { pushNotifications: true, priceAlerts: true };
        }
    };

    const checkPricesAndNotify = async () => {
        try {
            const settings = await getSettings();
            if (!settings.pushNotifications || !settings.priceAlerts) return;

            // Check if user is logged in before making authenticated requests
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const ratesRes = await api.get('/rates');
            if (!ratesRes.data?.success) return;

            const { gold, silver } = ratesRes.data.data;

            const alertsRes = await api.get('/alerts');
            if (!alertsRes.data?.success) return;

            const activeAlerts = (alertsRes.data.data || []).filter(a => a.isActive && !a.triggered);
            if (activeAlerts.length === 0) return;

            const triggered = checkAlertConditions(activeAlerts, gold?.sellPrice, silver?.sellPrice);

            for (const { alert, currentPrice } of triggered) {
                if (firedAlertIds.current.has(alert._id)) continue;
                firedAlertIds.current.add(alert._id);

                await sendPriceAlertNotification({
                    metal: alert.metalType,
                    type: alert.type,
                    targetPrice: alert.targetPrice,
                    currentPrice,
                });

                try { await api.patch(`/alerts/${alert._id}/trigger`); } catch { }
            }
        } catch (error) {
            // Silently ignore — non-critical background task
            if (error?.message && error.message !== 'Network Error' && !error.message.includes('401')) {
                console.log('Price check (non-critical):', error.message);
            }
        }
    };

    return null;
}

// ─── Root App ────────────────────────────────────────────────────────────────
export default function App() {
    return (
        <ErrorBoundary>
            <SafeAreaProvider>
                <ThemeProvider>
                    <AuthProvider>
                        <StatusBar style="auto" />
                        <BiometricGate>
                            <AlertPoller />
                            <AppNavigator />
                            {/* In-app notification overlay — rendered above everything */}
                            <InAppNotificationBanner />
                        </BiometricGate>
                    </AuthProvider>
                </ThemeProvider>
            </SafeAreaProvider>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    errorContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
        padding: 20, backgroundColor: '#121212',
    },
    errorText: { fontSize: 20, fontWeight: 'bold', color: 'red', marginBottom: 10 },
    errorDetails: { fontSize: 14, color: '#666' },
    authContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
        backgroundColor: '#121212',
    },
    authText: { color: '#FFD700', fontSize: 18, fontWeight: 'bold', marginTop: 20 },
    authSubText: { color: '#888', fontSize: 14, marginTop: 8 },
});
