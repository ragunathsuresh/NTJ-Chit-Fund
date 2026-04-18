import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const PrivacyPolicyScreen = ({ navigation }) => {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy Policy</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Last Updated Banner */}
                <View style={[styles.updateBanner, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}>
                    <Ionicons name="time-outline" size={18} color={colors.primary} />
                    <Text style={[styles.updateText, { color: colors.textSecondary }]}>Policy Version: 1.2 (Latest)</Text>
                </View>

                {/* Shield Icon and Intro */}
                <View style={[styles.contentCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <Ionicons name="shield-checkmark" size={60} color={colors.primary} style={{ alignSelf: 'center', marginBottom: 20 }} />
                    <Text style={[styles.placeholderTitle, { color: colors.text }]}>Your Data, Protected</Text>
                    <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                        At NTJ, we take your privacy seriously. This document outlines how we protect your personal info and investment data.
                    </Text>
                </View>

                {/* Key Points */}
                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>DATA PRINCIPLES</Text>
                <View style={[styles.keyPointsCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <KeyPoint
                        icon="lock-closed"
                        title="Encryption First"
                        description="All your transaction data is encrypted end-to-end."
                        colors={colors}
                    />
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <KeyPoint
                        icon="eye-off"
                        title="No Third-Party Access"
                        description="We never sell your data to outside marketers."
                        colors={colors}
                    />
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <KeyPoint
                        icon="finger-print"
                        title="Biometric Security"
                        description="Optional fingerprint/face access for your privacy."
                        colors={colors}
                    />
                </View>

                <Text style={[styles.footerNote, { color: colors.textTertiary }]}>
                    Full legal document available on our official website. For questions, contact privacy@ragusuresh291@gmail.com
                </Text>

                <View style={{ height: 50 }} />
            </ScrollView>
        </View>
    );
};

const KeyPoint = ({ icon, title, description, colors }) => (
    <View style={styles.keyPoint}>
        <Ionicons name={icon} size={28} color={colors.primary} />
        <View style={styles.keyPointText}>
            <Text style={[styles.keyPointTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.keyPointDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
    </View>
);

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
        padding: 20
    },
    updateBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 14,
        marginBottom: 20,
        borderWidth: 1.5,
    },
    updateText: {
        fontSize: 13,
        marginLeft: 10,
        fontWeight: '700'
    },
    contentCard: {
        borderRadius: 24,
        padding: 28,
        marginBottom: 30,
        borderWidth: 1,
    },
    placeholderTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12
    },
    placeholderText: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 24,
        opacity: 0.9,
        fontWeight: '500'
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 16,
        letterSpacing: 1.5,
        paddingLeft: 10
    },
    keyPointsCard: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 30,
        borderWidth: 1.5,
    },
    keyPoint: {
        flexDirection: 'row',
        padding: 20,
        alignItems: 'center'
    },
    keyPointText: {
        marginLeft: 16,
        flex: 1
    },
    keyPointTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        marginBottom: 4
    },
    keyPointDescription: {
        fontSize: 14,
        lineHeight: 20,
        opacity: 0.8,
        fontWeight: '500'
    },
    divider: {
        height: 1,
    },
    footerNote: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 20,
        fontStyle: 'italic',
        fontWeight: '500',
        paddingHorizontal: 20
    }
});

export default PrivacyPolicyScreen;
