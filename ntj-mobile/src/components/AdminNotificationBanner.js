/**
 * AdminNotificationBanner.js
 *
 * Fetches the latest active notification from /api/notifications/latest
 * and renders a swipeable pop-up banner at the top of the HomeScreen.
 * Swipe left or right to dismiss. Tap the ✕ button to close.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    PanResponder,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

export default function AdminNotificationBanner() {
    const [notification, setNotification] = useState(null);
    const [dismissed, setDismissed] = useState(false);

    const translateX = useRef(new Animated.Value(0)).current;
    const slideY    = useRef(new Animated.Value(-120)).current;
    const opacity   = useRef(new Animated.Value(0)).current;

    // ── Fetch from backend ───────────────────────────────────────────────────
    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const res = await api.get('/notifications/latest');
                if (active && res.data?.success && res.data?.data?.message) {
                    setNotification(res.data.data);
                }
            } catch (err) {
                console.log('[AdminNotificationBanner] fetch error:', err?.message);
            }
        })();
        return () => { active = false; };
    }, []);

    // ── Slide in once we have data ────────────────────────────────────────────
    useEffect(() => {
        if (notification && !dismissed) {
            Animated.parallel([
                Animated.spring(slideY, {
                    toValue: 0,
                    useNativeDriver: true,
                    speed: 14,
                    bounciness: 5,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [notification, dismissed]);

    // ── Pan responder for swipe ───────────────────────────────────────────────
    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, g) =>
                Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
            onPanResponderMove: (_, g) => {
                translateX.setValue(g.dx);
            },
            onPanResponderRelease: (_, g) => {
                if (Math.abs(g.dx) > SWIPE_THRESHOLD) {
                    slideDismiss(g.dx > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH);
                } else {
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    const slideDismiss = (toValue) => {
        Animated.parallel([
            Animated.timing(translateX, {
                toValue,
                duration: 280,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 280,
                useNativeDriver: true,
            }),
        ]).start(() => setDismissed(true));
    };

    const handleClose = () => slideDismiss(SCREEN_WIDTH);

    if (!notification || dismissed) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY: slideY }, { translateX }],
                    opacity,
                },
            ]}
            {...panResponder.panHandlers}
        >
            {/* Left swipe hint */}
            <View style={styles.swipeHint}>
                <Ionicons name="chevron-back" size={14} color="#a5d6a7" />
            </View>

            {/* Icon */}
            <View style={styles.iconBox}>
                <Ionicons name="megaphone" size={20} color="#2e7d32" />
            </View>

            {/* Text */}
            <View style={styles.textBox}>
                <Text style={styles.label}>📢 NOTICE</Text>
                <Text style={styles.message} numberOfLines={3}>
                    {notification.message}
                </Text>
            </View>

            {/* Close */}
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={22} color="#81c784" />
            </TouchableOpacity>

            {/* Right swipe hint */}
            <View style={styles.swipeHint}>
                <Ionicons name="chevron-forward" size={14} color="#a5d6a7" />
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 14,
        marginTop: Platform.OS === 'ios' ? 56 : 42,
        marginBottom: 4,
        backgroundColor: '#f1f8e9',
        borderRadius: 18,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderWidth: 1.5,
        borderColor: '#a5d6a7',
        shadowColor: '#2e7d32',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
        elevation: 8,
        zIndex: 9998,
    },
    swipeHint: {
        paddingHorizontal: 2,
        opacity: 0.6,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#e8f5e9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    textBox: {
        flex: 1,
        marginRight: 8,
    },
    label: {
        fontSize: 10,
        fontWeight: '800',
        color: '#2e7d32',
        letterSpacing: 1,
        marginBottom: 2,
    },
    message: {
        fontSize: 13,
        color: '#1b3223',
        fontWeight: '500',
        lineHeight: 18,
    },
});
