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

const AboutNTJScreen = ({ navigation }) => {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>About NTJ</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Logo/Icon */}
                <View style={styles.logoContainer}>
                    <View style={[styles.logo, { backgroundColor: colors.primary }]}>
                        <Text style={styles.logoText}>NTJ</Text>
                    </View>
                    <Text style={[styles.appName, { color: colors.text }]}>NTJ Gold & Silver</Text>
                    <Text style={[styles.version, { color: colors.textSecondary }]}>Modern Jewellery Savings</Text>
                </View>

                {/* Company Info */}
                <View style={[styles.contentCard, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}>
                    <Text style={[styles.contentTitle, { color: colors.primary }]}>Our Vision</Text>
                    <Text style={[styles.contentText, { color: colors.text }]}>
                        NTJ Gold offers the most transparent and trusted platform for digital gold and silver savings. We empower our customers with secure, easy access to high-purity precious metals.
                    </Text>
                </View>

                {/* Contact Info */}
                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>CONTACT US</Text>
                <View style={[styles.infoCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <InfoRow icon="mail" label="Email" value="ragusuresh291@gmail.com" colors={colors} />
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <InfoRow icon="call" label="Phone" value="9025998614" colors={colors} />
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <InfoRow icon="location" label="Location" value="Main Street, Srikalahasti, AP" colors={colors} />
                </View>

                <Text style={[styles.copyright, { color: colors.textTertiary }]}>© 2026 NTJ Gold Investments{'\n'}Premium Jewellery Digital Solutions</Text>

                <View style={{ height: 50 }} />
            </ScrollView>
        </View>
    );
};

const InfoRow = ({ icon, label, value, colors }) => (
    <View style={styles.infoRow}>
        <Ionicons name={icon} size={22} color={colors.primary} />
        <View style={styles.infoTextContainer}>
            <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>{label}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
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
        padding: 24
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 35
    },
    logo: {
        width: 100,
        height: 100,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#2e7d32',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5
    },
    logoText: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 2
    },
    appName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 6
    },
    version: {
        fontSize: 14,
        fontWeight: '700'
    },
    contentCard: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 30,
        borderWidth: 1.5,
    },
    contentTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10
    },
    contentText: {
        fontSize: 15,
        lineHeight: 24,
        opacity: 0.9,
        fontWeight: '500'
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 16,
        letterSpacing: 1.5
    },
    infoCard: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 35,
        borderWidth: 1,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18
    },
    infoTextContainer: {
        marginLeft: 16,
        flex: 1
    },
    infoLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 4,
        letterSpacing: 0.5
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '700'
    },
    divider: {
        height: 1,
    },
    copyright: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 20,
        fontWeight: '500'
    }
});

export default AboutNTJScreen;
