import React, { useState, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView,
    ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import chitFundService from '../services/chitFundService';
import api from '../services/api';

const STATUS_CFG = {
    approved:  { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  label: 'Approved' },
    active:    { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  label: 'Active' },
    completed: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: 'Completed' },
    pending:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Pending' },
    rejected:  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  label: 'Rejected' },
};

export default function ChitFundPayScreen({ navigation }) {
    const [approvedPlans, setApprovedPlans] = useState([]);
    const [allPlans, setAllPlans] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => { loadData(); }, [])
    );

    const loadData = async (showLoader = true) => {
        if (showLoader) setIsLoading(true);
        try {
            const [plansRes, ordersRes] = await Promise.all([
                chitFundService.getMyPlans(),
                api.get('/orders')
            ]);

            if (plansRes.success) {
                // Sort newest first
                const sorted = [...plansRes.data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setAllPlans(sorted);
                setApprovedPlans(sorted.filter(p => ['approved', 'active'].includes(p.status)));
            }
            if (ordersRes.data?.success) {
                setTransactions(ordersRes.data.data || []);
            }
        } catch (err) {
            console.error('ChitFundPay loadData error:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const onRefresh = () => { setIsRefreshing(true); loadData(false); };

    const handlePlanPress = (plan) => {
        // Navigate to BuyMetal with pre-filled amount from this chit fund plan
        navigation.navigate('BuyMetal', {
            selectedMetal: plan.metalType,
            presetAmount: plan.monthlyAmount.toString(),
            adminUpiId: plan.upiId || null,
            chitFundPlanId: plan._id,
            chitFundMonth: (plan.paidMonths || 0) + 1,
            chitFundTotalMonths: plan.totalMonths,
        });
    };

    const formatDate = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const isOverdue = (dueDate) => dueDate && new Date(dueDate) < new Date();

    const daysLeft = (dueDate) => {
        if (!dueDate) return null;
        const diff = Math.ceil((new Date(dueDate) - new Date()) / 86400000);
        return diff;
    };

    // Determine next unpaid payment for a plan
    const nextPayment = (plan) => {
        if (!plan.payments?.length) return null;
        return plan.payments.find(p => p.status !== 'paid') || null;
    };

    // Check if current month's payment is already done
    // Checks BOTH: plan.payments[] (set when admin approves) AND orders/transactions list
    const isCurrentMonthPaid = (plan) => {
        const now = new Date();
        const cm = now.getMonth();
        const cy = now.getFullYear();

        // 1️⃣ Check plan.payments array (most reliable — set when admin approves the order)
        const paidInPlanPayments = plan.payments?.some(p => {
            if (p.status !== 'paid' || !p.paidDate) return false;
            const pd = new Date(p.paidDate);
            return pd.getMonth() === cm && pd.getFullYear() === cy;
        });
        if (paidInPlanPayments) return true;

        // 2️⃣ Check orders/transactions list this month (covers Pending + Success orders for this plan)
        const paidInOrders = transactions.some(txn => {
            if (!['Pending', 'Success'].includes(txn.status)) return false;
            const txDate = new Date(txn.createdAt);
            if (txDate.getMonth() !== cm || txDate.getFullYear() !== cy) return false;

            // If order has chitFundPlanId, match directly
            if (txn.chitFundPlanId) {
                return txn.chitFundPlanId === plan._id || txn.chitFundPlanId?.toString() === plan._id?.toString();
            }
            // Fallback: match by metalType + amount (best effort for old orders without planId)
            return txn.metalType === plan.metalType && Math.abs(txn.amountPaid - plan.monthlyAmount) < 10;
        });

        return paidInOrders;
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={{ color: '#888', marginTop: 12 }}>Loading your plans...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFD700" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Make Payment</Text>
                    <Text style={styles.headerSub}>{approvedPlans.length} plan{approvedPlans.length !== 1 ? 's' : ''} ready to pay</Text>
                </View>
                <TouchableOpacity onPress={onRefresh}>
                    <Ionicons name="refresh" size={22} color="#FFD700" />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#FFD700" />}
            >

                {/* ── APPROVED PLANS SECTION ────────────────── */}
                <View style={styles.sectionHeader}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.sectionTitle}>Approved Plans — Tap to Pay</Text>
                </View>

                {approvedPlans.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyEmoji}>⏳</Text>
                        <Text style={styles.emptyTitle}>No Approved Plans Yet</Text>
                        <Text style={styles.emptySub}>Submit a request and wait for admin approval. Approved plans will appear here.</Text>
                        <TouchableOpacity
                            style={styles.emptyBtn}
                            onPress={() => navigation.navigate('ChitFundRequest')}
                        >
                            <Ionicons name="paper-plane" size={15} color="#000" />
                            <Text style={styles.emptyBtnText}>Go to Requests</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    approvedPlans.map((plan) => {
                        const cfg = STATUS_CFG[plan.status];
                        const next = nextPayment(plan);
                        const overdue = next ? isOverdue(next.dueDate) : false;
                        const days = next ? daysLeft(next.dueDate) : null;
                        const progressPct = plan.totalMonths ? ((plan.paidMonths || 0) / plan.totalMonths) * 100 : 0;
                        const monthPaid = isCurrentMonthPaid(plan);

                        return (
                            <TouchableOpacity
                                key={plan._id}
                                style={[styles.planCard, overdue && !monthPaid && styles.planCardOverdue, monthPaid && styles.planCardPaid]}
                                onPress={() => !monthPaid && handlePlanPress(plan)}
                                activeOpacity={monthPaid ? 1 : 0.82}
                                disabled={monthPaid}
                            >
                                {/* Overdue banner */}
                                {overdue && (
                                    <View style={styles.overdueBanner}>
                                        <Ionicons name="warning" size={13} color="#ff4444" />
                                        <Text style={styles.overdueBannerText}>Payment Overdue!</Text>
                                    </View>
                                )}

                                {/* Card Top */}
                                <View style={styles.planCardTop}>
                                    <View style={styles.planMeta}>
                                        <Text style={styles.planMetalText}>
                                            {plan.metalType === 'gold' ? '🪙' : '⚪'} {plan.requestName || (plan.metalType === 'gold' ? 'Gold Chit Fund' : 'Silver Chit Fund')}
                                        </Text>
                                        <Text style={{ color: '#81c784', fontSize: 11, fontWeight: '600', marginBottom: 4 }}>
                                            {plan.metalType === 'gold' ? 'Gold' : 'Silver'} Plan
                                        </Text>
                                        <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
                                            <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.planAmtBlock}>
                                        <Text style={styles.planAmtLabel}>Monthly</Text>
                                        <Text style={styles.planAmt}>₹{plan.monthlyAmount?.toLocaleString('en-IN')}</Text>
                                    </View>
                                </View>

                                {/* Progress Bar */}
                                <View style={styles.progressSection}>
                                    <View style={styles.progressTopRow}>
                                        <Text style={styles.progressLabel}>
                                            {plan.paidMonths || 0}/{plan.totalMonths} months paid
                                        </Text>
                                        <Text style={[styles.progressLabel, { color: cfg.color }]}>
                                            {Math.round(progressPct)}%
                                        </Text>
                                    </View>
                                    <View style={styles.progressBg}>
                                        <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: cfg.color }]} />
                                    </View>
                                </View>

                                {/* Next Due */}
                                {next && (
                                    <View style={[styles.nextDueRow, overdue && styles.nextDueRowOverdue]}>
                                        <View>
                                            <Text style={[styles.nextDueLabel, overdue && { color: '#ff4444' }]}>
                                                {overdue ? '⚠️ Due was' : '📅 Next Due'} — Month {next.month}
                                            </Text>
                                            <Text style={styles.nextDueDate}>{formatDate(next.dueDate)}</Text>
                                        </View>
                                        <View style={styles.daysChip}>
                                            <Text style={[styles.daysChipText, overdue && { color: '#ff4444' }]}>
                                                {overdue ? `${Math.abs(days)}d ago` : `${days}d left`}
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                {/* UPI ID row */}
                                {plan.upiId && (
                                    <View style={styles.upiRow}>
                                        <Ionicons name="phone-portrait-outline" size={14} color="#4CAF50" />
                                        <Text style={styles.upiText}>Pay to: {plan.upiId}</Text>
                                    </View>
                                )}

                                {/* Tap to Pay CTA — hidden if this month already paid */}
                                {monthPaid ? (
                                    <View style={styles.paidThisMonthRow}>
                                        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                                        <Text style={styles.paidThisMonthText}>✅ Payment done for this month</Text>
                                    </View>
                                ) : (
                                    <View style={styles.tapToPayRow}>
                                        <Text style={styles.tapToPayText}>Tap to pay ₹{plan.monthlyAmount?.toLocaleString('en-IN')}</Text>
                                        <Ionicons name="arrow-forward-circle" size={22} color="#FFFFFF" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })
                )}

                {/* ── ALL PLANS SUMMARY ─────────────────────── */}
                {allPlans.filter(p => !['approved', 'active'].includes(p.status)).length > 0 && (
                    <>
                        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                            <Ionicons name="list" size={16} color="#888" />
                            <Text style={styles.sectionTitle}>Other Plans</Text>
                        </View>
                        {allPlans
                            .filter(p => !['approved', 'active'].includes(p.status))
                            .map(plan => {
                                const cfg = STATUS_CFG[plan.status] || STATUS_CFG.pending;
                                return (
                                    <View key={plan._id} style={styles.otherPlanRow}>
                                        <Text style={styles.otherPlanMetal}>
                                            {plan.metalType === 'gold' ? '🪙' : '⚪'} {plan.metalType === 'gold' ? 'Gold' : 'Silver'}
                                        </Text>
                                        <Text style={styles.otherPlanAmt}>₹{plan.monthlyAmount?.toLocaleString('en-IN')}/mo × {plan.totalMonths}mo</Text>
                                        <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
                                            <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
                                        </View>
                                    </View>
                                );
                            })}
                    </>
                )}

                {/* ── TRANSACTION HISTORY ───────────────────── */}
                <View style={[styles.sectionHeader, { marginTop: 28 }]}>
                    <Ionicons name="receipt-outline" size={16} color="#FFD700" />
                    <Text style={styles.sectionTitle}>Transaction History</Text>
                    {transactions.length > 0 && (
                        <View style={styles.txnCountBadge}>
                            <Text style={styles.txnCountText}>{transactions.length}</Text>
                        </View>
                    )}
                </View>

                {transactions.length === 0 ? (
                    <View style={styles.emptyTxn}>
                        <Ionicons name="receipt-outline" size={32} color="#333" />
                        <Text style={styles.emptyTxnText}>No transactions yet</Text>
                    </View>
                ) : (
                    transactions.map((txn, idx) => {
                        const statusColors = { Success: '#10b981', Pending: '#f59e0b', Failed: '#ef4444' };
                        const color = statusColors[txn.status] || '#888';
                        return (
                            <View key={txn._id || idx} style={styles.txnRow}>
                                <View style={[styles.txnIcon, { backgroundColor: txn.metalType === 'gold' ? 'rgba(255,215,0,0.12)' : 'rgba(192,192,192,0.12)' }]}>
                                    <Text style={styles.txnIconText}>{txn.metalType === 'gold' ? '🪙' : '⚪'}</Text>
                                </View>
                                <View style={styles.txnMid}>
                                    <Text style={styles.txnMetal}>
                                        {txn.metalType === 'gold' ? 'Gold' : 'Silver'} — {txn.gramsCredited?.toFixed(4)} g
                                    </Text>
                                    <Text style={styles.txnDate}>{formatDate(txn.createdAt)}</Text>
                                    {txn.paymentId && (
                                        <Text style={styles.txnRef}>Ref: {txn.paymentId}</Text>
                                    )}
                                </View>
                                <View style={styles.txnRight}>
                                    <Text style={styles.txnAmt}>₹{txn.amountPaid?.toLocaleString('en-IN')}</Text>
                                    <View style={[styles.txnStatusBadge, { backgroundColor: `${color}20` }]}>
                                        <Text style={[styles.txnStatusText, { color }]}>{txn.status}</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f8e9' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 50, paddingBottom: 14, paddingHorizontal: 20,
        backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#e8f5e9',
    },
    backBtn: { width: 36, height: 36, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32' },
    headerSub: { fontSize: 11, color: '#81c784', marginTop: 1, fontWeight: '600' },
    scroll: { padding: 16 },
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12,
    },
    sectionTitle: { color: '#4caf50', fontSize: 13, fontWeight: '700', letterSpacing: 0.4, flex: 1 },
    txnCountBadge: {
        backgroundColor: '#e8f5e9', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2,
    },
    txnCountText: { color: '#2e7d32', fontSize: 11, fontWeight: 'bold' },

    // Empty state
    emptyCard: {
        backgroundColor: '#FFFFFF', borderRadius: 16, padding: 28,
        alignItems: 'center', borderWidth: 1, borderColor: '#e8f5e9', marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    },
    emptyEmoji: { fontSize: 40, marginBottom: 10 },
    emptyTitle: { color: '#1b3223', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
    emptySub: { color: '#81c784', fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 16, fontWeight: '500' },
    emptyBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#2e7d32', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 18,
    },
    emptyBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },

    // Plan cards
    planCard: {
        backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 14,
        borderWidth: 1, borderColor: '#e8f5e9',
        elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10,
    },
    planCardOverdue: { borderColor: '#ffcdd2', shadowColor: '#ef5350' },
    planCardPaid: { borderColor: '#bbf7d0', opacity: 0.85 },
    paidThisMonthRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#d1fae5', borderRadius: 14, padding: 14,
    },
    paidThisMonthText: { color: '#065f46', fontSize: 14, fontWeight: 'bold', flex: 1 },
    overdueBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: '#ffebee', borderRadius: 8, padding: 8, marginBottom: 12,
    },
    overdueBannerText: { color: '#d32f2f', fontSize: 12, fontWeight: 'bold' },
    planCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    planMeta: { flex: 1 },
    planMetalText: { color: '#1b3223', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
    statusPill: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
    statusPillText: { fontSize: 11, fontWeight: 'bold' },
    planAmtBlock: { alignItems: 'flex-end' },
    planAmtLabel: { color: '#81c784', fontSize: 10, fontWeight: 'bold' },
    planAmt: { color: '#2e7d32', fontSize: 22, fontWeight: 'bold' },
    progressSection: { marginBottom: 16 },
    progressTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    progressLabel: { color: '#81c784', fontSize: 11, fontWeight: 'bold' },
    progressBg: { height: 8, backgroundColor: '#f1f8e9', borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4 },
    nextDueRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#f9fbf9', borderRadius: 12, padding: 12, marginBottom: 12,
        borderWidth: 1, borderColor: '#e8f5e9'
    },
    nextDueRowOverdue: { backgroundColor: '#fff5f5' },
    nextDueLabel: { color: '#2e7d32', fontSize: 12, fontWeight: '700', marginBottom: 2 },
    nextDueDate: { color: '#81c784', fontSize: 11, fontWeight: '600' },
    daysChip: { backgroundColor: '#f1f8e9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
    daysChipText: { color: '#2e7d32', fontSize: 12, fontWeight: 'bold' },
    upiRow: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#f1f8e9', borderRadius: 8, padding: 10, marginBottom: 12,
    },
    upiText: { color: '#43a047', fontSize: 12, fontWeight: '700' },
    tapToPayRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#2e7d32', borderRadius: 14, padding: 14,
        shadowColor: '#2e7d32', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    tapToPayText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },

    // Other plans
    otherPlanRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
        borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#e8f5e9', gap: 10,
    },
    otherPlanMetal: { color: '#1b3223', fontSize: 14, fontWeight: 'bold' },
    otherPlanAmt: { flex: 1, color: '#81c784', fontSize: 12, fontWeight: '600' },

    // Transactions
    emptyTxn: {
        alignItems: 'center', padding: 40, backgroundColor: '#FFFFFF',
        borderRadius: 20, borderWidth: 1, borderColor: '#e8f5e9',
    },
    emptyTxnText: { color: '#81c784', marginTop: 10, fontSize: 13, fontWeight: '600' },
    txnRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
        borderRadius: 16, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#e8f5e9', gap: 12,
        shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 1,
    },
    txnIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    txnIconText: { fontSize: 20 },
    txnMid: { flex: 1 },
    txnMetal: { color: '#1b3223', fontSize: 14, fontWeight: 'bold' },
    txnDate: { color: '#81c784', fontSize: 11, marginTop: 2, fontWeight: '600' },
    txnRef: { color: '#a5d6a7', fontSize: 10, marginTop: 1 },
    txnRight: { alignItems: 'flex-end' },
    txnAmt: { color: '#2e7d32', fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
    txnStatusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    txnStatusText: { fontSize: 10, fontWeight: 'bold' },
});
