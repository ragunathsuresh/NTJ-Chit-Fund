import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ─── Smart API URL Detection ──────────────────────────────────────────────────
const getApiUrl = () => {
    if (Platform.OS === 'web') {
        return 'http://localhost:5000/api';
    }
    const configured = Constants.expoConfig?.extra?.apiUrl;
    console.log('[API] Configured URL from app.config:', configured);
    return configured || 'http://192.168.1.6:5000/api';
};

const API_URL = getApiUrl();
console.log('[API] Platform:', Platform.OS, '→ Using URL:', API_URL);

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    timeout: 15000, // 15 seconds — generous for Expo Go on WiFi
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor — attach auth token
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error getting token:', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — meaningful error messages
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await SecureStore.deleteItemAsync('userToken');
        }

        // Network error (no response at all — backend unreachable)
        if (!error.response && (error.code === 'ECONNABORTED' || error.message === 'Network Error' || error.code === 'ERR_NETWORK')) {
            const networkErr = {
                success: false,
                message: `Cannot reach server at ${API_URL}.\n\nCheck:\n1. Backend is running (npm start in ntj-backend)\n2. Phone & PC are on the same WiFi\n3. IP is correct (currently: ${API_URL})`,
                isNetworkError: true,
            };
            return Promise.reject(networkErr);
        }

        return Promise.reject(error);
    }
);

export default api;
