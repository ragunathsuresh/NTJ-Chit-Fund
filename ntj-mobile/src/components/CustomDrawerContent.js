import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const CustomDrawerContent = (props) => {
    const { user, logout } = useAuth();

    return (
        <View style={{ flex: 1, backgroundColor: '#121212' }}>
            <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
                {/* User Header */}
                <TouchableOpacity
                    style={styles.drawerHeader}
                    onPress={() => props.navigation.navigate('Profile')}
                >
                    <Image
                        source={{ uri: 'https://ui-avatars.com/api/?name=' + (user?.name || 'User') + '&background=FFD700&color=000' }}
                        style={styles.avatar}
                    />
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user?.name || 'User Name'}</Text>
                        <Text style={styles.userSubtext}>View Profile</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#666" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>

                {/* Drawer Items */}
                <View style={styles.drawerItemsContainer}>
                    <DrawerItemList {...props} />
                </View>

                {/* Logout Button */}
                <DrawerItem
                    label="Log Out"
                    icon={({ color, size }) => (
                        <Ionicons name="log-out-outline" size={size} color="#FF4444" />
                    )}
                    onPress={logout}
                    labelStyle={{ color: '#FF4444' }}
                />
            </DrawerContentScrollView>

            <View style={styles.footer}>
                <Text style={styles.footerText}>NTJ App v2.4.0</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    drawerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#1E1E1E',
        marginBottom: 10,
        paddingTop: 60, // Safe area padding
        borderBottomWidth: 1,
        borderBottomColor: '#333'
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#FFD700'
    },
    userInfo: {
        marginLeft: 15,
    },
    userName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold'
    },
    userSubtext: {
        color: '#FFD700',
        fontSize: 12
    },
    drawerItemsContainer: {
        paddingTop: 10
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#333',
        alignItems: 'center'
    },
    footerText: {
        color: '#666',
        fontSize: 10
    }
});

export default CustomDrawerContent;
