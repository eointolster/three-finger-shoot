import React, { useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Linking,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    interpolateColor,
    Easing,
} from 'react-native-reanimated';
import { colors, typography, spacing } from '../styles/theme';

interface CrossPromoModalProps {
    visible: boolean;
    onClose: () => void;
}

// Your other apps
const OTHER_APPS = [
    {
        name: 'Melody Mind',
        subtitle: 'Memory Enhancement Game',
        emoji: '🧠',
        appStoreUrl: 'https://apps.apple.com/app/melody-mind/id6740667209',
    },
    {
        name: 'Void Caravan',
        subtitle: 'Lone Pilot fighting Explorer',
        emoji: '🚀',
        appStoreUrl: 'https://apps.apple.com/app/void-caravan/id6740055498',
    },
];

const YOUTUBE_URL = 'https://youtube.com/@eointolster';
const ALL_APPS_URL = 'https://apps.apple.com/au/developer/eoin-j-tolster/id1867338583';

// Softer, friendlier messages
const FRIENDLY_MESSAGES = [
    "Hope you're having fun! 🎮",
    "Thanks for playing my game! ✨",
    "You're awesome! Keep playing! 🌟",
];

export function CrossPromoModal({ visible, onClose }: CrossPromoModalProps) {
    // Rainbow animation
    const rainbowProgress = useSharedValue(0);

    // Pick message ONCE when modal becomes visible (not on every re-render)
    const friendlyMessage = useMemo(() => {
        return FRIENDLY_MESSAGES[Math.floor(Math.random() * FRIENDLY_MESSAGES.length)];
    }, [visible]);

    useEffect(() => {
        if (visible) {
            rainbowProgress.value = 0;
            rainbowProgress.value = withRepeat(
                withTiming(1, { duration: 3000, easing: Easing.linear }),
                -1, // infinite
                false
            );
        }
    }, [visible]);

    const rainbowStyle = useAnimatedStyle(() => {
        const color = interpolateColor(
            rainbowProgress.value,
            [0, 0.16, 0.33, 0.5, 0.66, 0.83, 1],
            ['#FF6B6B', '#FFE66D', '#4ECDC4', '#45B7D1', '#96C93D', '#FF6B6B', '#FF6B6B']
        );
        return { color };
    });

    const openLink = async (url: string) => {
        try {
            await Linking.openURL(url);
        } catch (e) {
            console.log('Failed to open URL:', e);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {/* Header with rainbow animation */}
                    <Animated.Text style={[styles.title, rainbowStyle]}>
                        {friendlyMessage}
                    </Animated.Text>

                    {/* Softer message */}
                    <Text style={styles.message}>
                        If you enjoy my games, here are some ways to support an indie dev! 💜
                    </Text>

                    {/* YouTube Button */}
                    <TouchableOpacity
                        style={styles.youtubeButton}
                        onPress={() => openLink(YOUTUBE_URL)}
                    >
                        <Text style={styles.youtubeEmoji}>📺</Text>
                        <View style={styles.buttonTextContainer}>
                            <Text style={styles.youtubeTitle}>Watch on YouTube</Text>
                            <Text style={styles.youtubeSubtitle}>@eointolster</Text>
                        </View>
                    </TouchableOpacity>

                    {/* View all apps button */}
                    <TouchableOpacity
                        style={styles.appButton}
                        onPress={() => openLink(ALL_APPS_URL)}
                    >
                        <Text style={styles.appEmoji}>🎮</Text>
                        <View style={styles.buttonTextContainer}>
                            <Text style={styles.appTitle}>Check out my other games</Text>
                            <Text style={styles.appSubtitle}>On the App Store</Text>
                        </View>
                        <Text style={styles.arrow}>→</Text>
                    </TouchableOpacity>

                    {/* Close button */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Back to Game ✌️</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modal: {
        backgroundColor: colors.backgroundLight,
        borderRadius: 20,
        padding: spacing.xl,
        width: '100%',
        maxWidth: 340,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    message: {
        ...typography.body,
        color: colors.grayLight,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: spacing.lg,
    },
    youtubeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF0000',
        padding: spacing.md,
        borderRadius: 12,
        marginBottom: spacing.lg,
    },
    youtubeEmoji: {
        fontSize: 28,
        marginRight: spacing.md,
    },
    buttonTextContainer: {
        flex: 1,
    },
    youtubeTitle: {
        ...typography.body,
        color: colors.white,
        fontWeight: 'bold',
    },
    youtubeSubtitle: {
        ...typography.caption,
        color: 'rgba(255,255,255,0.8)',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    dividerText: {
        ...typography.caption,
        color: colors.gray,
        marginHorizontal: spacing.sm,
    },
    appButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: spacing.md,
        borderRadius: 12,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    appEmoji: {
        fontSize: 32,
        marginRight: spacing.md,
    },
    appTitle: {
        ...typography.body,
        color: colors.white,
        fontWeight: '600',
    },
    appSubtitle: {
        ...typography.caption,
        color: colors.gray,
    },
    arrow: {
        fontSize: 18,
        color: colors.gray,
    },
    allAppsLink: {
        alignItems: 'center',
        paddingVertical: spacing.sm,
        marginBottom: spacing.md,
    },
    allAppsText: {
        ...typography.caption,
        color: colors.primary,
    },
    closeButton: {
        backgroundColor: colors.primary,
        padding: spacing.md,
        borderRadius: 12,
        alignItems: 'center',
    },
    closeButtonText: {
        ...typography.body,
        color: colors.white,
        fontWeight: 'bold',
    },
});
