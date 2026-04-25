import React, { useState, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView,
    Platform, RefreshControl, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import chitFundService from '../services/chitFundService';
import { useFocusEffect } from '@react-navigation/native';
import { sendOrderNotification } from '../services/notificationService';
import { useTheme } from '../context/ThemeContext';

const MONTHS_OPTIONS = [3, 6, 12, 18, 24, 36];

const STATUS_CONFIG = {
    pending:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: 'time-outline',         label: 'Pending Review' },
    approved:  { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  icon: 'checkmark-circle',     label: 'Approved' },
    rejected:  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: 'close-circle',         label: 'Rejected' },
    active:    { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  icon: 'flash',                label: 'Active' },
    completed: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', icon: 'checkmark-done-circle', label: 'Completed' },
};

export default function ChitFundRequestScreen({ navigation }) {
    const { colors } = useTheme();
    const { user } = useAuth();

    // Tab state
    const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'new'

    // My Requests state
    const [myPlans, setMyPlans] = useState([]);
    const [isLoadingPlans, setIsLoadingPlans] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [expandedPlan, setExpandedPlan] = useState(null);

    // New Request form state
    const [metalType, setMetalType] = useState('gold');
    const [requestName, setRequestName] = useState('');
    const [monthlyAmount, setMonthlyAmount] = useState('');
    const [totalMonths, setTotalMonths] = useState(12);
    const [customMonths, setCustomMonths] = useState('');
    const [userNote, setUserNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const totalAmount = monthlyAmount ? Number(monthlyAmount) * totalMonths : 0;

    // Load plans whenever screen is focused
    useFocusEffect(
        useCallback(() => {
            loadMyPlans();
        }, [])
    );

    const loadMyPlans = async (showLoader = true) => {
        if (showLoader) setIsLoadingPlans(true);
        try {
            const result = await chitFundService.getMyPlans();
            if (result.success) {
                // Sort: active/approved first, then by newest createdAt
                const sorted = [...result.data].sort((a, b) => {
                    const priorityOrder = { active: 0, approved: 1, pending: 2, completed: 3, rejected: 4 };
                    const aPriority = priorityOrder[a.status] ?? 5;
                    const bPriority = priorityOrder[b.status] ?? 5;
                    if (aPriority !== bPriority) return aPriority - bPriority;
                    return new Date(b.createdAt) - new Date(a.createdAt); // newest first within same status
                });
                setMyPlans(sorted);
            }
        } catch (error) {
            console.error('Load plans error:', error);
        } finally {
            setIsLoadingPlans(false);
            setIsRefreshing(false);
        }
    };

    const onRefresh = () => {
        setIsRefreshing(true);
        loadMyPlans(false);
    };

    const handleSubmit = async () => {
        if (!requestName.trim()) {
            Alert.alert('Request Name Required', 'Please enter a name for this chit fund request.');
            return;
        }
        if (!monthlyAmount || Number(monthlyAmount) < 100) {
            Alert.alert('Invalid Amount', 'Please enter a monthly amount of at least ₹100.');
            return;
        }
        if (!totalMonths || !Number.isInteger(Number(totalMonths)) || Number(totalMonths) < 1) {
            Alert.alert('Invalid Duration', 'Please enter a valid duration of at least 1 month.');
            return;
        }
        Alert.alert(
            'Confirm Request',
            `${metalType === 'gold' ? '🪙 Gold' : '⚪ Silver'} Chit Fund\n\n• Monthly: ₹${Number(monthlyAmount).toLocaleString('en-IN')}\n• Duration: ${totalMonths} months\n• Total: ₹${totalAmount.toLocaleString('en-IN')}\n\nSubmit for admin review?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Submit', onPress: doSubmit }
            ]
        );
    };

    const doSubmit = async () => {
        setIsSubmitting(true);
        try {
            const result = await chitFundService.submitRequest({
                metalType,
                requestName: requestName.trim(),
                monthlyAmount: Number(monthlyAmount),
                totalMonths,
                userNote
            });
            if (result.success) {
                // Reset form
                setMetalType('gold');
                setRequestName('');
                setMonthlyAmount('');
                setTotalMonths(12);
                setCustomMonths('');
                setUserNote('');
                setShowSuccessModal(true);
                // Send notification
                await sendOrderNotification('request_submitted', {
                    metalType,
                    amount: monthlyAmount,
                });
                // Reload list
                await loadMyPlans(false);
            } else {
                Alert.alert('Error', result.message || 'Failed to submit request.');
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to submit. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // ─── Summary counts ───────────────────────────────────────
    const counts = myPlans.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
    }, {});

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.cardBackground }]}
        >
            {/* ── Header ────────────────────────────────────── */}
            <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#2e7d32" />
                </TouchableOpacity>
                <View>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Chit Fund</Text>
                    <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{myPlans.length} request{myPlans.length !== 1 ? 's' : ''} submitted</Text>
                </View>
                <TouchableOpacity onPress={() => { setActiveTab('new'); }} style={styles.newBtn}>
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                    <Text style={styles.newBtnText}>New</Text>
                </TouchableOpacity>
            </View>

            {/* ── Tabs ──────────────────────────────────────── */}
            <View style={[styles.tabBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
                    onPress={() => setActiveTab('requests')}
                >
                    <Ionicons name="list" size={16} color={activeTab === 'requests' ? '#2e7d32' : colors.textSecondary} />
                    <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'requests' && styles.tabTextActive]}>
                        My Requests
                    </Text>
                    {myPlans.length > 0 && (
                        <View style={styles.tabBadge}>
                            <Text style={styles.tabBadgeText}>{myPlans.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'new' && styles.tabActive]}
                    onPress={() => setActiveTab('new')}
                >
                    <Ionicons name="paper-plane" size={16} color={activeTab === 'new' ? '#2e7d32' : colors.textSecondary} />
                    <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'new' && styles.tabTextActive]}>
                        New Request
                    </Text>
                </TouchableOpacity>
            </View>

            {/* ════════════════════════════════════════════════
                TAB 1 — MY REQUESTS
            ════════════════════════════════════════════════ */}
            {activeTab === 'requests' && (
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#FFD700" />
                    }
                >
                    {/* Summary Row */}
                    {myPlans.length > 0 && (
                        <View style={styles.summaryStrip}>
                            {Object.entries(counts).map(([status, count]) => {
                                const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
                                return (
                                    <View key={status} style={[styles.summaryChip, { backgroundColor: cfg.bg }]}>
                                        <Text style={[styles.summaryChipCount, { color: cfg.color }]}>{count}</Text>
                                        <Text style={[styles.summaryChipLabel, { color: cfg.color }]}>{cfg.label}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* Loading */}
                    {isLoadingPlans ? (
                        <View style={styles.loadingBox}>
                            <ActivityIndicator size="large" color="#FFD700" />
                            <Text style={styles.loadingText}>Loading your requests...</Text>
                        </View>
                    ) : myPlans.length === 0 ? (
                        /* Empty state */
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyEmoji}>📋</Text>
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Requests Yet</Text>
                            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                                Submit your first chit fund request and start your gold saving journey.
                            </Text>
                            <TouchableOpacity style={styles.emptyBtn} onPress={() => setActiveTab('new')}>
                                <Ionicons name="paper-plane" size={16} color="#000" />
                                <Text style={styles.emptyBtnText}>Submit First Request</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        /* Request Cards */
                        myPlans.map((plan, idx) => {
                            const cfg = STATUS_CONFIG[plan.status] || STATUS_CONFIG.pending;
                            const isExpanded = expandedPlan === plan._id;
                            const paidAmt = (plan.paidMonths || 0) * plan.monthlyAmount;
                            const progressPct = plan.totalMonths ? ((plan.paidMonths || 0) / plan.totalMonths) * 100 : 0;

                            return (
                                <TouchableOpacity
                                    key={plan._id}
                                    style={[styles.planCard, { borderLeftColor: cfg.color, backgroundColor: colors.background, borderColor: colors.border }]}
                                    onPress={() => setExpandedPlan(isExpanded ? null : plan._id)}
                                    activeOpacity={0.85}
                                >
                                    {/* Card Header */}
                                    <View style={styles.cardHeader}>
                                        <View style={styles.cardLeft}>
                                            <Text style={styles.cardMetal}>
                                                {plan.metalType === 'gold' ? '🪙 Gold' : '⚪ Silver'} Chit Fund
                                            </Text>
                                            {plan.requestName ? (
                                                <Text style={styles.cardRequestName}>📝 {plan.requestName}</Text>
                                            ) : null}
                                            <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
                                                Submitted: {formatDate(plan.createdAt)}
                                            </Text>
                                        </View>
                                        <View style={styles.cardRight}>
                                            <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                                                <Ionicons name={cfg.icon} size={12} color={cfg.color} />
                                                <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                                            </View>
                                            <Ionicons
                                                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                                size={18} color="#555" style={{ marginTop: 6 }}
                                            />
                                        </View>
                                    </View>

                                    {/* Key Stats Row */}
                                    <View style={styles.cardStats}>
                                        <View style={styles.cardStat}>
                                            <Text style={styles.cardStatVal}>₹{plan.monthlyAmount?.toLocaleString('en-IN')}</Text>
                                            <Text style={styles.cardStatLabel}>/ month</Text>
                                        </View>
                                        <View style={styles.cardStatDiv} />
                                        <View style={styles.cardStat}>
                                            <Text style={styles.cardStatVal}>{plan.totalMonths}</Text>
                                            <Text style={styles.cardStatLabel}>months</Text>
                                        </View>
                                        <View style={styles.cardStatDiv} />
                                        <View style={styles.cardStat}>
                                            <Text style={styles.cardStatVal}>₹{plan.totalAmount?.toLocaleString('en-IN')}</Text>
                                            <Text style={styles.cardStatLabel}>total</Text>
                                        </View>
                                    </View>

                                    {/* Progress bar for active/completed */}
                                    {['active', 'approved', 'completed'].includes(plan.status) && (
                                        <View style={styles.cardProgress}>
                                            <View style={styles.cardProgressLabels}>
                                                <Text style={styles.cardProgressText}>
                                                    {plan.paidMonths || 0}/{plan.totalMonths} months paid
                                                </Text>
                                                <Text style={[styles.cardProgressText, { color: cfg.color }]}>
                                                    {Math.round(progressPct)}%
                                                </Text>
                                            </View>
                                            <View style={styles.progressBarBg}>
                                                <View style={[styles.progressBarFill, { width: `${progressPct}%`, backgroundColor: cfg.color }]} />
                                            </View>
                                        </View>
                                    )}

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <View style={styles.expandedSection}>
                                            <View style={styles.divider} />

                                            {plan.userNote ? (
                                                <View style={styles.expandRow}>
                                                    <Text style={styles.expandLabel}>Your Note</Text>
                                                    <Text style={styles.expandValue}>{plan.userNote}</Text>
                                                </View>
                                            ) : null}

                                            {plan.adminNote ? (
                                                <View style={[styles.expandRow, { backgroundColor: 'rgba(239,68,68,0.06)', borderRadius: 8, padding: 8 }]}>
                                                    <Text style={[styles.expandLabel, { color: '#ef4444' }]}>Admin Note</Text>
                                                    <Text style={[styles.expandValue, { color: '#fca5a5' }]}>{plan.adminNote}</Text>
                                                </View>
                                            ) : null}

                                            {plan.approvedAt && (
                                                <View style={styles.expandRow}>
                                                    <Text style={styles.expandLabel}>Approved On</Text>
                                                    <Text style={styles.expandValue}>{formatDate(plan.approvedAt)}</Text>
                                                </View>
                                            )}

                                            {plan.startDate && (
                                                <View style={styles.expandRow}>
                                                    <Text style={styles.expandLabel}>Start Date</Text>
                                                    <Text style={styles.expandValue}>{formatDate(plan.startDate)}</Text>
                                                </View>
                                            )}

                                            {plan.nextDueDate && (
                                                <View style={styles.expandRow}>
                                                    <Text style={styles.expandLabel}>Next Due</Text>
                                                    <Text style={[styles.expandValue, { color: '#f59e0b' }]}>
                                                        {formatDate(plan.nextDueDate)}
                                                    </Text>
                                                </View>
                                            )}

                                            {plan.upiId && (
                                                <View style={styles.expandRow}>
                                                    <Text style={styles.expandLabel}>Admin UPI</Text>
                                                    <Text style={[styles.expandValue, { color: '#4CAF50' }]}>{plan.upiId}</Text>
                                                </View>
                                            )}

                                            {['active', 'approved'].includes(plan.status) && (
                                                <TouchableOpacity
                                                    style={styles.payNowBtn}
                                                    onPress={() => navigation.navigate('ChitFundPay')}
                                                >
                                                    <Ionicons name="phone-portrait" size={15} color="#000" />
                                                    <Text style={styles.payNowText}>Go to Pay Screen</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })
                    )}
                    <View style={{ height: 40 }} />
                </ScrollView>
            )}

            {/* ════════════════════════════════════════════════
                TAB 2 — NEW REQUEST FORM
            ════════════════════════════════════════════════ */}
            {activeTab === 'new' && (
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    {/* User Info Card */}
                    <View style={[styles.userCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.userName}>{user?.name || 'User'}</Text>
                            <Text style={styles.userInfo}>{user?.email}</Text>
                            <Text style={styles.userInfo}>📞 {user?.phone}</Text>
                        </View>
                        <View style={[styles.kycBadge, { backgroundColor: user?.kycStatus === 'verified' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)' }]}>
                            <Text style={{ color: user?.kycStatus === 'verified' ? '#10b981' : '#f59e0b', fontSize: 11, fontWeight: 'bold' }}>
                                {user?.kycStatus === 'verified' ? '✅ KYC' : '⏳ KYC'}
                            </Text>
                        </View>
                    </View>

                    {/* Metal Type */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>1. Metal Type</Text>
                        <View style={styles.metalRow}>
                            <TouchableOpacity
                                style={[styles.metalBtn, metalType === 'gold' && styles.metalBtnGold]}
                                onPress={() => setMetalType('gold')}
                            >
                                <Text style={styles.metalEmoji}>🪙</Text>
                                <Text style={[styles.metalLabel, metalType === 'gold' && { color: '#FFD700' }]}>Gold</Text>
                                <Text style={styles.metalSub}>24K • 99.9%</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.metalBtn, metalType === 'silver' && styles.metalBtnSilver]}
                                onPress={() => setMetalType('silver')}
                            >
                                <Text style={styles.metalEmoji}>⚪</Text>
                                <Text style={[styles.metalLabel, metalType === 'silver' && { color: '#C0C0C0' }]}>Silver</Text>
                                <Text style={styles.metalSub}>Fine • 99.9%</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Request Name */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>2. Request Name <Text style={styles.requiredStar}>*</Text></Text>
                        <TextInput
                            style={[styles.nameInput, { backgroundColor: colors.background, color: colors.text }, !requestName.trim() && styles.nameInputEmpty]}
                            placeholder="e.g. My Gold Savings Plan"
                            placeholderTextColor="#555"
                            value={requestName}
                            onChangeText={setRequestName}
                            maxLength={60}
                        />
                        <Text style={styles.minNote}>This name will be visible to the admin • Required</Text>
                    </View>

                    {/* Monthly Amount */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>3. Monthly Payment Amount</Text>
                        <View style={styles.amountRow}>
                            <View style={styles.rupeeBox}><Text style={styles.rupeeSign}>₹</Text></View>
                            <TextInput
                                style={[styles.amountInput, { backgroundColor: colors.background, color: colors.text }]}
                                placeholder="e.g. 1000"
                                placeholderTextColor="#555"
                                keyboardType="numeric"
                                value={monthlyAmount}
                                onChangeText={setMonthlyAmount}
                            />
                        </View>
                        <Text style={styles.minNote}>Minimum ₹100 per month</Text>
                    </View>

                    {/* Duration */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>4. Duration</Text>
                        <View style={styles.monthsGrid}>
                            {MONTHS_OPTIONS.map(m => (
                                <TouchableOpacity
                                    key={m}
                                    style={[styles.monthChip, totalMonths === m && styles.monthChipActive]}
                                    onPress={() => {
                                        setTotalMonths(m);
                                        setCustomMonths('');
                                    }}
                                >
                                    <Text style={[styles.monthChipNum, totalMonths === m && { color: '#FFD700' }]}>{m}</Text>
                                    <Text style={[styles.monthChipSub, totalMonths === m && { color: '#FFD700' }]}>mo</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TextInput
                            style={[styles.customMonthsInput, { backgroundColor: colors.background, color: colors.text }]}
                            placeholder="Enter custom months "
                            placeholderTextColor="#555"
                            keyboardType="numeric"
                            value={customMonths}
                            onChangeText={(text) => {
                                const cleaned = text.replace(/[^0-9]/g, '');
                                setCustomMonths(cleaned);
                                if (cleaned) {
                                    setTotalMonths(Number(cleaned));
                                }
                            }}
                        />
                        <Text style={styles.minNote}>You can choose a preset or enter any number of months manually</Text>
                    </View>

                    {/* Summary */}
                    {monthlyAmount ? (
                        <View style={[styles.summaryCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <Text style={styles.summaryCardTitle}>📊 Plan Summary</Text>
                            {[
                                ['Metal', metalType === 'gold' ? '🪙 Gold' : '⚪ Silver'],
                                ['Monthly', `₹${Number(monthlyAmount).toLocaleString('en-IN')}`],
                                ['Duration', `${totalMonths} Months`],
                            ].map(([l, v]) => (
                                <View key={l} style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>{l}</Text>
                                    <Text style={styles.summaryValue}>{v}</Text>
                                </View>
                            ))}
                            <View style={[styles.summaryRow, { borderBottomWidth: 0, paddingTop: 12 }]}>
                                <Text style={styles.totalLabel}>Total Commitment</Text>
                                <Text style={styles.totalValue}>₹{totalAmount.toLocaleString('en-IN')}</Text>
                            </View>
                        </View>
                    ) : null}

                    {/* Note */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>5. Note to Admin (Optional)</Text>
                        <TextInput
                            style={[styles.noteInput, { backgroundColor: colors.background, color: colors.text }]}             
                            placeholder="Any specific requirements..."
                            placeholderTextColor="#555"
                            value={userNote}
                            onChangeText={setUserNote}
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    {/* Info box */}
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={18} color="#3b82f6" />
                        <Text style={styles.infoText}>After admin approval, you'll get UPI details and a monthly schedule. You can track progress in My Requests tab.</Text>
                    </View>

                    {/* Submit */}
                    <TouchableOpacity
                        style={[styles.submitBtn, isSubmitting && { opacity: 0.6 }]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                        activeOpacity={0.85}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons name="paper-plane" size={20} color="#FFFFFF" />
                                <Text style={styles.submitText}>Submit Request</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            )}

            {/* ── Success Modal ─────────────────────────────── */}
            <Modal visible={showSuccessModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalEmoji}>🎉</Text>
                        <Text style={styles.modalTitle}>Request Submitted!</Text>
                        <Text style={styles.modalSub}>
                            Your chit fund request has been submitted successfully.{'\n'}
                            You will be notified once the admin reviews it.
                        </Text>
                        <TouchableOpacity
                            style={styles.modalBtn}
                            onPress={() => {
                                setShowSuccessModal(false);
                                setActiveTab('requests');
                            }}
                        >
                            <Text style={styles.modalBtnText}>View My Requests →</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
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
    headerSub: { fontSize: 11, color: '#81c784', marginTop: 1, fontWeight: '600' },
    newBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#2e7d32', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
    },
    newBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },

    // Tabs
    tabBar: {
        flexDirection: 'row', backgroundColor: '#FFFFFF',
        borderBottomWidth: 1, borderBottomColor: '#e8f5e9',
    },
    tab: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 14, borderBottomWidth: 3, borderBottomColor: 'transparent',
    },
    tabActive: { borderBottomColor: '#2e7d32' },
    tabText: { color: '#81c784', fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#2e7d32', fontWeight: 'bold' },
    tabBadge: {
        backgroundColor: '#2e7d32', borderRadius: 10, minWidth: 18, height: 18,
        alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
    },
    tabBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },

    scroll: { padding: 16 },

    // Summary strip
    summaryStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    summaryChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    },
    summaryChipCount: { fontSize: 16, fontWeight: 'bold' },
    summaryChipLabel: { fontSize: 11, fontWeight: '600' },

    // Loading / empty
    loadingBox: { paddingTop: 60, alignItems: 'center' },
    loadingText: { color: '#81c784', marginTop: 12, fontSize: 14, fontWeight: '600' },
    emptyState: { paddingTop: 60, alignItems: 'center', paddingHorizontal: 30 },
    emptyEmoji: { fontSize: 56, marginBottom: 16 },
    emptyTitle: { color: '#1b3223', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
    emptySubtitle: { color: '#81c784', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24, fontWeight: '500' },
    emptyBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#2e7d32', borderRadius: 14, paddingVertical: 13, paddingHorizontal: 24,
    },
    emptyBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },

    // Plan cards
    planCard: {
        backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 12,
        borderWidth: 1, borderColor: '#e8f5e9', borderLeftWidth: 5,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    cardLeft: { flex: 1 },
    cardMetal: { color: '#1b3223', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    cardDate: { color: '#81c784', fontSize: 11, fontWeight: '600' },
    cardRight: { alignItems: 'flex-end' },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    },
    statusText: { fontSize: 11, fontWeight: 'bold' },
    cardStats: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f1f8e9' },
    cardStat: { alignItems: 'center' },
    cardStatVal: { color: '#1b3223', fontSize: 15, fontWeight: 'bold' },
    cardStatLabel: { color: '#81c784', fontSize: 10, marginTop: 1, fontWeight: 'bold' },
    cardStatDiv: { width: 1, backgroundColor: '#f1f8e9' },
    cardProgress: { marginTop: 16 },
    cardProgressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    cardProgressText: { color: '#81c784', fontSize: 11, fontWeight: 'bold' },
    progressBarBg: { height: 8, backgroundColor: '#f1f8e9', borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 4 },
    expandedSection: { marginTop: 16 },
    divider: { height: 1, backgroundColor: '#f1f8e9', marginBottom: 16 },
    expandRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, gap: 10 },
    expandLabel: { color: '#81c784', fontSize: 12, fontWeight: '600' },
    expandValue: { color: '#1b3223', fontSize: 12, fontWeight: 'bold', textAlign: 'right', flex: 1 },
    payNowBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center',
        backgroundColor: '#2e7d32', borderRadius: 12, paddingVertical: 12, marginTop: 12,
    },
    payNowText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },

    // Form styles
    userCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
        borderRadius: 20, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: '#e8f5e9',
        shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 1,
    },
    avatarCircle: {
        width: 48, height: 48, borderRadius: 24, backgroundColor: '#2e7d32',
        alignItems: 'center', justifyContent: 'center', marginRight: 15,
    },
    avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    userName: { color: '#1b3223', fontSize: 16, fontWeight: 'bold' },
    userInfo: { color: '#81c784', fontSize: 12, marginTop: 1, fontWeight: '600' },
    kycBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
    section: { marginBottom: 24 },
    sectionTitle: { color: '#2e7d32', fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 12 },
    metalRow: { flexDirection: 'row', gap: 12 },
    metalBtn: {
        flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
        alignItems: 'center', borderWidth: 2, borderColor: '#f1f8e9',
    },
    metalBtnGold: { borderColor: '#2e7d32', backgroundColor: '#f9fdf9' },
    metalBtnSilver: { borderColor: '#81c784', backgroundColor: '#fdfdfd' },
    metalEmoji: { fontSize: 32, marginBottom: 6 },
    metalLabel: { color: '#81c784', fontSize: 15, fontWeight: 'bold' },
    metalSub: { color: '#a5d6a7', fontSize: 10, marginTop: 4, fontWeight: '600' },
    amountRow: { flexDirection: 'row', alignItems: 'center' },
    rupeeBox: {
        backgroundColor: '#f1f8e9', borderTopLeftRadius: 14, borderBottomLeftRadius: 14,
        paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#e0e0e0', borderRightWidth: 0,
    },
    rupeeSign: { color: '#2e7d32', fontSize: 22, fontWeight: 'bold' },
    amountInput: {
        flex: 1, backgroundColor: '#FFFFFF', borderTopRightRadius: 14, borderBottomRightRadius: 14,
        borderWidth: 1, borderColor: '#e0e0e0', paddingHorizontal: 16, paddingVertical: 14,
        color: '#1b3223', fontSize: 20, fontWeight: 'bold',
    },
    minNote: { color: '#81c784', fontSize: 12, marginTop: 6, fontWeight: '600' },
    monthsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    monthChip: {
        width: 72, height: 56, borderRadius: 14, backgroundColor: '#FFFFFF',
        borderWidth: 2, borderColor: '#f1f8e9', alignItems: 'center', justifyContent: 'center',
    },
    monthChipActive: { borderColor: '#2e7d32', backgroundColor: '#f9fdf9', shadowColor: '#2e7d32', shadowOpacity: 0.1, shadowRadius: 5, elevation: 1 },
    monthChipNum: { color: '#81c784', fontSize: 18, fontWeight: 'bold' },
    monthChipSub: { color: '#a5d6a7', fontSize: 11, fontWeight: 'bold' },
    customMonthsInput: {
        backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#e0e0e0',
        color: '#1b3223', paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontWeight: '600',
        marginTop: 14,
    },
    summaryCard: {
        backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20,
        marginBottom: 24, borderWidth: 1, borderColor: '#e8f5e9',
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
    },
    summaryCardTitle: { color: '#1b3223', fontSize: 14, fontWeight: 'bold', marginBottom: 15 },
    summaryRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f8e9',
    },
    summaryLabel: { color: '#81c784', fontSize: 13, fontWeight: '600' },
    summaryValue: { color: '#1b3223', fontSize: 14, fontWeight: 'bold' },
    totalLabel: { color: '#1b3223', fontSize: 15, fontWeight: 'bold' },
    totalValue: { color: '#2e7d32', fontSize: 20, fontWeight: 'bold' },
    noteInput: {
        backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#e0e0e0',
        color: '#1b3223', padding: 16, fontSize: 14, textAlignVertical: 'top', minHeight: 90,
    },
    nameInput: {
        backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 2, borderColor: '#2e7d32',
        color: '#1b3223', paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontWeight: '600',
    },
    nameInputEmpty: {
        borderColor: '#e0e0e0',
    },
    requiredStar: { color: '#ef4444', fontSize: 14 },
    cardRequestName: { color: '#2e7d32', fontSize: 12, fontWeight: '700', marginTop: 2, marginBottom: 2 },
    infoBox: {
        flexDirection: 'row', backgroundColor: '#e3f2fd', borderRadius: 14,
        borderWidth: 1, borderColor: '#bbdefb', padding: 14, marginBottom: 24, gap: 10,
    },
    infoText: { flex: 1, color: '#1976d2', fontSize: 13, lineHeight: 20, fontWeight: '600' },
    submitBtn: {
        backgroundColor: '#2e7d32', borderRadius: 16, paddingVertical: 18,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        elevation: 6, shadowColor: '#2e7d32', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4, shadowRadius: 10,
    },
    submitText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },

    // Modal
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center', alignItems: 'center', padding: 30,
    },
    modalBox: {
    },
    modalEmoji: { fontSize: 52, marginBottom: 14 },
    modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    modalSub: { color: '#888', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 22 },
    modalBtn: {
        backgroundColor: '#FFD700', borderRadius: 12,
        paddingVertical: 13, paddingHorizontal: 28,
    },
    modalBtnText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
});
