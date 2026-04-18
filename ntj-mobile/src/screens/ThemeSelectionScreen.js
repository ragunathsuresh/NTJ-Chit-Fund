import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const ThemeSelectionScreen = ({ navigation }) => {
    const { mode, setTheme, colors } = useTheme();

    const themeOptions = [
        {
            id: 'system',
            name: 'System Default',
            description: 'Follows your device settings',
            icon: 'phone-portrait'
        },
        {
            id: 'dark',
            name: 'Dark Mode',
            description: 'Dark theme for all screens',
            icon: 'moon'
        },
        {
            id: 'light',
            name: 'Light Mode',
            description: 'Light theme for all screens',
            icon: 'sunny'
        }
    ];

    const handleThemeSelect = (themeId) => {
        setTheme(themeId);
        setTimeout(() => navigation.goBack(), 300);
    };

    const dynamicStyles = getDynamicStyles(colors);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Select Theme</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={[styles.infoCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <Ionicons name="information-circle" size={20} color={colors.primary} />
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        Choose your preferred theme. Changes apply immediately.
                    </Text>
                </View>

                {themeOptions.map((option) => (
                    <TouchableOpacity
                        key={option.id}
                        style={[
                            styles.themeOption,
                            {
                                backgroundColor: colors.cardBackground,
                                borderColor: mode === option.id ? colors.primary : colors.border,
                                borderWidth: mode === option.id ? 2 : 1
                            }
                        ]}
                        onPress={() => handleThemeSelect(option.id)}
                    >
                        <View style={[
                            styles.iconContainer,
                            { backgroundColor: mode === option.id ? colors.primary + '20' : colors.secondaryBackground }
                        ]}>
                            <Ionicons
                                name={option.icon}
                                size={28}
                                color={mode === option.id ? colors.primary : colors.textSecondary}
                            />
                        </View>
                        <View style={styles.themeTextContainer}>
                            <Text style={[styles.themeName, { color: colors.text }]}>
                                {option.name}
                            </Text>
                            <Text style={[styles.themeDescription, { color: colors.textSecondary }]}>
                                {option.description}
                            </Text>
                        </View>
                        {mode === option.id && (
                            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                        )}
                    </TouchableOpacity>
                ))}

                <View style={{ height: 50 }} />
            </ScrollView>
        </View>
    );
};

const getDynamicStyles = (colors) => StyleSheet.create({
    infoCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        alignItems: 'center',
        borderWidth: 1
    }
});

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold'
    },
    scrollContent: {
        padding: 20
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        marginLeft: 12,
        lineHeight: 20
    },
    themeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        borderRadius: 16,
        marginBottom: 12
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    themeTextContainer: {
        flex: 1
    },
    themeName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4
    },
    themeDescription: {
        fontSize: 14
    }
});

export default ThemeSelectionScreen;
