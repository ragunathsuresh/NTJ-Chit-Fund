import api from './api';
import * as SecureStore from 'expo-secure-store';

const authService = {
    // Step 1: Send OTP to EMAIL (validates details, doesn't create account yet)
    sendOtp: async (userData) => {
        try {
            const response = await api.post('/auth/send-otp', userData);
            return response.data;
        } catch (error) {
            console.error('sendOtp error:', error);
            if (error.response) {
                throw error.response.data;
            } else if (error.request) {
                throw {
                    message: 'Network Error: Could not connect to server.',
                    serverError: 'Check if backend is running on port 5000 and accessible.'
                };
            } else {
                throw { message: 'Error: ' + error.message };
            }
        }
    },

    // Step 2: Verify OTP (now uses email, not phone) and create account + auto-login
    verifyOtp: async (email, otp) => {
        try {
            const response = await api.post('/auth/verify-otp', { email, otp });
            if (response.data.success && response.data.data?.token) {
                await SecureStore.setItemAsync('userToken', response.data.data.token);
            }
            return response.data;
        } catch (error) {
            console.error('verifyOtp error:', error);
            if (error.response) {
                throw error.response.data;
            } else if (error.request) {
                throw { message: 'Network Error: Could not connect to server.' };
            } else {
                throw { message: 'Error: ' + error.message };
            }
        }
    },

    // Resend OTP to email
    resendOtp: async (email) => {
        try {
            const response = await api.post('/auth/resend-otp', { email });
            return response.data;
        } catch (error) {
            if (error.response) throw error.response.data;
            throw { message: 'Network Error: Could not resend OTP.' };
        }
    },

    // Login user
    login: async (credentials) => {
        try {
            const response = await api.post('/auth/login', credentials);
            if (response.data.success && response.data.data.token) {
                await SecureStore.setItemAsync('userToken', response.data.data.token);
            }
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Login failed' };
        }
    },

    // Get current user
    getCurrentUser: async () => {
        try {
            const response = await api.get('/auth/me');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to get user data' };
        }
    },

    // Logout
    logout: async () => {
        try {
            await SecureStore.deleteItemAsync('userToken');
            return { success: true };
        } catch (error) {
            throw { message: 'Logout failed' };
        }
    },

    // Check if user is logged in
    isLoggedIn: async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            return !!token;
        } catch (error) {
            return false;
        }
    },

    // Forgot password — send OTP via EMAIL to registered address
    forgotPassword: async (identifier) => {
        try {
            const isEmail = identifier.includes('@');
            const payload = isEmail ? { email: identifier } : { phone: identifier };
            const response = await api.post('/auth/forgot-password', payload);
            return response.data;
        } catch (error) {
            console.error('forgotPassword service error:', error);
            throw error.response?.data || { message: 'Failed to send reset OTP' };
        }
    },

    // Reset password — verify OTP (sent to email) and update password
    resetPassword: async (email, otp, password) => {
        try {
            const response = await api.post('/auth/reset-password', { email, otp, password });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to reset password' };
        }
    },
};

export default authService;
