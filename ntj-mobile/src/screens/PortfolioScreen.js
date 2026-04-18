import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import marketService from '../services/marketService';
import api from '../services/api';

const PortfolioScreen = ({ navigation }) => {
    const { user, refreshUser } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [rates, setRates] = useState({ gold: null, silver: null });
    // Direct balance from DB — always accurate
    const [balance, setBalance] = useState({ goldBalance: 0, silverBalance: 0, loaded: false });

    // ── Fetch fresh balance + rates every time screen is focused ──────
    useFocusEffect(
        useCallback(() => {
            fetchBalance();
            fetchRates();
            refreshUser(); // also refresh context for other screens
        }, [])
    );

    const fetchBalance = async () => {
        try {
            const res = await api.get('/orders/balance');
            if (res.data?.success) {
                setBalance({
                    goldBalance: res.data.data.goldBalance || 0,
                    silverBalance: res.data.data.silverBalance || 0,
                    loaded: true,
                });
            }
        } catch (e) {
            // fallback to user context
            setBalance({
                goldBalance: user?.goldBalance || 0,
                silverBalance: user?.silverBalance || 0,
                loaded: true,
            });
        }
    };

    const fetchRates = async () => {
        try {
            const data = await marketService.getRates();
            if (data.success) setRates(data.data);
        } catch (e) {
            // non-critical
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchBalance(), fetchRates(), refreshUser()]);
        setRefreshing(false);
    }, []);

    // Use direct DB balance (most accurate)
    const goldQuantity = balance.loaded ? parseFloat(balance.goldBalance) : parseFloat(user?.goldBalance || 0);
    const silverQuantity = balance.loaded ? parseFloat(balance.silverBalance) : parseFloat(user?.silverBalance || 0);

    // Use live rates or fallback to sensible defaults
    const goldCurrentPrice = parseFloat(rates.gold?.sellPrice || 7500);
    const silverCurrentPrice = parseFloat(rates.silver?.sellPrice || 85);

    const goldAvgBuyPrice = 7200;
    const silverAvgBuyPrice = 80;

    const goldMarketValue = goldQuantity * goldCurrentPrice;
    const silverMarketValue = silverQuantity * silverCurrentPrice;
    const totalBalance = goldMarketValue + silverMarketValue;

    const goldUnrealizedPnL = (goldCurrentPrice - goldAvgBuyPrice) * goldQuantity;
    const goldPnLPercent = goldAvgBuyPrice > 0
        ? ((goldCurrentPrice - goldAvgBuyPrice) / goldAvgBuyPrice) * 100 : 0;

    const silverUnrealizedPnL = (silverCurrentPrice - silverAvgBuyPrice) * silverQuantity;
    const silverPnLPercent = silverAvgBuyPrice > 0
        ? ((silverCurrentPrice - silverAvgBuyPrice) / silverAvgBuyPrice) * 100 : 0;

    const goldPercent = totalBalance > 0 ? (goldMarketValue / totalBalance) * 100 : 50;
    const silverPercent = totalBalance > 0 ? (silverMarketValue / totalBalance) * 100 : 50;

    const change24h = { amount: 5400, percent: 1.2 };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '₹0';
        const num = parseFloat(amount);
        return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatQuantity = (amount) => {
        const num = parseFloat(amount) || 0;
        if (num === 0) return '0.0000';
        return num.toFixed(4);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                    {user?.profilePhoto ? (
                        <Image source={{ uri: user.profilePhoto }} style={styles.profileImage} />
                    ) : (
                        <Image
                            source={{ uri: `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=FFD700&color=000&size=128` }}
                            style={styles.profileImage}
                        />
                    )}
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Portfolio</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('AppSettings')}
                        style={styles.iconButton}
                    >
                        <Ionicons name="settings-outline" size={24} color="#2e7d32" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#2e7d32"
                        colors={['#2e7d32']}
                    />
                }
            >
                {/* Total Balance */}
                <View style={styles.totalBalanceSection}>
                    <Text style={styles.totalBalanceLabel}>TOTAL BALANCE</Text>
                    <Text style={styles.totalBalanceAmount}>{formatCurrency(totalBalance)}</Text>
                    <View style={styles.changeIndicator}>
                        <Ionicons
                            name={change24h.percent >= 0 ? "arrow-up" : "arrow-down"}
                            size={16}
                            color={change24h.percent >= 0 ? "#4CAF50" : "#FF4444"}
                        />
                        <Text style={[
                            styles.changeText,
                            { color: change24h.percent >= 0 ? "#4CAF50" : "#FF4444" }
                        ]}>
                            {change24h.percent >= 0 ? '+' : ''}{change24h.percent.toFixed(1)}%
                            ({change24h.percent >= 0 ? '+' : ''}{formatCurrency(change24h.amount)})
                        </Text>
                        <View style={styles.timeBadge}>
                            <Text style={styles.timeBadgeText}>24h</Text>
                        </View>
                    </View>
                    {/* Pull-to-refresh hint */}
                    <Text style={styles.refreshHint}>↓ Pull down to refresh balance</Text>
                </View>

                {/* Asset Allocation */}
                <View style={styles.assetAllocationCard}>
                    <View style={styles.allocationHeader}>
                        <Text style={styles.allocationTitle}>Asset Allocation</Text>
                        <Text style={styles.allocationPercentages}>
                            Gold {goldPercent.toFixed(0)}% · Silver {silverPercent.toFixed(0)}%
                        </Text>
                    </View>

                    <View style={styles.allocationBar}>
                        <View style={[styles.goldSegment, { flex: Math.max(goldPercent, 0.1) }]} />
                        <View style={[styles.silverSegment, { flex: Math.max(silverPercent, 0.1) }]} />
                    </View>

                    <View style={styles.legend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#2e7d32' }]} />
                            <Text style={styles.legendText}>Gold</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#81c784' }]} />
                            <Text style={styles.legendText}>Silver</Text>
                        </View>
                    </View>
                </View>

                {/* Metal Holdings */}
                <Text style={styles.sectionTitle}>Metal Holdings</Text>

                {/* Gold Card */}
                <View style={styles.holdingCard}>
                    <View style={styles.holdingHeader}>
                        <View style={styles.holdingTitleRow}>
                            <Ionicons name="medal" size={20} color="#FFD700" />
                            <Text style={styles.holdingLabel}>24K GOLD</Text>
                        </View>
                        <View style={styles.marketValueSection}>
                            <Text style={styles.marketValueLabel}>Market Value</Text>
                            <Text style={styles.marketValue}>{formatCurrency(goldMarketValue)}</Text>
                        </View>
                    </View>

                    <Text style={styles.quantityText}>{formatQuantity(goldQuantity)}g</Text>

                    <View style={styles.holdingFooter}>
                        <View>
                            <Text style={styles.footerLabel}>AVG. BUY PRICE</Text>
                            <Text style={styles.footerValue}>{formatCurrency(goldAvgBuyPrice)}/g</Text>
                        </View>
                        <View style={styles.pnlSection}>
                            <Text style={styles.footerLabel}>UNREALIZED P&L</Text>
                            <Text style={[
                                styles.pnlValue,
                                { color: goldUnrealizedPnL >= 0 ? '#4CAF50' : '#FF4444' }
                            ]}>
                                {goldUnrealizedPnL >= 0 ? '+' : ''}{formatCurrency(goldUnrealizedPnL)}
                                ({goldPnLPercent >= 0 ? '+' : ''}{goldPnLPercent.toFixed(1)}%)
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Silver Card */}
                <View style={styles.holdingCard}>
                    <View style={styles.holdingHeader}>
                        <View style={styles.holdingTitleRow}>
                            <Ionicons name="diamond-outline" size={20} color="#C0C0C0" />
                            <Text style={styles.holdingLabel}>FINE SILVER</Text>
                        </View>
                        <View style={styles.marketValueSection}>
                            <Text style={styles.marketValueLabel}>Market Value</Text>
                            <Text style={styles.marketValue}>{formatCurrency(silverMarketValue)}</Text>
                        </View>
                    </View>

                    <Text style={styles.quantityText}>{formatQuantity(silverQuantity)}g</Text>

                    <View style={styles.holdingFooter}>
                        <View>
                            <Text style={styles.footerLabel}>AVG. BUY PRICE</Text>
                            <Text style={styles.footerValue}>{formatCurrency(silverAvgBuyPrice)}/g</Text>
                        </View>
                        <View style={styles.pnlSection}>
                            <Text style={styles.footerLabel}>UNREALIZED P&L</Text>
                            <Text style={[
                                styles.pnlValue,
                                { color: silverUnrealizedPnL >= 0 ? '#4CAF50' : '#FF4444' }
                            ]}>
                                {silverUnrealizedPnL >= 0 ? '+' : ''}{formatCurrency(silverUnrealizedPnL)}
                                ({silverPnLPercent >= 0 ? '+' : ''}{silverPnLPercent.toFixed(1)}%)
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 50 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f8e9' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50
    },
    profileImage: {
        width: 44, height: 44, borderRadius: 22,
        borderWidth: 2, borderColor: '#2e7d32'
    },
    headerTitle: {
        fontSize: 20, fontWeight: 'bold', color: '#1b3223',
        flex: 1, textAlign: 'center'
    },
    headerIcons: { flexDirection: 'row', gap: 12 },
    iconButton: { padding: 4 },
    scrollContent: { padding: 20 },
    totalBalanceSection: { alignItems: 'center', marginBottom: 30 },
    totalBalanceLabel: {
        color: '#4caf50', fontSize: 12, fontWeight: 'bold',
        letterSpacing: 1, marginBottom: 8
    },
    totalBalanceAmount: {
        color: '#1b3223', fontSize: 36, fontWeight: 'bold', marginBottom: 12
    },
    changeIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    changeText: { fontSize: 14, fontWeight: '600' },
    timeBadge: {
        backgroundColor: '#e8f5e9', paddingHorizontal: 8,
        paddingVertical: 2, borderRadius: 8, marginLeft: 4
    },
    timeBadgeText: { color: '#2e7d32', fontSize: 11, fontWeight: '700' },
    refreshHint: {
        color: '#aaa', fontSize: 11, marginTop: 10, fontStyle: 'italic'
    },
    assetAllocationCard: {
        backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20,
        marginBottom: 30, borderWidth: 1, borderColor: '#e8f5e9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 10, elevation: 3
    },
    allocationHeader: { marginBottom: 16 },
    allocationTitle: { color: '#1b3223', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    allocationPercentages: { color: '#4caf50', fontSize: 12, fontWeight: '600' },
    allocationBar: {
        flexDirection: 'row', height: 10, borderRadius: 5,
        overflow: 'hidden', marginBottom: 12
    },
    goldSegment: { backgroundColor: '#2e7d32' },
    silverSegment: { backgroundColor: '#81c784' },
    legend: { flexDirection: 'row', gap: 20 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { color: '#4caf50', fontSize: 12, fontWeight: 'bold' },
    sectionTitle: {
        color: '#1b3223', fontSize: 18, fontWeight: 'bold',
        marginBottom: 16, letterSpacing: 0.5
    },
    holdingCard: {
        backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20,
        marginBottom: 16, borderWidth: 1, borderColor: '#e8f5e9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05, shadowRadius: 10, elevation: 3
    },
    holdingHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 12
    },
    holdingTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    holdingLabel: { color: '#4caf50', fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5 },
    marketValueSection: { alignItems: 'flex-end' },
    marketValueLabel: { color: '#81c784', fontSize: 11, marginBottom: 2, fontWeight: 'bold' },
    marketValue: { color: '#1b3223', fontSize: 18, fontWeight: 'bold' },
    quantityText: { color: '#2e7d32', fontSize: 32, fontWeight: 'bold', marginBottom: 16 },
    holdingFooter: {
        flexDirection: 'row', justifyContent: 'space-between',
        borderTopWidth: 1, borderTopColor: '#f0f4f1', paddingTop: 16
    },
    footerLabel: {
        color: '#81c784', fontSize: 11, marginBottom: 4,
        letterSpacing: 0.5, fontWeight: 'bold'
    },
    footerValue: { color: '#1b3223', fontSize: 14, fontWeight: 'bold' },
    pnlSection: { alignItems: 'flex-end' },
    pnlValue: { fontSize: 14, fontWeight: 'bold' }
});

export default PortfolioScreen;
