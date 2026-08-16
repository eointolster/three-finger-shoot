import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import { colors, typography, spacing } from '../styles/theme';
import { useSettingsStore } from '../store/settingsStore';
import { GestureCalibration } from '../components/GestureCalibration';

export default function SettingsScreen() {
    const router = useRouter();
    const {
        musicEnabled,
        setMusicEnabled,
        trackingSensitivity,
        setTrackingSensitivity,
        showCalibrationBeforeGame,
        setShowCalibrationBeforeGame,
        lastCalibrationTime,
        isCalibrated,
    } = useSettingsStore();

    const [showCalibrationTest, setShowCalibrationTest] = useState(false);

    const goBack = () => {
        router.push('/');
    };

    const handleCalibrationComplete = () => {
        useSettingsStore.getState().setLastCalibrationTime(Date.now());
        setShowCalibrationTest(false);
    };

    // Show calibration test screen
    if (showCalibrationTest) {
        return (
            <GestureCalibration
                onComplete={handleCalibrationComplete}
                onBack={() => setShowCalibrationTest(false)}
                gameName="Calibration Test"
                gameInstructions="Your hand controls are working correctly!"
            />
        );
    }

    const getSensitivityLabel = () => {
        if (trackingSensitivity <= 0.7) return 'Strict';
        if (trackingSensitivity <= 1.0) return 'Normal';
        if (trackingSensitivity <= 1.5) return 'Lenient';
        return 'Very Lenient';
    };

    const getCalibrationStatus = () => {
        if (lastCalibrationTime === 0) {
            return 'Not yet calibrated';
        }
        if (isCalibrated()) {
            const minutes = Math.round((Date.now() - lastCalibrationTime) / 60000);
            return `Calibrated ${minutes} min ago ✓`;
        }
        return 'Calibration expired';
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={goBack} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Settings</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content}>
                {/* Audio Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🔊 Audio</Text>

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Background Music</Text>
                            <Text style={styles.settingHint}>
                                {musicEnabled ? 'Music plays during games' : 'Music is muted'}
                            </Text>
                        </View>
                        <Switch
                            value={musicEnabled}
                            onValueChange={setMusicEnabled}
                            trackColor={{ false: colors.grayDark, true: colors.aim }}
                            thumbColor={colors.white}
                        />
                    </View>
                </View>

                {/* Gesture Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>✋ Hand Tracking</Text>

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Tracking Sensitivity</Text>
                            <Text style={styles.settingHint}>
                                {getSensitivityLabel()} - {trackingSensitivity.toFixed(1)}x
                            </Text>
                        </View>
                    </View>

                    <View style={styles.sliderContainer}>
                        <Text style={styles.sliderLabel}>Strict</Text>
                        <View style={styles.sliderWrapper}>
                            <Slider
                                style={styles.slider}
                                minimumValue={0.5}
                                maximumValue={2.0}
                                step={0.1}
                                value={trackingSensitivity}
                                onValueChange={setTrackingSensitivity}
                                minimumTrackTintColor={colors.aim}
                                maximumTrackTintColor={colors.grayDark}
                                thumbTintColor={colors.aim}
                            />
                        </View>
                        <Text style={styles.sliderLabel}>Lenient</Text>
                    </View>

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Calibration Before Games</Text>
                            <Text style={styles.settingHint}>
                                {showCalibrationBeforeGame
                                    ? 'Verify controls before each game'
                                    : 'Skip calibration step'}
                            </Text>
                        </View>
                        <Switch
                            value={showCalibrationBeforeGame}
                            onValueChange={setShowCalibrationBeforeGame}
                            trackColor={{ false: colors.grayDark, true: colors.aim }}
                            thumbColor={colors.white}
                        />
                    </View>
                </View>

                {/* Calibration Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🎯 Calibration</Text>

                    <View style={styles.calibrationStatus}>
                        <Text style={styles.statusText}>{getCalibrationStatus()}</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.calibrateButton}
                        onPress={() => setShowCalibrationTest(true)}
                    >
                        <Text style={styles.calibrateButtonText}>Test Calibration Now</Text>
                    </TouchableOpacity>

                    <Text style={styles.calibrationHint}>
                        Tests that your hand gestures are being detected correctly.
                        Open hand = aim, Closed fist = shoot
                    </Text>
                </View>

                {/* Info Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ℹ️ Tips</Text>
                    <Text style={styles.tipText}>
                        • Good lighting helps hand detection{'\n'}
                        • Keep your hand 1-2 feet from camera{'\n'}
                        • Spread fingers wide for aiming{'\n'}
                        • Make a tight fist to shoot{'\n'}
                        • Tap camera area as backup shoot
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xxl,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.grayDark,
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
        ...typography.h2,
    },
    placeholder: {
        width: 60,
    },
    content: {
        flex: 1,
    },
    section: {
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.grayDark,
    },
    sectionTitle: {
        ...typography.h3,
        marginBottom: spacing.md,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
    },
    settingInfo: {
        flex: 1,
        marginRight: spacing.md,
    },
    settingLabel: {
        ...typography.body,
        color: colors.white,
        marginBottom: 2,
    },
    settingHint: {
        ...typography.caption,
        color: colors.gray,
    },
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.md,
    },
    sliderWrapper: {
        flex: 1,
        marginHorizontal: spacing.sm,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderLabel: {
        ...typography.caption,
        color: colors.gray,
        width: 50,
        textAlign: 'center',
    },
    calibrationStatus: {
        backgroundColor: colors.grayDark,
        padding: spacing.md,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    statusText: {
        ...typography.body,
        color: colors.grayLight,
    },
    calibrateButton: {
        backgroundColor: colors.aim,
        paddingVertical: spacing.md,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    calibrateButtonText: {
        ...typography.h3,
        color: colors.background,
    },
    calibrationHint: {
        ...typography.caption,
        color: colors.gray,
        textAlign: 'center',
        lineHeight: 18,
    },
    tipText: {
        ...typography.body,
        color: colors.grayLight,
        lineHeight: 24,
    },
});
