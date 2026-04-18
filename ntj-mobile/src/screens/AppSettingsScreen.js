import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

const SETTINGS_KEY = 'app_notification_settings';

const AppSettingsScreen = ({ navigation }) => {
    const { colors, isDark, mode } = useTheme();

    // Only email notifications + order updates remain
    const [emailNotifications, setEmailNotificationsState] = useState(true);
    const [orderUpdates, setOrderUpdatesState] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const saved = await AsyncStorage.getItem(SETTINGS_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                setEmailNotificationsState(parsed.emailNotifications ?? true);
                setOrderUpdatesState(parsed.orderUpdates ?? true);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };

    const saveSetting = async (key, value) => {
        try {
            const saved = await AsyncStorage.getItem(SETTINGS_KEY);
            const current = saved ? JSON.parse(saved) : {};
            const updated = { ...current, [key]: value };
            await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
        } catch (error) {
            console.error('Failed to save setting:', error);
        }
    };

    const handleEmailToggle = async (value) => {
        setEmailNotificationsState(value);
        await saveSetting('emailNotifications', value);
    };

    const handleOrderUpdatesToggle = async (value) => {
        setOrderUpdatesState(value);
        await saveSetting('orderUpdates', value);
        if (value) {
            Alert.alert(
                '📦 Order Updates On',
                'You will receive email notifications for:\n• Chit Fund request approval\n• Payment confirmation bill',
                [{ text: 'OK' }]
            );
        }
    };

    const c = colors;

    const SettingItem = ({ icon, title, subtitle, type = 'nav', value, onValueChange, onPress, disabled }) => (
        <TouchableOpacity
            style={[styles.settingItem, { opacity: disabled ? 0.5 : 1 }]}
            onPress={onPress}
            disabled={type === 'toggle' || disabled}
            activeOpacity={0.7}
        >
            <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: c.secondaryBackground }]}>
                    <Ionicons name={icon} size={20} color={c.primary} />
                </View>
                <View style={styles.settingTextContainer}>
                    <Text style={[styles.settingTitle, { color: c.text }]}>{title}</Text>
                    {subtitle && <Text style={[styles.settingSubtitle, { color: c.textSecondary }]}>{subtitle}</Text>}
                </View>
            </View>
            {type === 'toggle' ? (
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{ false: '#333', true: c.primary + '80' }}
                    thumbColor={value ? c.primary : '#888'}
                    disabled={disabled}
                />
            ) : (
                <Ionicons name="chevron-forward" size={20} color={c.textTertiary} />
            )}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: c.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: c.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="chevron-back" size={24} color={c.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: c.text }]}>App Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* ── NOTIFICATIONS ─────────────────── */}
                <Text style={[styles.sectionHeader, { color: c.textTertiary }]}>NOTIFICATIONS</Text>
                <View style={[styles.settingsGroup, { backgroundColor: c.cardBackground, borderColor: c.border }]}>
                    <SettingItem
                        icon="mail"
                        title="Email Notifications"
                        subtitle="Payment bills & approvals sent via email"
                        type="toggle"
                        value={emailNotifications}
                        onValueChange={handleEmailToggle}
                    />
                    <View style={[styles.divider, { backgroundColor: c.border }]} />
                    <SettingItem
                        icon="receipt"
                        title="Order & Payment Updates"
                        subtitle="Email alerts for request approval & payment bill"
                        type="toggle"
                        value={orderUpdates}
                        onValueChange={handleOrderUpdatesToggle}
                    />
                </View>

                {/* ── PREFERENCES ───────────────────── */}
                <Text style={[styles.sectionHeader, { color: c.textTertiary }]}>PREFERENCES</Text>
                <View style={[styles.settingsGroup, { backgroundColor: c.cardBackground, borderColor: c.border }]}>
                    <SettingItem
                        icon="moon"
                        title="Theme"
                        subtitle={mode === 'system' ? 'System Default' : mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
                        type="nav"
                        onPress={() => navigation.navigate('ThemeSelection')}
                    />
                </View>

                {/* ── SECURITY ──────────────────────── */}
                <Text style={[styles.sectionHeader, { color: c.textTertiary }]}>SECURITY</Text>
                <View style={[styles.settingsGroup, { backgroundColor: c.cardBackground, borderColor: c.border }]}>
                    <SettingItem
                        icon="lock-closed"
                        title="Change Password"
                        subtitle="Update your login password"
                        type="nav"
                        onPress={() => navigation.navigate('ChangePassword')}
                    />
                </View>

                {/* ── ABOUT ─────────────────────────── */}
                <Text style={[styles.sectionHeader, { color: c.textTertiary }]}>ABOUT</Text>
                <View style={[styles.settingsGroup, { backgroundColor: c.cardBackground, borderColor: c.border }]}>
                    <SettingItem
                        icon="information-circle"
                        title="About NTJ Gold"
                        subtitle="Learn more about our app"
                        type="nav"
                        onPress={() => navigation.navigate('AboutNTJ')}
                    />
                    <View style={[styles.divider, { backgroundColor: c.border }]} />
                    <SettingItem
                        icon="shield-checkmark"
                        title="Privacy Policy"
                        subtitle="Read our privacy policy"
                        type="nav"
                        onPress={() => navigation.navigate('PrivacyPolicy')}
                    />
                    <View style={[styles.divider, { backgroundColor: c.border }]} />
                    <SettingItem
                        icon="document-text"
                        title="Terms of Service"
                        subtitle="Read our terms and conditions"
                        type="nav"
                        onPress={() => navigation.navigate('TermsOfService')}
                    />
                </View>

                {/* ── VERSION ───────────────────────── */}
                <View style={styles.versionContainer}>
                    <Text style={[styles.versionText, { color: c.textTertiary }]}>Version 2.4.0</Text>
                    <Text style={[styles.versionSubtext, { color: c.textTertiary }]}>NTJ Gold Investments</Text>
                    <Text style={[styles.versionSubtext, { color: c.textTertiary }]}>© 2026 All Rights Reserved</Text>
                </View>

                <View style={{ height: 50 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50,
        borderBottomWidth: 1,
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    scrollContent: { padding: 20 },
    sectionHeader: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 12,
        letterSpacing: 1.2,
    },
    settingsGroup: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 24,
        borderWidth: 1,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        paddingHorizontal: 16,
    },
    settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    settingTextContainer: { flex: 1 },
    settingTitle: { fontSize: 15, fontWeight: '500', marginBottom: 2 },
    settingSubtitle: { fontSize: 12, lineHeight: 16 },
    divider: { height: 1, marginLeft: 66 },
    versionContainer: { alignItems: 'center', paddingVertical: 20 },
    versionText: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
    versionSubtext: { fontSize: 12, marginTop: 2 },
});

export default AppSettingsScreen;
