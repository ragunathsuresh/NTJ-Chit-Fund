import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const HelpSupportScreen = ({ navigation }) => {
    const handleEmailSupport = () => {
        Linking.openURL('mailto:ragusuresh291@gmail.com');
    };

    const handleCallSupport = () => {
        Linking.openURL('tel:+919025998614');
    };

    const handleWhatsAppSupport = () => {
        const phoneNumber = '919025998614'; 
        const message = 'Hello, I need help with NTJ Gold App';
        Linking.openURL(`whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`);
    };

    const FAQItem = ({ question, answer }) => (
        <View style={styles.faqItem}>
            <Text style={styles.question}>{question}</Text>
            <Text style={styles.answer}>{answer}</Text>
        </View>
    );

    const ContactOption = ({ icon, title, subtitle, onPress, color = '#2e7d32' }) => (
        <TouchableOpacity style={styles.contactOption} onPress={onPress}>
            <View style={[styles.contactIconContainer, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <View style={styles.contactTextContainer}>
                <Text style={styles.contactTitle}>{title}</Text>
                <Text style={styles.contactSubtitle}>{subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#81c784" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#2e7d32" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help & Support</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Contact Support Section */}
                <Text style={styles.sectionHeader}>CONTACT US</Text>
                <View style={styles.contactGroup}>
                    <ContactOption
                        icon="mail"
                        title="Email Support"
                        subtitle="ragusuresh291@gmail.com"
                        onPress={handleEmailSupport}
                        color="#2e7d32"
                    />
                    <View style={styles.divider} />
                    <ContactOption
                        icon="call"
                        title="Call Support"
                        subtitle="+91 90259 98614"
                        onPress={handleCallSupport}
                        color="#43a047"
                    />
                    <View style={styles.divider} />
                    <ContactOption
                        icon="logo-whatsapp"
                        title="Live Chat"
                        subtitle="Chat with us on WhatsApp"
                        onPress={handleWhatsAppSupport}
                        color="#25D366"
                    />
                </View>

                {/* FAQ Section */}
                <Text style={styles.sectionHeader}>FREQUENTLY ASKED QUESTIONS</Text>
                <View style={styles.faqContainer}>
                    <FAQItem
                        question="How do I save gold?"
                        answer="Tap on 'Request' from the dashboard to start a new saver plan. Once admin approves your request, you can start making monthly payments."
                    />
                    <View style={styles.divider} />
                    <FAQItem
                        question="How do I check my total weight?"
                        answer="Tap on the Gold or Silver rate boxes in the dashboard to open your Portfolio. There you can see your accumulated grams and live value."
                    />
                    <View style={styles.divider} />
                    <FAQItem
                        question="Is KYC mandatory?"
                        answer="Yes, KYC verification is required for all the users to ensure secure transactions. You can upload your Aadhaar & PAN card in your Profile."
                    />
                    <View style={styles.divider} />
                    <FAQItem
                        question="How do I get my physical gold?"
                        answer="Once your plan is completed, you can visit our Shri Natchathra Jewels store to redeem your saved gold/silver as jewellery."
                    />
                    <View style={styles.divider} />
                    <FAQItem
                        question="What if a payment fails?"
                        answer="Don't worry! If a payment fails but the amount was deducted, please wait for 24 hours. You can contact support via WhatsApp if it's not updated."
                    />
                </View>

                <View style={styles.footer}>
                    <Text style={styles.versionText}>NTJ App Version 1.0.0</Text>
                    <Text style={styles.footerBrand}>Powered by Shri Natchathra Jewels</Text>
                </View>

                <View style={{ height: 50 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f8e9'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1b3223'
    },
    scrollContent: {
        padding: 20
    },
    sectionHeader: {
        color: '#4caf50',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 15,
        marginTop: 10,
        letterSpacing: 1.5
    },
    contactGroup: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#e8f5e9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2
    },
    contactOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18
    },
    contactIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    contactTextContainer: {
        flex: 1
    },
    contactTitle: {
        color: '#1b3223',
        fontSize: 17,
        fontWeight: 'bold',
        marginBottom: 4
    },
    contactSubtitle: {
        color: '#66bb6a',
        fontSize: 13
    },
    faqContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#e8f5e9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2
    },
    faqItem: {
        padding: 20
    },
    question: {
        color: '#2e7d32',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10
    },
    answer: {
        color: '#4a4a4a',
        fontSize: 14,
        lineHeight: 22
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f8e9',
        marginHorizontal: 15
    },
    footer: {
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 40
    },
    versionText: {
        color: '#81c784',
        fontSize: 12
    },
    footerBrand: {
        color: '#1b3223',
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 5,
        letterSpacing: 1
    }
});

export default HelpSupportScreen;
