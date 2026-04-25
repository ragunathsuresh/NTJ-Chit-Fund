import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, ActivityIndicator, RefreshControl, Modal, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import chitFundService from '../services/chitFundService';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const STATUS_CFG = {
    active:    { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  label: 'Active' },
    approved:  { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  label: 'Approved' },
    completed: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: 'Completed' },
    pending:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Pending' },
    rejected:  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  label: 'Rejected' },
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AllPlansScreen({ navigation }) {
    const { colors } = useTheme();
    const [plans, setPlans] = useState([]);
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const loadData = async (showLoader = true) => {
        if (showLoader) setIsLoading(true);
        try {
            const [plansRes, ordersRes] = await Promise.all([
                chitFundService.getMyPlans(),
                api.get('/orders'),
            ]);

            if (plansRes.success) {
                // Sort: active/approved first, then completed, then others — newest first within group
                const statusPriority = { active: 0, approved: 1, completed: 2, pending: 3, rejected: 4 };
                const sorted = [...plansRes.data].sort((a, b) => {
                    const diff = (statusPriority[a.status] ?? 9) - (statusPriority[b.status] ?? 9);
                    return diff !== 0 ? diff : new Date(b.createdAt) - new Date(a.createdAt);
                });
                setPlans(sorted);
            }

            if (ordersRes.data?.success) {
                setOrders(ordersRes.data.data || []);
            }
        } catch (err) {
            console.error('AllPlans loadData error:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const onRefresh = () => { setIsRefreshing(true); loadData(false); };

    // ── Filtering ───────────────────────────────────────────────────────────────
    const filtered = plans.filter(p =>
        !searchQuery.trim() ||
        (p.requestName || '').toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        p.metalType.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );

    // ── Get orders for a specific plan ──────────────────────────────────────────
    const getPlanOrders = (plan) => {
        return orders
            .filter(o => {
                if (o.chitFundPlanId) return o.chitFundPlanId === plan._id || o.chitFundPlanId?.toString() === plan._id?.toString();
                // fallback: match by metalType + approximate amount if no planId stored
                return false;
            })
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    };

    // ── Also pull from plan.payments array (approved/active plans) ──────────────
    const getPlanPayments = (plan) => {
        return (plan.payments || [])
            .filter(p => p.status === 'paid')
            .sort((a, b) => new Date(a.paidDate) - new Date(b.paidDate));
    };

    const handlePlanPress = (plan) => {
        setSelectedPlan(plan);
        setModalVisible(true);
    };

    const formatDate = (d) => {
        if (!d) return '—';
        const dt = new Date(d);
        return `${dt.getDate().toString().padStart(2,'0')} ${MONTH_NAMES[dt.getMonth()]} ${dt.getFullYear()}`;
    };

    const formatTime = (d) => {
        if (!d) return '—';
        const dt = new Date(d);
        const h = dt.getHours(), m = dt.getMinutes(), ampm = h >= 12 ? 'PM' : 'AM';
        return `${(h % 12 || 12).toString().padStart(2,'0')}:${m.toString().padStart(2,'0')} ${ampm}`;
    };

    // Build unified rows for the selected plan's transaction table
    const buildTableRows = (plan) => {
        const rows = [];
        const planPayments = getPlanPayments(plan); // from chitfund payments array
        const planOrders = getPlanOrders(plan);      // from orders collection

        // Prefer chitfund payment records (most accurate for chit fund plans)
        if (planPayments.length > 0) {
            planPayments.forEach((p, idx) => {
                rows.push({
                    sno: idx + 1,
                    date: formatDate(p.paidDate),
                    time: formatTime(p.paidDate),
                    amountPaid: p.amount || plan.monthlyAmount,
                    grams: null, // chit fund payments don't store grams directly
                    monthName: MONTH_NAMES[new Date(p.paidDate || p.dueDate).getMonth()],
                    month: p.month,
                    metalType: plan.metalType,
                    upiRef: p.upiTransactionId || '—',
                    source: 'payment',
                });
            });
        }

        // Fill in from orders if no payment records
        if (rows.length === 0 && planOrders.length > 0) {
            planOrders.forEach((o, idx) => {
                rows.push({
                    sno: idx + 1,
                    date: formatDate(o.createdAt),
                    time: formatTime(o.createdAt),
                    amountPaid: o.amountPaid,
                    grams: o.gramsCredited,
                    monthName: MONTH_NAMES[new Date(o.createdAt).getMonth()],
                    month: o.chitFundMonth || (idx + 1),
                    metalType: o.metalType,
                    upiRef: o.paymentId || '—',
                    source: 'order',
                    status: o.status,
                });
            });
        }

        return rows;
    };

    // ── Totals ──────────────────────────────────────────────────────────────────
    const getTotals = (rows) => {
        return {
            totalAmount: rows.reduce((s, r) => s + (r.amountPaid || 0), 0),
            totalGrams: rows.reduce((s, r) => s + (r.grams || 0), 0),
        };
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cardBackground }]}>
                <ActivityIndicator size="large" color="#2e7d32" />
                <Text style={{ color: colors.textSecondary, marginTop: 12, fontWeight: '600' }}>Loading plans...</Text>
            </View>
        );
    }

    const tableRows = selectedPlan ? buildTableRows(selectedPlan) : [];
    const totals = getTotals(tableRows);

    return (
        <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#2e7d32" />
                </TouchableOpacity>
                <View>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>All Plans</Text>
                    <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{plans.length} plan{plans.length !== 1 ? 's' : ''} total</Text>
                </View>
                <TouchableOpacity onPress={onRefresh}>
                    <Ionicons name="refresh" size={22} color="#2e7d32" />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search by plan name or metal..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#2e7d32" />}
            >
                {filtered.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={{ fontSize: 48, marginBottom: 12 }}>📋</Text>
                        <Text style={styles.emptyTitle}>
                            {searchQuery ? 'No plans match your search' : 'No plans yet'}
                        </Text>
                        <Text style={styles.emptySub}>
                            {searchQuery ? 'Try a different name' : 'Submit a chit fund request to get started.'}
                        </Text>
                    </View>
                ) : (
                    filtered.map((plan, idx) => {
                        const cfg = STATUS_CFG[plan.status] || STATUS_CFG.pending;
                        const paidCount = plan.paidMonths || 0;
                        const pct = plan.totalMonths ? (paidCount / plan.totalMonths) * 100 : 0;
                        const totalPaid = paidCount * plan.monthlyAmount;

                        return (
                            <TouchableOpacity
                                key={plan._id}
                                style={[styles.planCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                                onPress={() => handlePlanPress(plan)}
                                activeOpacity={0.82}
                            >
                                {/* Row 1: Name + Status */}
                                <View style={styles.planCardTop}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.planName}>
                                            {plan.metalType === 'gold' ? '🪙' : '⚪'} {plan.requestName || 'Plan'}
                                        </Text>
                                        <Text style={styles.planMeta}>
                                            {plan.metalType === 'gold' ? 'Gold' : 'Silver'} • ₹{plan.monthlyAmount?.toLocaleString('en-IN')}/mo × {plan.totalMonths}mo
                                        </Text>
                                    </View>
                                    <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
                                        <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
                                    </View>
                                </View>

                                {/* Progress */}
                                {['active', 'approved', 'completed'].includes(plan.status) && (
                                    <View style={styles.progressSection}>
                                        <View style={styles.progressRow}>
                                            <Text style={styles.progressLabel}>{paidCount}/{plan.totalMonths} months</Text>
                                            <Text style={[styles.progressLabel, { color: cfg.color }]}>{Math.round(pct)}%</Text>
                                        </View>
                                        <View style={styles.progressBg}>
                                            <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: cfg.color }]} />
                                        </View>
                                    </View>
                                )}

                                {/* Stats Row */}
                                <View style={styles.statsRow}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statVal}>₹{totalPaid.toLocaleString('en-IN')}</Text>
                                        <Text style={styles.statLabel}>Total Paid</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Text style={styles.statVal}>₹{(plan.totalAmount || plan.monthlyAmount * plan.totalMonths).toLocaleString('en-IN')}</Text>
                                        <Text style={styles.statLabel}>Total Plan</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Text style={[styles.statVal, { color: cfg.color }]}>{plan.totalMonths - paidCount}</Text>
                                        <Text style={styles.statLabel}>Remaining</Text>
                                    </View>
                                </View>

                                {/* Tap hint */}
                                <View style={styles.tapHint}>
                                    <Ionicons name="bar-chart-outline" size={13} color="#81c784" />
                                    <Text style={styles.tapHintText}>Tap to see transaction details</Text>
                                    <Ionicons name="chevron-forward" size={14} color="#81c784" />
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* ── Plan Detail Modal ─────────────────────────────── */}
            <Modal visible={modalVisible} animationType="slide" transparent={false} onRequestClose={() => setModalVisible(false)}>
                <View style={[styles.modalContainer, { backgroundColor: colors.cardBackground }]}>
                    {/* Modal Header */}
                    <View style={[styles.modalHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={24} color="#2e7d32" />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.modalTitle} numberOfLines={1}>
                                {selectedPlan?.metalType === 'gold' ? '🪙' : '⚪'} {selectedPlan?.requestName || 'Plan'}
                            </Text>
                            <Text style={styles.modalSub}>
                                {selectedPlan?.metalType === 'gold' ? 'Gold' : 'Silver'} Chit Fund • {selectedPlan?.totalMonths} months
                            </Text>
                        </View>
                    </View>

                    <ScrollView contentContainerStyle={styles.modalScroll}>
                        {/* Plan Summary Card */}
                        {selectedPlan && (
                            <View style={[styles.summaryCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                {[
                                    ['Metal', selectedPlan.metalType === 'gold' ? '🪙 Gold' : '⚪ Silver'],
                                    ['Status', STATUS_CFG[selectedPlan.status]?.label || selectedPlan.status],
                                    ['Monthly Amount', `₹${selectedPlan.monthlyAmount?.toLocaleString('en-IN')}`],
                                    ['Duration', `${selectedPlan.totalMonths} months`],
                                    ['Months Paid', `${selectedPlan.paidMonths || 0} / ${selectedPlan.totalMonths}`],
                                    ['Total Paid', `₹${((selectedPlan.paidMonths || 0) * selectedPlan.monthlyAmount).toLocaleString('en-IN')}`],
                                ].map(([label, value]) => (
                                    <View key={label} style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>{label}</Text>
                                        <Text style={styles.summaryValue}>{value}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Transaction Table */}
                        <Text style={styles.tableTitle}>📊 Transaction Details</Text>

                        {tableRows.length === 0 ? (
                            <View style={[styles.emptyTable, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                <Ionicons name="receipt-outline" size={36} color="#c8e6c9" />
                                <Text style={styles.emptyTableText}>No transactions recorded yet</Text>
                                <Text style={{ color: '#81c784', fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                                    Payments will appear here after admin approves them
                                </Text>
                            </View>
                        ) : (
                            <View style={[styles.table, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                {/* Table Header */}
                                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                                    <Text style={[styles.tableCell, styles.thCell, { width: 34 }]}>S.No</Text>
                                    <Text style={[styles.tableCell, styles.thCell, { flex: 1.2 }]}>Date</Text>
                                    <Text style={[styles.tableCell, styles.thCell, { width: 60 }]}>Time</Text>
                                    <Text style={[styles.tableCell, styles.thCell, { width: 70 }]}>Amount</Text>
                                    <Text style={[styles.tableCell, styles.thCell, { width: 60 }]}>Grams</Text>
                                    <Text style={[styles.tableCell, styles.thCell, { width: 38 }]}>Month</Text>
                                </View>

                                {/* Table Rows */}
                                {tableRows.map((row, i) => (
                                    <View key={i} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
                                        <Text style={[styles.tableCell, { width: 34 }]}>{row.sno}</Text>
                                        <Text style={[styles.tableCell, { flex: 1.2, fontSize: 11 }]}>{row.date}</Text>
                                        <Text style={[styles.tableCell, { width: 60, fontSize: 10 }]}>{row.time}</Text>
                                        <Text style={[styles.tableCell, { width: 70, color: '#2e7d32', fontWeight: '700' }]}>
                                            ₹{(row.amountPaid || 0).toLocaleString('en-IN')}
                                        </Text>
                                        <Text style={[styles.tableCell, { width: 60, color: row.metalType === 'gold' ? '#b8860b' : '#607d8b', fontWeight: '600' }]}>
                                            {row.grams ? row.grams.toFixed(4) + 'g' : '—'}
                                        </Text>
                                        <Text style={[styles.tableCell, { width: 38, fontWeight: '600' }]}>
                                            {row.monthName}
                                        </Text>
                                    </View>
                                ))}

                                {/* Total Row */}
                                <View style={styles.totalRow}>
                                    <Text style={[styles.tableCell, { width: 34 }]}></Text>
                                    <Text style={[styles.tableCell, styles.totalLabel, { flex: 1.2 }]}>TOTAL</Text>
                                    <Text style={[styles.tableCell, { width: 60 }]}></Text>
                                    <Text style={[styles.tableCell, styles.totalAmtCell, { width: 70 }]}>
                                        ₹{totals.totalAmount.toLocaleString('en-IN')}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.totalGramsCell, { width: 60 }]}>
                                        {totals.totalGrams > 0 ? totals.totalGrams.toFixed(4) + 'g' : '—'}
                                    </Text>
                                    <Text style={[styles.tableCell, { width: 38 }]}></Text>
                                </View>
                            </View>
                        )}

                        {/* Metal Breakdown */}
                        {tableRows.length > 0 && (
                            <View style={[styles.breakdownCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                <Text style={styles.breakdownTitle}>💰 Summary</Text>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Months Paid</Text>
                                    <Text style={styles.summaryValue}>{tableRows.length} of {selectedPlan?.totalMonths}</Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Total Amount Paid</Text>
                                    <Text style={[styles.summaryValue, { color: '#2e7d32' }]}>₹{totals.totalAmount.toLocaleString('en-IN')}</Text>
                                </View>
                                {totals.totalGrams > 0 && (
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>
                                            {selectedPlan?.metalType === 'gold' ? 'Gold' : 'Silver'} Purchased
                                        </Text>
                                        <Text style={[styles.summaryValue, { color: '#b8860b' }]}>
                                            {totals.totalGrams.toFixed(4)}g
                                        </Text>
                                    </View>
                                )}
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Remaining</Text>
                                    <Text style={styles.summaryValue}>
                                        ₹{((selectedPlan?.totalMonths - (selectedPlan?.paidMonths || 0)) * selectedPlan?.monthlyAmount).toLocaleString('en-IN')}
                                    </Text>
                                </View>
                            </View>
                        )}

                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f8e9' },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 50, paddingBottom: 14, paddingHorizontal: 20,
        backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#e8f5e9',
    },
    backBtn: { width: 36, height: 36, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32' },
    headerSub: { fontSize: 11, color: '#81c784', fontWeight: '600' },

    // Search
    searchRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFFFFF', margin: 16, borderRadius: 14,
        borderWidth: 1, borderColor: '#e8f5e9', paddingHorizontal: 14, paddingVertical: 10,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    searchInput: { flex: 1, color: '#1b3223', fontSize: 14, fontWeight: '500' },

    scroll: { paddingHorizontal: 16, paddingBottom: 16 },

    // Empty
    emptyState: { paddingTop: 60, alignItems: 'center', paddingHorizontal: 30 },
    emptyTitle: { color: '#1b3223', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    emptySub: { color: '#81c784', fontSize: 13, textAlign: 'center', lineHeight: 20 },

    // Plan cards
    planCard: {
        backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginBottom: 14,
        borderWidth: 1, borderColor: '#e8f5e9',
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
    },
    planCardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    planName: { color: '#1b3223', fontSize: 15, fontWeight: 'bold', marginBottom: 3 },
    planMeta: { color: '#81c784', fontSize: 12, fontWeight: '600' },
    statusPill: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
    statusPillText: { fontSize: 11, fontWeight: 'bold' },

    progressSection: { marginBottom: 12 },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    progressLabel: { color: '#81c784', fontSize: 11, fontWeight: 'bold' },
    progressBg: { height: 6, backgroundColor: '#e8f5e9', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },

    statsRow: {
        flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f1f8e9',
        paddingTop: 12, marginBottom: 10,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statVal: { color: '#1b3223', fontSize: 13, fontWeight: 'bold' },
    statLabel: { color: '#81c784', fontSize: 10, fontWeight: '600', marginTop: 2 },
    statDivider: { width: 1, backgroundColor: '#e8f5e9' },

    tapHint: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 5, marginTop: 4,
    },
    tapHintText: { color: '#81c784', fontSize: 11, fontWeight: '600', flex: 1, textAlign: 'center' },

    // Modal
    modalContainer: { flex: 1, backgroundColor: '#f1f8e9' },
    modalHeader: {
        flexDirection: 'row', alignItems: 'center',
        paddingTop: 50, paddingBottom: 14, paddingHorizontal: 20,
        backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#e8f5e9',
    },
    modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#2e7d32' },
    modalSub: { fontSize: 11, color: '#81c784', fontWeight: '600' },
    modalScroll: { padding: 16 },

    // Summary Card
    summaryCard: {
        backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 16,
        borderWidth: 1, borderColor: '#e8f5e9',
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    summaryRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f8e9',
    },
    summaryLabel: { color: '#81c784', fontSize: 13, fontWeight: '600' },
    summaryValue: { color: '#1b3223', fontSize: 13, fontWeight: 'bold' },

    // Table
    tableTitle: { color: '#2e7d32', fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
    table: {
        backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden',
        borderWidth: 1, borderColor: '#e8f5e9', marginBottom: 16,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    tableRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 9, paddingHorizontal: 8,
        borderBottomWidth: 1, borderBottomColor: '#f1f8e9',
    },
    tableRowAlt: { backgroundColor: '#fafffe' },
    tableHeaderRow: { backgroundColor: '#e8f5e9' },
    tableCell: { color: '#1b3223', fontSize: 12, fontWeight: '500', textAlign: 'center' },
    thCell: { color: '#2e7d32', fontWeight: 'bold', fontSize: 11 },
    totalRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 11, paddingHorizontal: 8,
        backgroundColor: '#e8f5e9', borderTopWidth: 2, borderTopColor: '#c8e6c9',
    },
    totalLabel: { color: '#2e7d32', fontWeight: 'bold', fontSize: 12 },
    totalAmtCell: { color: '#2e7d32', fontWeight: 'bold', fontSize: 13 },
    totalGramsCell: { color: '#b8860b', fontWeight: 'bold', fontSize: 12 },

    // Breakdown
    emptyTable: { alignItems: 'center', padding: 32, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#e8f5e9', marginBottom: 16 },
    emptyTableText: { color: '#81c784', marginTop: 10, fontSize: 14, fontWeight: '600' },
    breakdownCard: {
        backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 16,
        borderWidth: 1, borderColor: '#e8f5e9',
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    breakdownTitle: { color: '#1b3223', fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
});
