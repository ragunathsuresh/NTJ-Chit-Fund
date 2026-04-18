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

const TermsOfServiceScreen = ({ navigation }) => {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Terms of Service</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Intro Banner */}
                <View style={[styles.updateBanner, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}>
                    <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                    <Text style={[styles.updateText, { color: colors.textSecondary }]}>Effective Date: April 2026</Text>
                </View>

                {/* Main Message */}
                <View style={[styles.contentCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <Text style={[styles.placeholderTitle, { color: colors.text }]}>Terms & Conditions</Text>
                    <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                        Welcome to NTJ Gold. By accessing our platform, you agree to be bound by these terms. We aim to provide a safe investment environment for everyone.
                    </Text>
                </View>

                {/* Section List */}
                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>LEGAL SECTIONS</Text>
                <View style={[styles.sectionsCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <SectionItem
                        icon="person-add"
                        title="Eligibility"
                        description="You must be 18+ to use NTJ services."
                        colors={colors}
                    />
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <SectionItem
                        icon="wallet"
                        title="Trading Terms"
                        description="Gold and silver trades are subject to market volatility."
                        colors={colors}
                    />
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <SectionItem
                        icon="shield-checkmark"
                        title="Compliance"
                        description="We adhere to all local financial regulations."
                        colors={colors}
                    />
                </View>

                {/* Warning Notice */}
                <View style={[styles.noticeCard, { backgroundColor: colors.secondaryBackground, borderColor: colors.primary + '30' }]}>
                    <Ionicons name="alert-circle" size={22} color={colors.primary} />
                    <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
                        Always verify your transaction ID. NTJ is not responsible for payments made to incorrect UPI addresses.
                    </Text>
                </View>

                <Text style={[styles.footerNote, { color: colors.textTertiary }]}>
                    Need more info? Reach out to ragusuresh291@gmail.com
                </Text>

                <View style={{ height: 50 }} />
            </ScrollView>
        </View>
    );
};

const SectionItem = ({ icon, title, description, colors }) => (
    <View style={styles.sectionItem}>
        <Ionicons name={icon} size={26} color={colors.primary} />
        <View style={styles.sectionText}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>{description}</Text>
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
        fontSize: 14,
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
        marginBottom: 12
    },
    placeholderText: {
        fontSize: 15,
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
    sectionsCard: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 25,
        borderWidth: 1.5,
    },
    sectionItem: {
        flexDirection: 'row',
        padding: 20,
        alignItems: 'center'
    },
    sectionText: {
        marginLeft: 16,
        flex: 1
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        marginBottom: 4
    },
    sectionDescription: {
        fontSize: 14,
        lineHeight: 20,
        opacity: 0.8,
        fontWeight: '500'
    },
    divider: {
        height: 1,
    },
    noticeCard: {
        flexDirection: 'row',
        padding: 18,
        borderRadius: 16,
        marginBottom: 25,
        borderWidth: 1.5,
        alignItems: 'center'
    },
    noticeText: {
        flex: 1,
        fontSize: 13,
        marginLeft: 12,
        lineHeight: 20,
        fontWeight: '600'
    },
    footerNote: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 20,
        fontStyle: 'italic',
        fontWeight: '500'
    }
});

export default TermsOfServiceScreen;
