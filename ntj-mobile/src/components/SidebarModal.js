import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    ScrollView,
    Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const SidebarModal = ({ visible, onClose, navigation }) => {
    const { colors } = useTheme();
    const { user, logout } = useAuth();
    const slideAnim = React.useRef(new Animated.Value(-300)).current;

    React.useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 65,
                friction: 11
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: -300,
                duration: 200,
                useNativeDriver: true
            }).start();
        }
    }, [visible]);

    const navigateTo = (screenName, params) => {
        onClose();
        setTimeout(() => navigation.navigate(screenName, params), 100);
    };

    const menuItems = [
        { name: 'Home', icon: 'home-outline', screen: 'Main', params: { screen: 'Home' } },
        { name: 'My Portfolio', icon: 'pie-chart-outline', screen: 'Main', params: { screen: 'Portfolio' } },
        { name: 'Transaction History', icon: 'list-outline', screen: 'Main', params: { screen: 'Orders' } },
        { name: 'Chit Fund Request', icon: 'paper-plane-outline', screen: 'ChitFundRequest' },
        { name: 'Make Payment', icon: 'phone-portrait-outline', screen: 'ChitFundPay' },
        { name: 'All Plans', icon: 'bar-chart-outline', screen: 'AllPlans' },
        { name: 'My Profile', icon: 'person-outline', screen: 'Main', params: { screen: 'Profile' } },
        { name: 'App Settings', icon: 'settings-outline', screen: 'AppSettings' },
        { name: 'Help & Support', icon: 'help-circle-outline', screen: 'HelpSupport' },
    ];

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.sidebar,
                        { backgroundColor: colors.background },
                        { transform: [{ translateX: slideAnim }] }
                    ]}
                >
                    {/* User Header */}
                    <TouchableOpacity
                        style={[styles.userHeader, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}
                        onPress={() => navigateTo('Main', { screen: 'Profile' })}
                    >
                        <Image
                            source={{
                                uri: user?.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=2e7d32&color=fff`
                            }}
                            style={styles.avatar}
                        />
                        <View style={styles.userInfo}>
                            <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'User Name'}</Text>
                            <Text style={[styles.viewProfile, { color: colors.primary }]}>View Profile</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                    </TouchableOpacity>

                    {/* Menu Items */}
                    <ScrollView style={styles.menuContainer} contentContainerStyle={styles.menuContent}>
                        {menuItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.menuItem}
                                onPress={() => navigateTo(item.screen, item.params)}
                            >
                                <Ionicons name={item.icon} size={22} color={colors.primary} />
                                <Text style={[styles.menuText, { color: colors.text }]}>{item.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Logout Button at Bottom */}
                    <View style={[styles.bottomSection, { borderTopColor: colors.border, backgroundColor: colors.cardBackground }]}>
                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={() => {
                                onClose();
                                logout();
                            }}
                        >
                            <Ionicons name="log-out-outline" size={22} color="#FF4444" />
                            <Text style={styles.logoutText}>Log Out</Text>
                        </TouchableOpacity>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={[styles.footerText, { color: colors.textSecondary }]}>NTJ App v2.4.0</Text>
                        </View>
                    </View>
                </Animated.View>

                <TouchableOpacity
                    style={styles.overlayTouchable}
                    activeOpacity={1}
                    onPress={onClose}
                />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        flexDirection: 'row'
    },
    overlayTouchable: {
        flex: 1
    },
    sidebar: {
        width: 280,
        height: '100%',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10
    },
    userHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#f1f8e9',
        borderBottomWidth: 1,
        borderBottomColor: '#e8f5e9'
    },
    avatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
        borderWidth: 2,
        borderColor: '#2e7d32'
    },
    userInfo: {
        flex: 1,
        marginLeft: 15
    },
    userName: {
        color: '#1b3223',
        fontSize: 16,
        fontWeight: 'bold'
    },
    viewProfile: {
        color: '#2e7d32',
        fontSize: 12,
        marginTop: 2,
        fontWeight: '600'
    },
    menuContainer: {
        flex: 1
    },
    menuContent: {
        paddingTop: 10
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f9f9f9'
    },
    menuText: {
        color: '#1b3223',
        fontSize: 16,
        marginLeft: 20,
        fontWeight: '500'
    },
    bottomSection: {
        borderTopWidth: 1,
        borderTopColor: '#e8f5e9',
        backgroundColor: '#f9fbf9'
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e8f5e9'
    },
    logoutText: {
        color: '#d32f2f',
        fontSize: 16,
        marginLeft: 20,
        fontWeight: '600'
    },
    footer: {
        padding: 20,
        alignItems: 'center'
    },
    footerText: {
        color: '#81c784',
        fontSize: 10,
        fontWeight: '700'
    }
});

export default SidebarModal;
