/**
 * notificationService.js
 *
 * In-app notification system — works 100% in Expo Go (SDK 53+).
 *
 * expo-notifications was removed from Expo Go on Android from SDK 53+.
 * This module replaces it with an in-app notification queue that components
 * can subscribe to and display as overlay banners.
 *
 * When you move to a production build (EAS), replace this with
 * expo-notifications for real push notifications.
 */

// ─── In-App Notification Queue ───────────────────────────────────────────────
let _listeners = [];
let _notificationQueue = [];

/**
 * Emit an in-app notification to all registered listeners (e.g. InAppNotificationBanner)
 */
const emitNotification = (notification) => {
    _notificationQueue.push(notification);
    _listeners.forEach(cb => cb(notification));
};

/**
 * Subscribe to in-app notifications.
 * Returns a function to unsubscribe.
 */
export const subscribeToNotifications = (callback) => {
    _listeners.push(callback);
    return () => {
        _listeners = _listeners.filter(cb => cb !== callback);
    };
};

// ─── Stub: permission always "granted" in-app ────────────────────────────────
export const requestNotificationPermission = async () => true;

export const getPermissionsAsync = async () => ({ status: 'granted' });

export const setupNotificationHandler = () => { /* no-op for Expo Go */ };

// ─── Send In-App Notification ────────────────────────────────────────────────
export const scheduleNotificationAsync = async ({ content }) => {
    emitNotification({
        id: Date.now().toString(),
        title: content.title || '',
        body: content.body || '',
        data: content.data || {},
        timestamp: new Date(),
    });
};

// ─── Price Alert Notification ─────────────────────────────────────────────────
export const sendPriceAlertNotification = async ({ metal, type, targetPrice, currentPrice }) => {
    const metalEmoji = metal === 'gold' ? '🪙' : '⚪';
    const metalName = metal === 'gold' ? 'Gold' : 'Silver';
    const fmt = (n) => (n || 0).toLocaleString('en-IN');

    let title = '';
    let body = '';

    if (type === 'UPPER') {
        title = `${metalEmoji} ${metalName} Alert! ↑`;
        body = `${metalName} hit ₹${fmt(currentPrice)} — above your ₹${fmt(targetPrice)} target`;
    } else if (type === 'LOWER') {
        title = `${metalEmoji} ${metalName} Alert! ↓`;
        body = `${metalName} hit ₹${fmt(currentPrice)} — below your ₹${fmt(targetPrice)} target`;
    } else {
        title = `${metalEmoji} ${metalName} Hit Your Target! 🎯`;
        body = `${metalName} at ₹${fmt(currentPrice)} — matches your ₹${fmt(targetPrice)} target`;
    }

    emitNotification({
        id: Date.now().toString(),
        title,
        body,
        data: { metal, type, targetPrice, currentPrice },
        timestamp: new Date(),
        type: 'price_alert',
    });

    console.log(`📢 In-app alert: ${title}`);
};

// ─── Order/Payment Notification ───────────────────────────────────────────────
export const sendOrderNotification = async (type, details = {}) => {
    const templates = {
        request_submitted: {
            title: '📋 Chit Fund Request Submitted',
            body: `Your ${details.metalType || ''} request of ₹${details.amount || ''}/month is pending admin approval.`,
        },
        request_approved: {
            title: '✅ Request Approved!',
            body: 'Your chit fund plan was approved! You can now make monthly payments.',
        },
        payment_submitted: {
            title: '💳 Payment Submitted',
            body: `Month ${details.month || ''} payment of ₹${details.amount || ''} submitted. Ref: ${details.upiRef || 'N/A'}`,
        },
        payment_approved: {
            title: '🪙 Balance Updated!',
            body: `Admin approved your payment. ${details.grams || ''} ${details.metalType || 'metal'} added to your portfolio!`,
        },
    };

    const template = templates[type];
    if (!template) return;

    emitNotification({
        id: Date.now().toString(),
        title: template.title,
        body: template.body,
        data: { type, ...details },
        timestamp: new Date(),
        type: 'order_update',
    });
};

// ─── Stubs for compatibility ──────────────────────────────────────────────────
export const addNotificationReceivedListener = () => ({ remove: () => {} });
export const addNotificationResponseReceivedListener = () => ({ remove: () => {} });
export const removeNotificationSubscription = () => {};

// ─── Alert Condition Checker ──────────────────────────────────────────────────
export const checkAlertConditions = (alerts, goldPrice, silverPrice) => {
    const triggered = [];
    for (const alert of alerts) {
        if (!alert.isActive || alert.triggered) continue;
        const currentPrice = alert.metalType === 'gold' ? goldPrice : silverPrice;
        if (!currentPrice) continue;
        let shouldFire = false;
        if (alert.type === 'UPPER' && currentPrice >= alert.targetPrice) shouldFire = true;
        else if (alert.type === 'LOWER' && currentPrice <= alert.targetPrice) shouldFire = true;
        else if (alert.type === 'TARGET') {
            const diff = Math.abs(currentPrice - alert.targetPrice) / alert.targetPrice;
            if (diff <= 0.005) shouldFire = true;
        }
        if (shouldFire) triggered.push({ alert, currentPrice });
    }
    return triggered;
};
