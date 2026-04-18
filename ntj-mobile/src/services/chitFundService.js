import api from './api';

const chitFundService = {
    // Submit a new chit fund request
    submitRequest: async (data) => {
        try {
            const response = await api.post('/chitfund/request', data);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: error.message || 'Network Error' };
        }
    },

    // Get current user's plans
    getMyPlans: async () => {
        try {
            const response = await api.get('/chitfund/my');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: error.message || 'Network Error' };
        }
    },

    // Get active/approved plan
    getActivePlan: async () => {
        try {
            const response = await api.get('/chitfund/active');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: error.message || 'Network Error' };
        }
    },

    // Record a UPI payment for a month
    recordPayment: async (planId, upiTransactionId, month) => {
        try {
            const response = await api.post(`/chitfund/${planId}/pay`, { upiTransactionId, month });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: error.message || 'Network Error' };
        }
    },

    // Admin: Get all plans
    adminGetAll: async (status) => {
        try {
            const url = status ? `/chitfund/admin/all?status=${status}` : '/chitfund/admin/all';
            const response = await api.get(url);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: error.message || 'Network Error' };
        }
    },

    // Admin: Approve a plan
    adminApprove: async (planId, data) => {
        try {
            const response = await api.post(`/chitfund/admin/${planId}/approve`, data);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: error.message || 'Network Error' };
        }
    },

    // Admin: Reject a plan
    adminReject: async (planId, adminNote) => {
        try {
            const response = await api.post(`/chitfund/admin/${planId}/reject`, { adminNote });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: error.message || 'Network Error' };
        }
    },
};

export default chitFundService;
