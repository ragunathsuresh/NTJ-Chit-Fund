import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Linking,
    ActivityIndicator
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import marketService from '../services/marketService';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import api from '../services/api';
import { sendOrderNotification } from '../services/notificationService';
import upiConfigService from '../services/upiConfigService';

const BuyMetalScreen = ({ navigation, route }) => {
    const { user } = useAuth();
    const [step, setStep] = useState(1); // 1: Input, 2: Payment
    const [metalType, setMetalType] = useState('gold'); // 'gold' or 'silver'
    const [amount, setAmount] = useState('');
    const [grams, setGrams] = useState('0.0000');
    const [transactionId, setTransactionId] = useState('');
    const [loading, setLoading] = useState(false);
    const [rates, setRates] = useState(null);
    const [showQr, setShowQr] = useState(false);
    // Active UPI config fetched from backend (set by admin)
    const [upiConfig, setUpiConfig] = useState(null);
    const [upiLoading, setUpiLoading] = useState(true);

    // Fetch Rates + Active UPI Config on mount
    useEffect(() => {
        loadRates();
        loadUpiConfig();
    }, []);

    // Set metal type and preset amount from route params
    useEffect(() => {
        if (route?.params?.selectedMetal) {
            setMetalType(route.params.selectedMetal);
        }
        if (route?.params?.presetAmount) {
            setAmount(route.params.presetAmount);
        }
    }, [route?.params?.selectedMetal, route?.params?.presetAmount]);

    const loadRates = async () => {
        try {
            const data = await marketService.getRates();
            if (data.success) {
                setRates(data.data);
            }
        } catch (error) {
            console.error('Error fetching rates', error);
        }
    };

    const loadUpiConfig = async () => {
        setUpiLoading(true);
        try {
            const config = await upiConfigService.getActiveUpiConfig();
            setUpiConfig(config);
        } catch (error) {
            console.warn('Could not load UPI config:', error);
        } finally {
            setUpiLoading(false);
        }
    };

    // Calculate Grams when Amount changes
    useEffect(() => {
        if (!rates || !amount) {
            setGrams('0.0000');
            return;
        }

        const rate = metalType === 'gold' ? rates.gold.sellPrice : rates.silver.sellPrice;
        // Logic: Amount (Enter) = Value + GST? Or Amount = Value?
        // Usually User enters "Amount to Spend". 
        // Let's assume Amount entered is FINAL PAYABLE AMOUNT including GST?
        // Or Amount is Ex-GST?
        // User Request: "total amount + gst and finally proceed to pay".
        // So User enters Base Amount?
        // Let's assume User enters Amount (Base) -> We add GST.

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount)) return;

        const calculatedGrams = numericAmount / rate;
        setGrams(calculatedGrams.toFixed(4));

    }, [amount, metalType, rates]);

    const currentRate = rates ? (metalType === 'gold' ? rates.gold?.sellPrice : rates.silver?.sellPrice) : 0;
    const gstRate = 0.03; // 3%
    const baseAmount = parseFloat(amount) || 0;
    const gstAmount = baseAmount * gstRate;
    const totalPayable = baseAmount + gstAmount;

    // UPI priority: 1) Active config from upi_configs (admin-set), 2) Plan-specific UPI, 3) Hardcoded fallback
    const adminUpiId = upiConfig?.upiId
        || route?.params?.adminUpiId
        || "ragusuresh291-2@oksbi";
    const adminName = upiConfig?.label || "NTJ Jewellery";
    const chitFundMonth = route?.params?.chitFundMonth || null;
    const chitFundTotalMonths = route?.params?.chitFundTotalMonths || null;
    const isChitFundPayment = !!route?.params?.chitFundPlanId;

    const handleUpiApp = () => {
        if (!adminUpiId) {
            Alert.alert(
                'UPI Not Configured',
                'The admin has not set up a UPI payment account yet. Please contact support.',
            );
            return;
        }
        const note = isChitFundPayment
            ? `ChitFund-Month${chitFundMonth}of${chitFundTotalMonths}`
            : `Order-${Date.now()}`;
        const upiUrl = `upi://pay?pa=${adminUpiId}&pn=${encodeURIComponent(adminName)}&am=${totalPayable.toFixed(2)}&tn=${encodeURIComponent(note)}&cu=INR`;
        Linking.openURL(upiUrl).catch(() => {
            Alert.alert("No UPI App", `Please pay manually to: ${adminUpiId}\n\nAmount: ₹${totalPayable.toFixed(2)}`);
        });
    };

    const handleNext = () => {
        if (!amount || parseFloat(amount) <= 0) {
            Alert.alert("Invalid Amount", "Please enter a valid amount.");
            return;
        }
        setStep(2);
    };

    const handleSubmitOrder = async () => {
        if (!transactionId) {
            Alert.alert("Required", "Please enter the Transaction ID / UTR Number.");
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/orders/manual', {
                userId: user._id,
                metalType,
                amountPaid: totalPayable,
                gramsCredited: parseFloat(grams),
                ratePerGram: currentRate,
                transactionId: transactionId,
                status: 'Pending',
                // Pass chit fund linkage if applicable
                chitFundPlanId: route?.params?.chitFundPlanId || null,
                chitFundMonth: route?.params?.chitFundMonth || null,
            });

            Alert.alert("Order Submitted", "Order placed successfully! Waiting for admin verification.", [
                {
                    text: "OK",
                    onPress: () => {
                        navigation.navigate('Main', { screen: 'Home' });
                    }
                }
            ]);

            await sendOrderNotification('payment_submitted', {
                month: chitFundMonth || 'N/A',
                amount: totalPayable.toFixed(0),
                upiRef: transactionId,
            });
        } catch (error) {
            const errData = error?.response?.data || error;
            // Special handling for duplicate month payment
            if (errData?.alreadyPaid) {
                Alert.alert(
                    "⚠️ Already Paid",
                    errData.message || "You have already made a payment for this month.",
                    [{ text: "OK" }]
                );
            } else {
                Alert.alert("Error", errData?.message || "Order creation failed. Check your connection.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => step === 1 ? navigation.goBack() : setStep(1)}>
                        <Ionicons name="arrow-back" size={24} color="#2e7d32" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {isChitFundPayment ? `Chit Fund — Month ${chitFundMonth}` : 'Buy Metal'}
                    </Text>
                    <Ionicons name="notifications-outline" size={24} color="#2e7d32" />
                </View>

                {/* Chit Fund Info Banner */}
                {isChitFundPayment && (
                    <View style={styles.chitFundBanner}>
                        <Ionicons name="information-circle" size={16} color="#3b82f6" />
                        <Text style={styles.chitFundBannerText}>
                            Chit Fund monthly payment — Month {chitFundMonth} of {chitFundTotalMonths}. Amount pre-filled from your plan.
                        </Text>
                    </View>
                )}

                {/* Metal Selector — hidden for Chit Fund payments (metal is fixed by the plan) */}
                {!isChitFundPayment && (
                    <View style={styles.selectorContainer}>
                        <TouchableOpacity
                            style={[styles.selectorButton, metalType === 'gold' && styles.selectedGold]}
                            onPress={() => setMetalType('gold')}
                            disabled={step === 2}
                        >
                            <Text style={[styles.selectorText, metalType === 'gold' && styles.selectedText]}>Gold</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.selectorButton, metalType === 'silver' && styles.selectedSilver]}
                            onPress={() => setMetalType('silver')}
                            disabled={step === 2}
                        >
                            <Text style={[styles.selectorText, metalType === 'silver' && styles.selectedText]}>Silver</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Live Rate Display */}
                <View style={styles.liveRateContainer}>
                    <Text style={styles.liveRateLabel}>LIVE {metalType.toUpperCase()} RATE</Text>
                    <Text style={styles.liveRateValue}>₹ {currentRate?.toLocaleString('en-IN')}<Text style={styles.perGm}> / gm</Text></Text>
                </View>

                {step === 1 ? (
                    <>
                        {/* Billing Details */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>BILLING DETAILS</Text>
                            </View>
                            <View style={styles.userDetails}>
                                <View style={styles.userIcon}>
                                    <Ionicons name="person" size={20} color="#2e7d32" />
                                </View>
                                <View>
                                    <Text style={styles.userName}>{user?.name}</Text>
                                    <Text style={styles.userPhone}>{user?.phone}</Text>
                                    <Text style={styles.userEmail}>{user?.email}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Amount Input */}
                        <Text style={styles.inputLabel}>Enter Amount (₹)</Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.currencySymbol}>₹</Text>
                            <TextInput
                                style={styles.amountInput}
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor="#666"
                            />
                        </View>

                        {/* Quick Amounts */}
                        <View style={styles.quickAmountContainer}>
                            {[1000, 5000, 10000].map(amt => (
                                <TouchableOpacity key={amt} style={styles.quickChip} onPress={() => setAmount(amt.toString())}>
                                    <Text style={styles.quickChipText}>+ ₹{amt.toLocaleString()}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Calculation Summary */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Equivalent Weight</Text>
                                <Text style={styles.summaryValue}>{grams} g</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Total Amount</Text>
                                <Text style={styles.summaryValue}>₹ {baseAmount.toFixed(2)}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>GST (3%)</Text>
                                <Text style={styles.summaryValue}>₹ {gstAmount.toFixed(2)}</Text>
                            </View>
                            <View style={[styles.summaryRow, { marginTop: 10 }]}>
                                <Text style={styles.totalLabel}>Payable Amount</Text>
                                <Text style={styles.totalValue}>₹ {totalPayable.toFixed(2)}</Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.proceedButton} onPress={handleNext}>
                            <Text style={styles.proceedText}>Proceed to Payment</Text>
                            <Ionicons name="arrow-forward" size={20} color="#000" />
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        {/* Payment Step */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>PAYMENT OPTIONS</Text>
                            <Text style={styles.payableText}>Amount: ₹ {totalPayable.toFixed(2)}</Text>

                            {/* UPI Config display — shows loading or the active UPI */}
                            {upiLoading ? (
                                <View style={styles.upiLoadingRow}>
                                    <ActivityIndicator size="small" color="#2e7d32" />
                                    <Text style={styles.upiLoadingText}>Fetching payment details...</Text>
                                </View>
                            ) : upiConfig ? (
                                <View style={styles.upiInfoCard}>
                                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.upiInfoName}>{upiConfig.label || 'NTJ Jewellery'}</Text>
                                        <Text style={styles.upiIdText}>UPI: {upiConfig.upiId}</Text>
                                        {upiConfig.department ? (
                                            <Text style={styles.upiInfoBank}>{upiConfig.department.charAt(0).toUpperCase() + upiConfig.department.slice(1)} Department</Text>
                                        ) : null}
                                    </View>
                                    <View style={styles.upiActiveBadge}>
                                        <Text style={styles.upiActiveBadgeText}>ACTIVE</Text>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.upiWarningCard}>
                                    <Ionicons name="warning-outline" size={16} color="#f59e0b" />
                                    <Text style={styles.upiWarningText}>
                                        No UPI configured by admin.{"\n"}Contact support before paying.
                                    </Text>
                                </View>
                            )}

                            <View style={styles.dividerContainer}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>QUICK PAY</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <TouchableOpacity
                                style={styles.payUpiButton}
                                onPress={handleUpiApp}
                            >
                                <View style={styles.payUpiIconContainer}>
                                    <Ionicons name="apps" size={24} color="#000" />
                                </View>
                                <Text style={styles.payUpiText}>Pay via UPI App</Text>
                                <Ionicons name="chevron-forward" size={20} color="#000" />
                            </TouchableOpacity>

                            <View style={styles.dividerContainer}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>OR SCAN QR</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <TouchableOpacity
                                style={styles.showQrButton}
                                onPress={() => setShowQr(!showQr)}
                            >
                                <Ionicons name={showQr ? "qr-code-outline" : "qr-code"} size={20} color="#2e7d32" />
                                <Text style={styles.showQrText}>{showQr ? "Hide QR Code" : "Show QR Code"}</Text>
                                <Ionicons name={showQr ? "chevron-up" : "chevron-down"} size={20} color="#2e7d32" />
                            </TouchableOpacity>

                            {showQr && (
                                <View style={styles.qrContainer}>
                                    <QRCode
                                        value={`upi://pay?pa=${adminUpiId}&pn=${adminName}&am=${totalPayable}&tn=Order-${Date.now()}`}
                                        size={200}
                                        color="black"
                                        backgroundColor="white"
                                    />
                                    <Text style={styles.scanText}>Scan with any UPI App</Text>
                                </View>
                            )}
                        </View>


                        <Text style={styles.inputLabel}>Enter Transaction ID / UTR</Text>
                        <TextInput
                            style={styles.textInput}
                            value={transactionId}
                            onChangeText={setTransactionId}
                            placeholder="e.g. 123456789012"
                            placeholderTextColor="#666"
                        />

                        <TouchableOpacity
                            style={styles.proceedButton}
                            onPress={handleSubmitOrder}
                            disabled={loading}
                        >
                            <Text style={styles.proceedText}>{loading ? "Verifying..." : "Submit Transaction"}</Text>
                        </TouchableOpacity>
                        <Text style={styles.noteText}>Admin will verify the transaction and credit grams to your wallet.</Text>
                    </>
                )}

                <View style={{ height: 50 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f8e9' },
    scrollContent: { padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, marginBottom: 16 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1b3223', flex: 1, textAlign: 'center' },
    chitFundBanner: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        backgroundColor: '#e3f2fd', borderRadius: 12, padding: 12,
        borderWidth: 1, borderColor: '#bbdefb', marginBottom: 16,
    },
    chitFundBannerText: { flex: 1, color: '#1976d2', fontSize: 13, lineHeight: 18, fontWeight: '600' },
    selectorContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 30, marginBottom: 30, padding: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    selectorButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 25 },
    selectedGold: { backgroundColor: '#2e7d32' },
    selectedSilver: { backgroundColor: '#81c784' },
    selectorText: { color: '#888', fontWeight: 'bold' },
    selectedText: { color: '#FFF' },
    liveRateContainer: { alignItems: 'center', marginBottom: 30 },
    liveRateLabel: { color: '#4caf50', fontSize: 12, letterSpacing: 1, marginBottom: 5, fontWeight: 'bold' },
    liveRateValue: { color: '#1b3223', fontSize: 32, fontWeight: 'bold' },
    perGm: { fontSize: 16, color: '#81c784' },
    card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#e8f5e9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    cardTitle: { color: '#4caf50', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
    userDetails: { flexDirection: 'row', alignItems: 'center' },
    userIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f8e9', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    userName: { color: '#1b3223', fontSize: 16, fontWeight: 'bold' },
    userPhone: { color: '#4caf50', fontSize: 14, fontWeight: '600' },
    userEmail: { color: '#81c784', fontSize: 12 },
    inputLabel: { color: '#1b3223', marginBottom: 10, fontSize: 14, fontWeight: 'bold' },
    inputContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 15, alignItems: 'center', borderColor: '#e0e0e0', borderWidth: 1, height: 64, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    currencySymbol: { fontSize: 24, color: '#2e7d32', marginRight: 10, fontWeight: 'bold' },
    amountInput: { flex: 1, color: '#1b3223', fontSize: 24, fontWeight: 'bold' },
    quickAmountContainer: { flexDirection: 'row', gap: 10, marginBottom: 25 },
    quickChip: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#e8f5e9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
    quickChipText: { color: '#2e7d32', fontSize: 13, fontWeight: 'bold' },
    summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 30, borderWidth: 1, borderColor: '#e8f5e9' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    summaryLabel: { color: '#888', fontSize: 14, fontWeight: '500' },
    summaryValue: { color: '#1b3223', fontSize: 14, fontWeight: 'bold' },
    divider: { height: 1, backgroundColor: '#f0f4f1', marginVertical: 12 },
    totalLabel: { color: '#1b3223', fontSize: 16, fontWeight: 'bold' },
    totalValue: { color: '#2e7d32', fontSize: 20, fontWeight: 'bold' },
    proceedButton: { backgroundColor: '#2e7d32', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 18, borderRadius: 14, shadowColor: '#2e7d32', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    proceedText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginRight: 10 },
    qrContainer: { alignItems: 'center', marginVertical: 20, backgroundColor: '#FFF', padding: 20, borderRadius: 16, alignSelf: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    upiIdText: { color: '#1b3223', textAlign: 'center', marginTop: 15, fontSize: 16, fontWeight: 'bold' },
    payableText: { color: '#2e7d32', textAlign: 'center', fontSize: 24, fontWeight: 'bold', marginTop: 5 },
    textInput: { backgroundColor: '#FFFFFF', color: '#1b3223', padding: 18, borderRadius: 14, fontSize: 16, borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    noteText: { color: '#81c784', textAlign: 'center', marginTop: 20, fontSize: 12, fontWeight: '600' },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#e8f5e9' },
    dividerText: { color: '#81c784', paddingHorizontal: 10, fontSize: 12, fontWeight: 'bold' },
    payUpiButton: { backgroundColor: '#f1f8e9', flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e8f5e9' },
    payUpiIconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    payUpiText: { flex: 1, color: '#1b3223', fontSize: 16, fontWeight: 'bold' },
    showQrButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderWidth: 1.5, borderColor: '#2e7d32', borderRadius: 14, marginBottom: 12, gap: 8 },
    showQrText: { color: '#2e7d32', fontSize: 14, fontWeight: 'bold' },
    scanText: { color: '#1b3223', marginTop: 10, fontSize: 13, fontWeight: 'bold' },

    // UPI Config display styles
    upiLoadingRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#f9fbf9', borderRadius: 10, padding: 12,
        marginTop: 10, marginBottom: 4,
    },
    upiLoadingText: { color: '#81c784', fontSize: 13, fontWeight: '600' },
    upiInfoCard: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#f0fdf4', borderRadius: 12, padding: 14,
        marginTop: 10, marginBottom: 4,
        borderWidth: 1, borderColor: '#86efac',
    },
    upiInfoName: { color: '#1b3223', fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
    upiInfoBank: { color: '#81c784', fontSize: 11, marginTop: 2, fontWeight: '600' },
    upiActiveBadge: {
        backgroundColor: '#10b981', borderRadius: 6,
        paddingHorizontal: 8, paddingVertical: 3,
    },
    upiActiveBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },
    upiWarningCard: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        backgroundColor: '#fffbeb', borderRadius: 12, padding: 14,
        marginTop: 10, marginBottom: 4,
        borderWidth: 1, borderColor: '#fcd34d',
    },
    upiWarningText: { color: '#92400e', fontSize: 12, fontWeight: '600', flex: 1, lineHeight: 18 },
});

export default BuyMetalScreen;
