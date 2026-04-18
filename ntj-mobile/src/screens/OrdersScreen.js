import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Modal
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const OrdersScreen = ({ navigation }) => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All'); // 'All', 'Gold', 'Silver', 'Pending', 'Success', 'Failed'
    const [showFilterModal, setShowFilterModal] = useState(false);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await api.get('/orders');
            if (response.data.success) {
                setOrders(response.data.data);
                applyFilters(response.data.data, activeFilter);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [])
    );

    useEffect(() => {
        applyFilters(orders, activeFilter);
    }, [activeFilter, orders]);

    const applyFilters = (data, filter) => {
        let result = data;
        if (filter === 'Gold') result = data.filter(o => o.metalType === 'gold');
        else if (filter === 'Silver') result = data.filter(o => o.metalType === 'silver');
        else if (filter === 'Pending') result = data.filter(o => o.status === 'Pending');
        else if (filter === 'Success') result = data.filter(o => o.status === 'Success');
        else if (filter === 'Failed') result = data.filter(o => o.status === 'Failed');

        setFilteredOrders(result);
    };

    const formatDate = (dateString) => {
        const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const renderOrderItem = ({ item }) => {
        const isGold = item.metalType === 'gold';
        const color = isGold ? '#2e7d32' : '#81c784';
        const statusColor =
            item.status === 'Success' ? '#43a047' :
                item.status === 'Failed' ? '#e53935' : '#fb8c00';

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.iconRow}>
                        <View style={[styles.iconContainer, { backgroundColor: '#333' }]}>
                            <Text style={[styles.iconText, { color }]}>{isGold ? '$' : '●'}</Text>
                        </View>
                        <View>
                            <Text style={styles.itemTitle}>{item.metalName || (isGold ? 'Digital Gold 24k' : 'Digital Silver 999')}</Text>
                            <Text style={styles.itemOrderId}>#{item.orderId || 'ORD-UNKNOWN'}</Text>
                        </View>
                    </View>
                    <View style={[styles.badge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
                        <Text style={[styles.badgeText, { color: statusColor }]}>{item.status}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailsRow}>
                    <View>
                        <Text style={styles.amountLabel}>AMOUNT PAID</Text>
                        <Text style={[
                            styles.amountValue,
                            item.status === 'Failed' && styles.strikethrough
                        ]}>
                            ₹{item.amountPaid?.toLocaleString()}
                        </Text>
                    </View>
                    <View style={styles.rightDetails}>
                        <Text style={styles.rateDetails}>
                            {item.gramsCredited}g @ ₹{item.ratePerGram}/g
                        </Text>
                        <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                    </View>
                </View>
            </View>
        );
    };

    const FilterChip = ({ label, value }) => (
        <TouchableOpacity
            style={[styles.chip, activeFilter === value && styles.activeChip]}
            onPress={() => setActiveFilter(value)}
        >
            <Text style={[styles.chipText, activeFilter === value && styles.activeChipText]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color="#2e7d32" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Orders</Text>
                <TouchableOpacity onPress={() => setShowFilterModal(true)}>
                    <Ionicons name="filter" size={24} color="#2e7d32" />
                </TouchableOpacity>
            </View>

            {/* Filter Chips */}
            <View style={styles.chipsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                    <FilterChip label="All Orders" value="All" />
                    <FilterChip label="Gold" value="Gold" />
                    <FilterChip label="Silver" value="Silver" />
                    <FilterChip label="Pending" value="Pending" />
                    <FilterChip label="Success" value="Success" />
                    <FilterChip label="Failed" value="Failed" />
                </ScrollView>
            </View>

            {/* Orders List */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#2e7d32" />
                </View>
            ) : (
                <FlatList
                    data={filteredOrders}
                    renderItem={renderOrderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>No orders found</Text>
                        </View>
                    }
                    refreshing={loading}
                    onRefresh={fetchOrders}
                />
            )}
            {/* Filter Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showFilterModal}
                onRequestClose={() => setShowFilterModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filter Orders</Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                <Ionicons name="close" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.filterLabel}>Status</Text>
                        <View style={styles.filterRow}>
                            {['All', 'Pending', 'Success', 'Failed'].map(status => (
                                <TouchableOpacity
                                    key={status}
                                    style={[styles.filterBtn, activeFilter === status && styles.activeFilterBtn]}
                                    onPress={() => setActiveFilter(status)}
                                >
                                    <Text style={[styles.filterBtnText, activeFilter === status && styles.activeFilterBtnText]}>{status}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.filterLabel}>Metal Type</Text>
                        <View style={styles.filterRow}>
                            {['Gold', 'Silver'].map(metal => (
                                <TouchableOpacity
                                    key={metal}
                                    style={[styles.filterBtn, activeFilter === metal && styles.activeFilterBtn]}
                                    onPress={() => setActiveFilter(metal)}
                                >
                                    <Text style={[styles.filterBtnText, activeFilter === metal && styles.activeFilterBtnText]}>{metal}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={styles.applyButton}
                            onPress={() => setShowFilterModal(false)}
                        >
                            <Text style={styles.applyButtonText}>Apply Filters</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f8e9' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1b3223' },
    chipsContainer: { height: 50, marginBottom: 10 },
    chip: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', marginRight: 10, borderWidth: 1, borderColor: '#e8f5e9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
    activeChip: { backgroundColor: '#2e7d32', borderColor: '#2e7d32' },
    chipText: { color: '#81c784', fontWeight: 'bold' },
    activeChipText: { color: '#FFFFFF' },
    listContent: { padding: 20 },
    card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e8f5e9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    iconRow: { flexDirection: 'row', alignItems: 'center' },
    iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    iconText: { fontSize: 18, fontWeight: 'bold' },
    itemTitle: { color: '#1b3223', fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
    itemOrderId: { color: '#81c784', fontSize: 12, fontWeight: '600' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
    badgeText: { fontSize: 10, fontWeight: 'bold' },
    divider: { height: 1, backgroundColor: '#f0f4f1', marginVertical: 12 },
    detailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    amountLabel: { color: '#81c784', fontSize: 10, marginBottom: 2, letterSpacing: 1, fontWeight: 'bold' },
    amountValue: { color: '#2e7d32', fontSize: 20, fontWeight: 'bold' },
    strikethrough: { textDecorationLine: 'line-through', color: '#e53935' },
    rightDetails: { alignItems: 'flex-end' },
    rateDetails: { color: '#4caf50', fontSize: 12, marginBottom: 2, fontWeight: '600' },
    dateText: { color: '#81c784', fontSize: 12 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#81c784', fontSize: 16, fontWeight: '600' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, minHeight: 350, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 15 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
    modalTitle: { color: '#1b3223', fontSize: 20, fontWeight: 'bold' },
    filterLabel: { color: '#81c784', marginBottom: 12, marginTop: 10, fontWeight: 'bold', letterSpacing: 0.5 },
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    filterBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f1f8e9', marginBottom: 10, borderWidth: 1, borderColor: '#e8f5e9' },
    activeFilterBtn: { backgroundColor: '#2e7d32', borderColor: '#2e7d32' },
    filterBtnText: { color: '#4caf50', fontWeight: '600' },
    activeFilterBtnText: { color: '#FFFFFF', fontWeight: 'bold' },
    applyButton: { backgroundColor: '#2e7d32', padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 30, shadowColor: '#2e7d32', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    applyButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 }
});

export default OrdersScreen;
