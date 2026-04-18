import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const ChangePasswordScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChangePassword = async () => {
        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'New password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/change-password', {
                currentPassword,
                newPassword
            });

            if (response.data.success) {
                Alert.alert(
                    'Success',
                    'Password changed successfully',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            }
        } catch (error) {
            Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to change password'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Security Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Info Card */}
                <View style={[styles.infoCard, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}>
                    <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        Secure your account by updating your password regularly.
                    </Text>
                </View>

                {/* Current Password */}
                <Text style={[styles.label, { color: colors.text }]}>Current Password</Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} />
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        placeholder="Current password"
                        placeholderTextColor={colors.textTertiary}
                        secureTextEntry={!showCurrentPassword}
                    />
                    <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                        <Ionicons
                            name={showCurrentPassword ? "eye" : "eye-off"}
                            size={20}
                            color={colors.textTertiary}
                        />
                    </TouchableOpacity>
                </View>

                {/* New Password */}
                <Text style={[styles.label, { color: colors.text }]}>New Password</Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <Ionicons name="key-outline" size={20} color={colors.textTertiary} />
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="New password"
                        placeholderTextColor={colors.textTertiary}
                        secureTextEntry={!showNewPassword}
                    />
                    <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                        <Ionicons
                            name={showNewPassword ? "eye" : "eye-off"}
                            size={20}
                            color={colors.textTertiary}
                        />
                    </TouchableOpacity>
                </View>

                {/* Confirm New Password */}
                <Text style={[styles.label, { color: colors.text }]}>Confirm New Password</Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <Ionicons name="checkmark-circle-outline" size={20} color={colors.textTertiary} />
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Retype new password"
                        placeholderTextColor={colors.textTertiary}
                        secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                        <Ionicons
                            name={showConfirmPassword ? "eye" : "eye-off"}
                            size={20}
                            color={colors.textTertiary}
                        />
                    </TouchableOpacity>
                </View>

                {/* Password Requirements */}
                <View style={[styles.requirementsCard, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}>
                    <Text style={[styles.requirementsTitle, { color: colors.primary }]}>Password Tips:</Text>
                    <View style={styles.requirementItem}>
                        <Ionicons
                            name={newPassword.length >= 6 ? "checkmark-circle" : "ellipse-outline"}
                            size={16}
                            color={newPassword.length >= 6 ? colors.success : colors.textTertiary}
                        />
                        <Text style={[styles.requirementText, { color: colors.textSecondary }, newPassword.length >= 6 && { color: colors.success, fontWeight: 'bold' }]}>
                            At least 6 characters
                        </Text>
                    </View>
                    <View style={styles.requirementItem}>
                        <Ionicons
                            name={newPassword === confirmPassword && newPassword.length > 0 ? "checkmark-circle" : "ellipse-outline"}
                            size={16}
                            color={newPassword === confirmPassword && newPassword.length > 0 ? colors.success : colors.textTertiary}
                        />
                        <Text style={[styles.requirementText, { color: colors.textSecondary }, (newPassword === confirmPassword && newPassword.length > 0) && { color: colors.success, fontWeight: 'bold' }]}>
                            Both passwords match
                        </Text>
                    </View>
                </View>

                {/* Change Password Button */}
                <TouchableOpacity
                    style={[styles.changeButton, { backgroundColor: colors.primary }, loading && styles.changeButtonDisabled]}
                    onPress={handleChangePassword}
                    disabled={loading}
                >
                    {loading ? (
                        <Text style={styles.changeButtonText}>Processing...</Text>
                    ) : (
                        <>
                            <Ionicons name="save-outline" size={22} color="#FFF" />
                            <Text style={styles.changeButtonText}>Update Password</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={{ height: 50 }} />
            </ScrollView>
        </KeyboardAvoidingView>
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
        paddingTop: 50
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 24
    },
    infoCard: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: 18,
        marginBottom: 30,
        borderWidth: 1.5,
        alignItems: 'center'
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        marginLeft: 14,
        lineHeight: 20,
        fontWeight: '600'
    },
    label: {
        fontSize: 14,
        marginBottom: 10,
        fontWeight: '700',
        paddingLeft: 4
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        paddingHorizontal: 18,
        marginBottom: 20,
        borderWidth: 1.5,
        height: 64
    },
    input: {
        flex: 1,
        fontSize: 16,
        marginLeft: 14,
        fontWeight: '600'
    },
    requirementsCard: {
        borderRadius: 16,
        padding: 18,
        marginBottom: 35,
        borderWidth: 1,
    },
    requirementsTitle: {
        fontSize: 13,
        fontWeight: '800',
        marginBottom: 12,
        letterSpacing: 1
    },
    requirementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10
    },
    requirementText: {
        fontSize: 14,
        marginLeft: 10,
        fontWeight: '500'
    },
    changeButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        borderRadius: 20,
        shadowColor: '#2e7d32',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6
    },
    changeButtonDisabled: {
        opacity: 0.5
    },
    changeButtonText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: 'bold',
        marginLeft: 12,
        letterSpacing: 0.5
    }
});

export default ChangePasswordScreen;
