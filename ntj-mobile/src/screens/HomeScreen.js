import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Image,
    Dimensions
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import marketService from '../services/marketService';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import SidebarModal from '../components/SidebarModal';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const { user, refreshUser } = useAuth();
    const [rates, setRates] = useState({ gold: null, silver: null });
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [sidebarVisible, setSidebarVisible] = useState(false);

    const fetchRates = async () => {
        try {
            const data = await marketService.getRates();
            if (data.success) {
                setRates(data.data);
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error('Error fetching rates:', error);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([refreshUser(), fetchRates()]);
        setRefreshing(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchRates();
            refreshUser(); // Always fetch fresh user data (gold/silver balance) from backend
        }, [])
    );

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '₹ 0';
        // Format with up to 2 decimal places, no trailing zeros
        const num = parseFloat(amount);
        const formatted = num.toLocaleString('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
        return '₹ ' + formatted;
    };

    const formatGrams = (grams) => {
        if (!grams && grams !== 0) return '0.0000';
        return parseFloat(parseFloat(grams).toFixed(4)).toFixed(4);
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const RateCard = ({ brandName, metal, rate, color, icon, onPress }) => (
        <TouchableOpacity style={styles.rateCard} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.rateHeader}>
                <View style={[styles.iconContainer, { backgroundColor: color }]}>
                    <Text style={styles.iconText}>{icon}</Text>
                </View>
                <View>
                    <Text style={styles.brandName}>{brandName}</Text>
                    <Text style={styles.metalTitle}>{metal} Rate</Text>
                    <Text style={styles.metalSubtitle}>
                        {rate?.purity || (metal === 'Gold' ? '24K • 99.9%' : 'Fine Silver • 99.9%')}
                    </Text>
                </View>
                <View style={[styles.trendBadge, { backgroundColor: '#1E3E2B' }]}>
                    <Ionicons name="arrow-up" size={12} color="#4CAF50" />
                    <Text style={styles.trendText}>+1.24%</Text>
                </View>
            </View>

            <View style={styles.priceRow}>
                <View>
                    <Text style={styles.priceLabel}>Price per gram</Text>
                    <Text style={styles.priceValue}>
                        {formatCurrency(rate?.sellPrice)}
                    </Text>
                    <Text style={styles.lastUpdated}>Last updated: {formatTime(lastUpdated)}</Text>
                </View>
                {/* Visual element representing metal bar/ingot */}
                <View style={[styles.metalVisual, { backgroundColor: color, opacity: 0.8 }]} />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header Section */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setSidebarVisible(true)}>
                    <Ionicons name="menu" size={28} color="#2e7d32" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>NTJ</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AppSettings')}>
                    <Ionicons name="settings-outline" size={24} color="#2e7d32" />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2e7d32" />
                }
            >
                {/* Welcome Section */}
                <View style={styles.welcomeSection}>
                    <Text style={styles.welcomeText}>WELCOME BACK</Text>
                    <Text style={styles.userName}>Hello, <Text style={styles.nameHighlight}>{user?.name?.split(' ')[0] || 'User'}</Text></Text>

                    {/* Holdings Pill - Increased Size */}
                    <TouchableOpacity
                        style={styles.holdingsPill}
                        onPress={() => navigation.navigate('Portfolio')}
                    >
                        <Text style={styles.holdingsLabel}>CURRENT HOLDINGS</Text>
                        <View style={styles.holdingsRow}>
                            <View style={styles.holdingItem}>
                                <View style={[styles.dot, { backgroundColor: '#2e7d32', width: 12, height: 12, borderRadius: 6 }]} />
                                <Text style={styles.holdingText}>{formatGrams(user?.goldBalance)} g</Text>
                                <Text style={styles.holdingSubText}>Gold</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.holdingItem}>
                                <View style={[styles.dot, { backgroundColor: '#81c784', width: 12, height: 12, borderRadius: 6 }]} />
                                <Text style={styles.holdingText}>{formatGrams(user?.silverBalance)} g</Text>
                                <Text style={styles.holdingSubText}>Silver</Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.liveIndicator}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>MARKET LIVE UPDATES</Text>
                    </View>
                </View>

                {/* Rates Section */}
                <RateCard
                    brandName="SHRI NATCHATHRA"
                    metal="Gold"
                    rate={rates.gold}
                    color="#2e7d32"
                    icon="Au"
                    onPress={() => navigation.navigate('Portfolio')}
                />

                <RateCard
                    brandName="SHRI MAYIL SILVER"
                    metal="Silver"
                    rate={rates.silver}
                    color="#4caf50"
                    icon="Ag"
                    onPress={() => navigation.navigate('Portfolio')}
                />

                <View style={{ height: 110 }} />
            </ScrollView>

            {/* Action Buttons Row */}
            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.requestBtn]}
                    onPress={() => navigation.navigate('ChitFundRequest')}
                    activeOpacity={0.85}
                >
                    <Ionicons name="paper-plane" size={20} color="#2e7d32" />
                    <Text style={styles.requestBtnText}>Request</Text>
                    <Text style={styles.actionBtnSub}>Start a Plan</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, styles.payBtn]}
                    onPress={() => navigation.navigate('ChitFundPay')}
                    activeOpacity={0.85}
                >
                    <Ionicons name="phone-portrait" size={20} color="#FFFFFF" />
                    <Text style={styles.payBtnText}>Pay</Text>
                    <Text style={styles.payBtnSub}>UPI Payment</Text>
                </TouchableOpacity>
            </View>

            {/* Sidebar Modal */}
            <SidebarModal
                visible={sidebarVisible}
                onClose={() => setSidebarVisible(false)}
                navigation={navigation}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f8e9',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2e7d32',
        letterSpacing: 2,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    welcomeSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    welcomeText: {
        color: '#4caf50',
        fontSize: 12,
        letterSpacing: 1,
        marginBottom: 5,
        fontWeight: 'bold'
    },
    userName: {
        color: '#1b3223',
        fontSize: 28,
        fontWeight: '300',
        marginBottom: 20,
    },
    nameHighlight: {
        fontWeight: 'bold',
        color: '#2e7d32',
    },
    holdingsPill: {
        width: '90%',
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        padding: 24,
        borderWidth: 1,
        borderColor: '#c8e6c9',
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    holdingsLabel: {
        color: '#4caf50',
        fontSize: 14,
        marginBottom: 15,
        fontWeight: 'bold',
        textAlign: 'center',
        letterSpacing: 2
    },
    holdingsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center'
    },
    holdingItem: {
        alignItems: 'center',
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginBottom: 8,
    },
    holdingText: {
        color: '#1b3223',
        fontSize: 24,
        fontWeight: 'bold',
    },
    holdingSubText: {
        color: '#66bb6a',
        fontSize: 12,
        marginTop: 4
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: '#e8f5e9',
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 30,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4CAF50',
        marginRight: 8,
    },
    liveText: {
        color: '#4caf50',
        fontSize: 10,
        letterSpacing: 1,
        fontWeight: 'bold'
    },
    rateCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e8f5e9',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3
    },
    rateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        zIndex: 1,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    iconText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    brandName: {
        color: '#4caf50',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 4
    },
    metalTitle: {
        color: '#1b3223',
        fontSize: 18,
        fontWeight: 'bold',
    },
    metalSubtitle: {
        color: '#81c784',
        fontSize: 12,
    },
    trendBadge: {
        position: 'absolute',
        right: 0,
        top: 0,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f5e9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    trendText: {
        color: '#4CAF50',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    priceRow: {
        zIndex: 1,
    },
    priceLabel: {
        color: '#66bb6a',
        fontSize: 12,
        marginBottom: 4,
        fontWeight: 'bold'
    },
    priceValue: {
        color: '#2e7d32',
        fontSize: 32,
        fontWeight: 'bold',
    },
    priceDecimal: {
        fontSize: 20,
        color: '#666',
    },
    lastUpdated: {
        color: '#81c784',
        fontSize: 10,
        marginTop: 8,
    },
    metalVisual: {
        position: 'absolute',
        right: -40,
        bottom: -40,
        width: 150,
        height: 100,
        borderRadius: 10,
        transform: [{ rotate: '-15deg' }],
        zIndex: 0,
    },
    actionRow: {
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        borderRadius: 20,
        paddingVertical: 14,
        paddingHorizontal: 12,
        alignItems: 'center',
        elevation: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    requestBtn: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#2e7d32',
        shadowColor: '#2e7d32',
    },
    requestBtnText: {
        color: '#2e7d32',
        fontWeight: 'bold',
        fontSize: 16,
        marginTop: 4,
    },
    actionBtnSub: {
        color: '#4caf50',
        fontSize: 10,
        marginTop: 2,
        fontWeight: '600'
    },
    payBtn: {
        backgroundColor: '#2e7d32',
        shadowColor: '#2e7d32',
    },
    payBtnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
        marginTop: 4,
    },
    payBtnSub: {
        color: '#c8e6c9',
        fontSize: 10,
        marginTop: 2,
    },
});

export default HomeScreen;
