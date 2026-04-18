import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const deviceColorScheme = useColorScheme(); // 'light' or 'dark'
    const [themeMode, setThemeMode] = useState('system'); // 'system', 'dark', 'light'
    const [isLoading, setIsLoading] = useState(true);

    // Load theme preference from storage
    useEffect(() => {
        loadThemePreference();
    }, []);

    const loadThemePreference = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('theme_preference');
            if (savedTheme) {
                setThemeMode(savedTheme);
            }
        } catch (error) {
            console.error('Error loading theme preference:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveThemePreference = async (mode) => {
        try {
            await AsyncStorage.setItem('theme_preference', mode);
            setThemeMode(mode);
        } catch (error) {
            console.error('Error saving theme preference:', error);
        }
    };

    // Determine actual theme based on mode
    const getActualTheme = () => {
        if (themeMode === 'system') {
            return deviceColorScheme || 'dark';
        }
        return themeMode;
    };

    const actualTheme = getActualTheme();

    // Theme colors
    const colors = {
        dark: {
            background: '#0a1a0f', // Very dark green background
            cardBackground: '#14251a', // Muted dark green for cards
            secondaryBackground: '#1b3223',
            text: '#FFFFFF',
            textSecondary: '#a5d6a7', // Light green text
            textTertiary: '#66bb6a',
            primary: '#2e7d32', // Emerald Green
            border: '#2e7d32',
            success: '#66bb6a',
            error: '#ef5350',
            warning: '#ffa726',
        },
        light: {
            background: '#FFFFFF',
            cardBackground: '#f1f8e9', // Very light green tint
            secondaryBackground: '#e8f5e9',
            text: '#1b3223', // Dark forest green text
            textSecondary: '#2e7d32', // Darker emerald for better contrast
            textTertiary: '#43a047',
            primary: '#2e7d32', // Emerald Green
            border: '#c8e6c9',
            success: '#2e7d32',
            error: '#d32f2f',
            warning: '#f57c00',
        }
    };

    const theme = {
        mode: themeMode,
        actualTheme: actualTheme,
        colors: colors[actualTheme],
        isDark: actualTheme === 'dark',
        setTheme: saveThemePreference,
        isLoading
    };

    return (
        <ThemeContext.Provider value={theme}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;
