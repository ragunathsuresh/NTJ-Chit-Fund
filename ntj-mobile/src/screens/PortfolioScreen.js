import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import marketService from '../services/marketService';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const PortfolioScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const { user, refreshUser } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [rates, setRates] = useState({ gold: null, silver: null });
    const [invested, setInvested] = useState({ goldAmount: 0, silverAmount: 0, loaded: false });

    useFocusEffect(
        useCallback(() => {
            fetchInvestedAmounts();
            fetchRates();
            refreshUser();
        }, [])
    );

    const normalizeStatus = (status) => {
        const value = String(status || '').trim().toLowerCase();
        if (['success', 'approved', 'completed'].includes(value)) return 'Success';
        if (['failed', 'rejected'].includes(value)) return 'Failed';
        return 'Pending';
    };

    const fetchInvestedAmounts = async () => {
        try {
            const res = await api.get('/orders');
            if (res.data?.success) {
                const summary = (res.data.data || []).reduce((acc, order) => {
                    if (normalizeStatus(order.status) !== 'Success') {
                        return acc;
                    }

                    const paid = parseFloat(order.amountPaid || 0);
                    const grams = parseFloat(order.gramsCredited || 0);
                    const rate = parseFloat(order.ratePerGram || 0);
                    const orderAmount = paid > 0 ? paid : (grams * rate);

                    if (order.metalType === 'gold') {
                        acc.goldAmount += orderAmount;
                    } else if (order.metalType === 'silver') {
                        acc.silverAmount += orderAmount;
                    }
                    return acc;
                }, { goldAmount: 0, silverAmount: 0 });

                setInvested({
                    goldAmount: summary.goldAmount,
                    silverAmount: summary.silverAmount,
                    loaded: true,
                });
                return;
            }
        } catch (e) {
            // Ignore and fall back to zero values below.
        }

        setInvested({
            goldAmount: 0,
            silverAmount: 0,
            loaded: true,
        });
    };

    const fetchRates = async () => {
        try {
            const data = await marketService.getRates();
            if (data.success) {
                setRates(data.data);
            }
        } catch (e) {
            // non-critical
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchInvestedAmounts(), fetchRates(), refreshUser()]);
        setRefreshing(false);
    }, []);

    const goldCurrentPrice = parseFloat(rates.gold?.sellPrice || 7500);
    const silverCurrentPrice = parseFloat(rates.silver?.sellPrice || 85);

    const goldAmount = invested.loaded ? parseFloat(invested.goldAmount || 0) : 0;
    const silverAmount = invested.loaded ? parseFloat(invested.silverAmount || 0) : 0;
    const totalInvested = goldAmount + silverAmount;

    // Grams are derived from cumulative invested amount using the latest rate.
    const goldQuantity = goldCurrentPrice > 0 ? goldAmount / goldCurrentPrice : 0;
    const silverQuantity = silverCurrentPrice > 0 ? silverAmount / silverCurrentPrice : 0;

    const goldPercent = totalInvested > 0 ? (goldAmount / totalInvested) * 100 : 50;
    const silverPercent = totalInvested > 0 ? (silverAmount / totalInvested) * 100 : 50;

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return 'Rs 0';
        const num = parseFloat(amount);
        return 'Rs ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatQuantity = (amount) => {
        const num = parseFloat(amount) || 0;
        if (num === 0) return '0.0000';
        return num.toFixed(4);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
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
                <Text style={[styles.headerTitle, { color: colors.text }]}>My Portfolio</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('AppSettings')}
                        style={styles.iconButton}
                    >
                            <Ionicons name="settings-outline" size={24} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            >
                <View style={styles.totalBalanceSection}>
                    <Text style={[styles.totalBalanceLabel, { color: colors.textSecondary }]}>TOTAL AMOUNT</Text>
                    <Text style={[styles.totalBalanceAmount, { color: colors.text }]}>{formatCurrency(totalInvested)}</Text>
                    <Text style={[styles.refreshHint, { color: colors.textSecondary }]}>Includes cumulative approved past transactions</Text>
                </View>

                <View style={[styles.assetAllocationCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={styles.allocationHeader}>
                        <Text style={[styles.allocationTitle, { color: colors.text }]}>Asset Allocation</Text>
                        <Text style={[styles.allocationPercentages, { color: colors.textSecondary }]}>
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
                            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Gold</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#81c784' }]} />
                            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Silver</Text>
                        </View>
                    </View>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Metal Holdings</Text>

                <View style={[styles.holdingCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={styles.holdingHeader}>
                        <View style={styles.holdingTitleRow}>
                            <Ionicons name="medal" size={20} color="#FFD700" />
                            <Text style={[styles.holdingLabel, { color: colors.textSecondary }]}>24K GOLD</Text>
                        </View>
                        <View style={styles.marketValueSection}>
                            <Text style={[styles.marketValueLabel, { color: colors.textSecondary }]}>Amount</Text>
                            <Text style={[styles.marketValue, { color: colors.text }]}>{formatCurrency(goldAmount)}</Text>
                        </View>
                    </View>

                    <Text style={styles.quantityText}>{formatQuantity(goldQuantity)}g</Text>

                    <View style={styles.holdingFooter}>
                        <View>
                            <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>CURRENT GOLD RATE</Text>
                            <Text style={[styles.footerValue, { color: colors.text }]}>{formatCurrency(goldCurrentPrice)}/g</Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.holdingCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={styles.holdingHeader}>
                        <View style={styles.holdingTitleRow}>
                            <Ionicons name="diamond-outline" size={20} color="#C0C0C0" />
                            <Text style={[styles.holdingLabel, { color: colors.textSecondary }]}>FINE SILVER</Text>
                        </View>
                        <View style={styles.marketValueSection}>
                            <Text style={[styles.marketValueLabel, { color: colors.textSecondary }]}>Amount</Text>
                            <Text style={[styles.marketValue, { color: colors.text }]}>{formatCurrency(silverAmount)}</Text>
                        </View>
                    </View>

                    <Text style={styles.quantityText}>{formatQuantity(silverQuantity)}g</Text>

                    <View style={styles.holdingFooter}>
                        <View>
                            <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>CURRENT SILVER RATE</Text>
                            <Text style={[styles.footerValue, { color: colors.text }]}>{formatCurrency(silverCurrentPrice)}/g</Text>
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
        color: '#1b3223', fontSize: 36, fontWeight: 'bold', marginBottom: 8
    },
    refreshHint: {
        color: '#888', fontSize: 12, marginTop: 4, fontWeight: '600'
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
});

export default PortfolioScreen;
