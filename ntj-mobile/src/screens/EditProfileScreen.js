import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';

const EditProfileScreen = ({ navigation }) => {
    const { user, refreshUser } = useAuth();
    const { colors } = useTheme();
    const [loading, setLoading] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || null);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || ''
    });

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need camera roll permissions to upload your photo.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            setProfilePhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            Alert.alert('Error', 'Name cannot be empty');
            return;
        }
        
        // ... validation ...

        try {
            setLoading(true);
            const response = await api.put('/users/profile', {
                ...formData,
                profilePhoto: profilePhoto
            });

            if (response.data.success) {
                await refreshUser();
                Alert.alert(
                    'Success',
                    'Profile updated successfully',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            }
        } catch (error) {
            console.error('Profile update error:', error);
            Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to update profile'
            );
        } finally {
            setLoading(false);
        }
    };

    const getAvatarUrl = () => {
        if (profilePhoto) {
            return profilePhoto;
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'User')}&background=2E7D32&color=fff&size=200`;
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Profile Photo Section */}
                <View style={styles.photoSection}>
                    <Image
                        source={{ uri: getAvatarUrl() }}
                        style={[styles.avatar, { borderColor: colors.primary }]}
                    />
                    <TouchableOpacity
                        style={[styles.photoButton, { backgroundColor: colors.primary, borderColor: colors.background }]}
                        onPress={handlePickImage}
                    >
                        <Ionicons name="camera" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>

                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>PERSONAL INFORMATION</Text>

                {/* Name Input */}
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            value={formData.name}
                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                            placeholder="Enter your name"
                            placeholderTextColor={colors.textTertiary}
                        />
                    </View>
                </View>

                {/* Email Input */}
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            value={formData.email}
                            onChangeText={(text) => setFormData({ ...formData, email: text })}
                            placeholder="Enter your email"
                            placeholderTextColor={colors.textTertiary}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>
                </View>

                {/* Phone Input */}
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Phone Number</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="call-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            value={formData.phone}
                            onChangeText={(text) => setFormData({ ...formData, phone: text })}
                            placeholder="Enter your phone number"
                            placeholderTextColor={colors.textTertiary}
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[
                        styles.saveButton, 
                        { backgroundColor: colors.primary },
                        loading && styles.saveButtonDisabled
                    ]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                            <Text style={[styles.saveButtonText, { color: '#FFF' }]}>Save Changes</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={{ height: 50 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f8e9',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 10
    },
    photoSection: {
        alignItems: 'center',
        marginBottom: 35,
        marginTop: 15
    },
    avatar: {
        width: 130,
        height: 130,
        borderRadius: 65,
        borderWidth: 4,
    },
    photoButton: {
        position: 'absolute',
        bottom: 5,
        right: '32%',
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '800',
        marginBottom: 20,
        letterSpacing: 2,
        opacity: 0.8
    },
    inputGroup: {
        marginBottom: 24
    },
    label: {
        fontSize: 14,
        marginBottom: 10,
        fontWeight: '700',
        letterSpacing: 0.3
    },
    inputContainer: {
        backgroundColor: '#f9f9f9',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#e8f5e9',
        paddingHorizontal: 16,
        height: 60
    },
    inputIcon: {
        marginRight: 14
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        paddingVertical: 14
    },
    saveButton: {
        borderRadius: 18,
        padding: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#2e7d32',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6
    },
    saveButtonDisabled: {
        opacity: 0.6
    },
    saveButtonText: {
        fontSize: 17,
        fontWeight: 'bold',
        marginLeft: 10,
        letterSpacing: 0.5
    }
});

export default EditProfileScreen;
