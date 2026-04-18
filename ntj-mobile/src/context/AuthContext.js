import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Load user data on app start
    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            setIsLoading(true);
            const isLoggedIn = await authService.isLoggedIn();

            if (isLoggedIn) {
                const userData = await authService.getCurrentUser();
                if (userData.success) {
                    setUser(userData.data);
                    setIsAuthenticated(true);
                    await AsyncStorage.setItem('user', JSON.stringify(userData.data));
                } else {
                    const cachedUser = await AsyncStorage.getItem('user');
                    if (cachedUser) {
                        setUser(JSON.parse(cachedUser));
                        setIsAuthenticated(true);
                    }
                }
            } else {
                const cachedUser = await AsyncStorage.getItem('user');
                if (cachedUser) {
                    setUser(JSON.parse(cachedUser));
                }
            }
        } catch (error) {
            // Non-critical: backend unreachable or session expired — use cached user
            console.log('Auth load (using cache):', error.message || 'session check failed');
            if (error.response?.status === 401) {
                setUser(null);
                setIsAuthenticated(false);
                await AsyncStorage.removeItem('user');
            } else {
                const cachedUser = await AsyncStorage.getItem('user');
                if (cachedUser) {
                    setUser(JSON.parse(cachedUser));
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (credentials) => {
        try {
            const response = await authService.login(credentials);
            if (response.success) {
                setUser(response.data);
                setIsAuthenticated(true);
                await AsyncStorage.setItem('user', JSON.stringify(response.data));
                return { success: true };
            }
            return response;
        } catch (error) {
            return { success: false, message: error.message || 'Login failed' };
        }
    };

    // Step 1: Send OTP — does NOT create account
    const sendOtp = async (userData) => {
        try {
            const response = await authService.sendOtp(userData);
            return response;
        } catch (error) {
            console.error('AuthContext: sendOtp error', error);
            return {
                success: false,
                message: error.message || 'Failed to send OTP'
            };
        }
    };

    // Step 2: Verify OTP (email-based) — creates account + logs user in
    const verifyOtpAndRegister = async (email, otp) => {
        try {
            const response = await authService.verifyOtp(email, otp);
            if (response.success) {
                setUser(response.data);
                setIsAuthenticated(true);
                await AsyncStorage.setItem('user', JSON.stringify(response.data));
                return { success: true };
            }
            return response;
        } catch (error) {
            console.error('AuthContext: verifyOtp error', error);
            return {
                success: false,
                message: error.message || 'OTP verification failed'
            };
        }
    };

    const resendOtp = async (email) => {
        try {
            const response = await authService.resendOtp(email);
            return response;
        } catch (error) {
            return { success: false, message: error.message || 'Failed to resend OTP' };
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
            setUser(null);
            setIsAuthenticated(false);
            await AsyncStorage.removeItem('user');
            return { success: true };
        } catch (error) {
            return { success: false, message: 'Logout failed' };
        }
    };

    // Silent refresh — fetches fresh user data WITHOUT triggering isLoading
    // Use this for background refreshes (e.g. on screen focus) to avoid blinking
    const silentRefreshUser = async () => {
        try {
            const isLoggedIn = await authService.isLoggedIn();
            if (!isLoggedIn) return;
            const userData = await authService.getCurrentUser();
            if (userData.success) {
                setUser(userData.data);
                await AsyncStorage.setItem('user', JSON.stringify(userData.data));
            }
        } catch (error) {
            // Silently fail — don't disrupt the UI
            console.log('Silent refresh failed (non-critical):', error.message);
        }
    };

    const value = {
        user,
        isAuthenticated,
        isLoading,
        login,
        sendOtp,
        verifyOtpAndRegister,
        resendOtp,
        logout,
        loadUser,
        refreshUser: silentRefreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export default AuthContext;
