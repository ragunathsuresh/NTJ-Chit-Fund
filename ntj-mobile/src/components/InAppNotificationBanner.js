/**
 * InAppNotificationBanner.js
 * Renders floating in-app notification banners at the top of the screen.
 * Subscribes to the notificationService event emitter.
 * Works in Expo Go — no native push notifications needed.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { subscribeToNotifications } from '../services/notificationService';

const BANNER_DURATION = 4000; // ms — auto-dismiss after 4 seconds

const getIconAndColor = (notification) => {
    const { type, title } = notification;
    if (type === 'price_alert') {
        if (title?.includes('↑')) return { icon: 'trending-up', color: '#4CAF50' };
        if (title?.includes('↓')) return { icon: 'trending-down', color: '#FF4444' };
        return { icon: 'notifications', color: '#FFD700' };
    }
    if (type === 'order_update') {
        if (title?.includes('Approved') || title?.includes('Balance')) return { icon: 'checkmark-circle', color: '#10b981' };
        if (title?.includes('Payment')) return { icon: 'card', color: '#3b82f6' };
        return { icon: 'receipt', color: '#FFD700' };
    }
    return { icon: 'notifications', color: '#FFD700' };
};

const NotificationBanner = ({ notification, onDismiss }) => {
    const slideAnim = useRef(new Animated.Value(-120)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const timerRef = useRef(null);

    const { icon, color } = getIconAndColor(notification);

    useEffect(() => {
        // Slide in
        Animated.parallel([
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                speed: 20,
                bounciness: 4,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();

        // Auto-dismiss
        timerRef.current = setTimeout(dismiss, BANNER_DURATION);
        return () => clearTimeout(timerRef.current);
    }, []);

    const dismiss = () => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: -120,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => onDismiss());
    };

    return (
        <Animated.View
            style={[
                styles.banner,
                { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
            ]}
        >
            <View style={[styles.iconBox, { backgroundColor: color + '22' }]}>
                <Ionicons name={icon} size={22} color={color} />
            </View>
            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={1}>{notification.title}</Text>
                <Text style={styles.body} numberOfLines={2}>{notification.body}</Text>
            </View>
            <TouchableOpacity onPress={dismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={18} color="#888" />
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function InAppNotificationBanner() {
    const [queue, setQueue] = useState([]);

    useEffect(() => {
        const unsubscribe = subscribeToNotifications((notification) => {
            setQueue(prev => [...prev, notification]);
        });
        return unsubscribe;
    }, []);

    const dismiss = (id) => {
        setQueue(prev => prev.filter(n => n.id !== id));
    };

    if (queue.length === 0) return null;

    return (
        <View style={styles.container} pointerEvents="box-none">
            {/* Show only the latest 2 banners to avoid clutter */}
            {queue.slice(-2).map((notification) => (
                <NotificationBanner
                    key={notification.id}
                    notification={notification}
                    onDismiss={() => dismiss(notification.id)}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        paddingTop: Platform.OS === 'ios' ? 55 : 38,
        paddingHorizontal: 12,
        pointerEvents: 'box-none',
    },
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 10,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
        marginRight: 8,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
    },
    body: {
        color: '#999',
        fontSize: 12,
        lineHeight: 16,
    },
});
