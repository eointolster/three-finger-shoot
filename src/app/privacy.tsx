/**
 * Privacy Policy Screen
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '../styles/theme';

export default function PrivacyScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Privacy Policy</Text>
                    <View style={styles.placeholder} />
                </View>

                <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                    <Text style={styles.appName}>Three Finger Shoot</Text>
                    <Text style={styles.lastUpdated}>Last Updated: August 16, 2026</Text>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Overview</Text>
                        <Text style={styles.sectionText}>
                            Three Finger Shoot is a gesture-controlled shooting game. We are committed to protecting your privacy.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Data Collection</Text>
                        <Text style={styles.highlight}>We do not collect, store, or transmit any personal data.</Text>
                        <Text style={styles.sectionText}>
                            {'\n'}This app:{'\n'}
                            • Does not require account registration{'\n'}
                            • Does not collect personally identifiable information{'\n'}
                            • Does not use analytics or tracking services{'\n'}
                            • Does not share data with third parties{'\n'}
                            • Stores game progress locally on your device only
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Camera Usage</Text>
                        <Text style={styles.sectionText}>
                            This app uses your front camera for real-time hand gesture detection using Apple's on-device Vision framework.
                            {'\n\n'}• Camera images are processed locally{'\n'}
                            • No images or video are stored or transmitted{'\n'}
                            • Camera data never leaves your device
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Local Storage</Text>
                        <Text style={styles.sectionText}>
                            Game progress and high scores are stored locally on your device. This data never leaves your device and is deleted when you uninstall the app.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Third-Party Links</Text>
                        <Text style={styles.sectionText}>
                            The app may provide links to YouTube or App Store pages that open outside Three Finger Shoot. Those destinations have their own privacy practices. The app does not send camera images, gameplay data, or locally stored progress through these links.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Children's Privacy</Text>
                        <Text style={styles.sectionText}>
                            This app is suitable for all ages. We do not knowingly collect any personal information from children under 13 or any other age group.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Changes to This Policy</Text>
                        <Text style={styles.sectionText}>
                            We may update this Privacy Policy from time to time. Any changes will be reflected in the "Last Updated" date above.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Contact</Text>
                        <Text style={styles.sectionText}>
                            For privacy or support questions, use the support contact provided on Three Finger Shoot's App Store listing.
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    backButton: {
        padding: spacing.sm,
    },
    backText: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.white,
    },
    placeholder: {
        width: 60,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    appName: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.white,
        marginBottom: spacing.xs,
    },
    lastUpdated: {
        fontSize: 14,
        color: colors.gray,
        marginBottom: spacing.xl,
    },
    section: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.white,
        marginBottom: spacing.sm,
    },
    sectionText: {
        fontSize: 15,
        color: colors.grayLight,
        lineHeight: 22,
    },
    highlight: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.aim,
    },
});
