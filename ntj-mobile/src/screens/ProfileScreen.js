import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Alert,
    Share
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const ProfileScreen = ({ navigation }) => {
    const { user, logout, refreshUser } = useAuth();

    useFocusEffect(
        useCallback(() => {
            refreshUser();
        }, [])
    );

    const handleLogout = () => {
        Alert.alert(
            "Log Out",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Log Out", style: "destructive", onPress: logout }
            ]
        );
    };

    const MenuItem = ({ icon, title, subtitle, onPress, badge, color = "#1b3223" }) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuIconContainer}>
                {icon}
            </View>
            <View style={styles.menuTextContainer}>
                <Text style={[styles.menuTitle, { color }]}>{title}</Text>
                {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
                {badge && (
                    <Text style={styles.badgeText}>{badge}</Text>
                )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {badge === 'Pending' && (
                    <View style={styles.pendingBadge}>
                        <Text style={styles.pendingText}>Pending</Text>
                    </View>
                )}
                <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Profile</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Profile Card */}
                <View style={styles.profileCard}>
                        <View style={styles.avatarContainer}>
                             <Image
                                source={{ uri: user?.profilePhoto || 'https://ui-avatars.com/api/?name=' + (user?.name || 'User') + '&background=2e7d32&color=fff' }}
                                style={styles.avatar}
                            />
                        </View>

                    <Text style={styles.userName}>{user?.name || 'User Name'}</Text>
                    <Text style={styles.userPhone}>{user?.phone || '+91 XXXXX XXXXX'}</Text>

                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Gold Holdings</Text>
                            <Text style={styles.statValue}>{(user?.goldBalance || 0).toFixed(3)}g</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Silver Holdings</Text>
                            <Text style={styles.statValue}>{(user?.silverBalance || 0).toFixed(3)}g</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.sectionHeader}>ACCOUNT</Text>
                <View style={styles.menuGroup}>
                    <MenuItem
                        icon={<Ionicons name="person-outline" size={22} color="#2e7d32" />}
                        title="Edit Profile"
                        subtitle="Update personal details"
                        onPress={() => navigation.navigate('EditProfile')}
                    />
                    <View style={styles.divider} />
                    <MenuItem
                        icon={<Ionicons name="shield-checkmark-outline" size={22} color="#2e7d32" />}
                        title="Security"
                        subtitle="Change password"
                        onPress={() => navigation.navigate('ChangePassword')}
                    />
                </View>

                <Text style={styles.sectionHeader}>SUPPORT</Text>
                <View style={styles.menuGroup}>
                    <MenuItem
                        icon={<Ionicons name="headset-outline" size={22} color="#2e7d32" />}
                        title="Help & Support"
                        onPress={() => navigation.navigate('HelpSupport')}
                    />
                    <View style={styles.divider} />
                    <MenuItem
                        icon={<Ionicons name="settings-outline" size={22} color="#2e7d32" />}
                        title="App Settings"
                        onPress={() => navigation.navigate('AppSettings')}
                    />
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#FF4444" />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Version 2.4.0 • NTJ Gold Investments</Text>
                <View style={{ height: 50 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f8e9' },
    header: { justifyContent: 'center', alignItems: 'center', padding: 20, paddingTop: 50 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1b3223' },
    scrollContent: { padding: 20 },
    profileCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: '#e8f5e9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    avatarContainer: { marginBottom: 16, position: 'relative' },
    avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#2e7d32' },
    goldBadge: { position: 'absolute', bottom: -10, alignSelf: 'center', backgroundColor: '#2e7d32', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
    goldBadgeText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 10, marginLeft: 4 },
    userName: { color: '#1b3223', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
    userPhone: { color: '#4caf50', fontSize: 14, marginBottom: 24, fontWeight: '500' },
    statsContainer: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 12 },
    statItem: { backgroundColor: '#f9fbf9', borderRadius: 16, padding: 16, alignItems: 'center', flex: 1, borderWidth: 1, borderColor: '#e8f5e9' },
    statLabel: { color: '#81c784', fontSize: 12, marginBottom: 4, fontWeight: 'bold' },
    statValue: { color: '#2e7d32', fontSize: 16, fontWeight: 'bold' },
    sectionHeader: { color: '#4caf50', fontSize: 12, fontWeight: 'bold', marginBottom: 10, marginLeft: 4, letterSpacing: 1 },
    menuGroup: { backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', marginBottom: 30, borderWidth: 1, borderColor: '#e8f5e9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, justifyContent: 'space-between' },
    menuIconContainer: { width: 40, alignItems: 'center' },
    menuTextContainer: { flex: 1 },
    menuTitle: { fontSize: 16, fontWeight: '500' },
    menuSubtitle: { color: '#81c784', fontSize: 12, marginTop: 2 },
    divider: { height: 1, backgroundColor: '#f0f4f1', marginLeft: 56 },
    badgeText: { color: '#2e7d32', fontSize: 10, fontWeight: 'bold' },
    pendingBadge: { backgroundColor: '#e8f5e9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 8 },
    pendingText: { color: '#4caf50', fontSize: 10, fontWeight: 'bold' },
    logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    logoutText: { color: '#d32f2f', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    versionText: { color: '#81c784', textAlign: 'center', fontSize: 12, fontWeight: '600' }
});

export default ProfileScreen;
