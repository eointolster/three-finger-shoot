import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '../styles/theme';
import { useGestureStore } from '../store/gestureStore';
import { GestureCamera } from './GestureCamera';

interface GestureCalibrationProps {
    onComplete: () => void;
    onBack: () => void;
    gameName: string;
    gameInstructions: string;
}

/**
 * GestureCalibration - Pre-game setup to verify hand controls work
 *
 * Steps:
 * 1. Show hand open (aim detected)
 * 2. Make fist (shoot detected)
 * 3. Repeat 2-3 times to confirm
 */
export function GestureCalibration({
    onComplete,
    onBack,
    gameName,
    gameInstructions
}: GestureCalibrationProps) {
    const { gestureState } = useGestureStore();

    const [step, setStep] = useState(0);
    const [aimCount, setAimCount] = useState(0);
    const [shootCount, setShootCount] = useState(0);
    const [lastState, setLastState] = useState('idle');
    const [calibrationComplete, setCalibrationComplete] = useState(false);

    // Required successful detections
    const REQUIRED_AIMS = 2;
    const REQUIRED_SHOOTS = 2;

    // Track gesture transitions
    useEffect(() => {
        if (gestureState === lastState) return;

        // Aim detected
        if (gestureState === 'aim' && lastState !== 'aim') {
            if (step === 0) {
                setAimCount(prev => {
                    const newCount = prev + 1;
                    if (newCount >= REQUIRED_AIMS) {
                        setStep(1);
                    }
                    return newCount;
                });
            }
        }

        // Shoot detected (fist)
        if (gestureState === 'shoot' && lastState !== 'shoot') {
            if (step === 1) {
                setShootCount(prev => {
                    const newCount = prev + 1;
                    if (newCount >= REQUIRED_SHOOTS) {
                        setCalibrationComplete(true);
                    }
                    return newCount;
                });
            }
        }

        setLastState(gestureState);
    }, [gestureState, step, lastState]);

    const getStepInstructions = () => {
        if (calibrationComplete) {
            return {
                icon: '✅',
                title: 'Ready to Play!',
                subtitle: 'Hand controls verified',
                progress: 'Tap START to begin'
            };
        }

        if (step === 0) {
            return {
                icon: '✋',
                title: 'Step 1: Open Hand',
                subtitle: 'Hold your hand open with fingers spread',
                progress: `${aimCount}/${REQUIRED_AIMS} detected`
            };
        }

        return {
            icon: '✊',
            title: 'Step 2: Make a Fist',
            subtitle: 'Close your hand into a fist',
            progress: `${shootCount}/${REQUIRED_SHOOTS} detected`
        };
    };

    const instructions = getStepInstructions();

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.gameTitle}>{gameName}</Text>
            </View>

            {/* Camera area - larger for calibration */}
            <View style={styles.cameraContainer}>
                <GestureCamera />
            </View>

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
                <Text style={styles.stepIcon}>{instructions.icon}</Text>
                <Text style={styles.stepTitle}>{instructions.title}</Text>
                <Text style={styles.stepSubtitle}>{instructions.subtitle}</Text>
                <Text style={styles.progress}>{instructions.progress}</Text>

                {/* Current detected state indicator */}
                <View style={styles.stateIndicator}>
                    <View style={[
                        styles.stateDot,
                        gestureState === 'aim' && styles.stateDotAim,
                        gestureState === 'shoot' && styles.stateDotShoot,
                    ]} />
                    <Text style={styles.stateText}>
                        {gestureState === 'idle' ? 'Waiting for hand...' :
                            gestureState === 'aim' ? '✋ Hand Open Detected!' :
                                gestureState === 'shoot' ? '✊ Fist Detected!' :
                                    'Processing...'}
                    </Text>
                </View>

                {/* Game instructions for after calibration */}
                {calibrationComplete && (
                    <Text style={styles.gameInstructions}>{gameInstructions}</Text>
                )}
            </View>

            {/* Action buttons */}
            <View style={styles.buttonContainer}>
                {calibrationComplete ? (
                    <TouchableOpacity
                        style={styles.startButton}
                        onPress={onComplete}
                    >
                        <Text style={styles.startButtonText}>START GAME</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={onComplete}
                    >
                        <Text style={styles.skipButtonText}>Skip Calibration</Text>
                    </TouchableOpacity>
                )}
            </View>
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
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.md,
    },
    backButton: {
        paddingRight: spacing.md,
    },
    backText: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    gameTitle: {
        ...typography.h3,
        flex: 1,
        textAlign: 'center',
        marginRight: 60, // Offset for back button
    },
    cameraContainer: {
        height: 250,
        marginHorizontal: spacing.lg,
        borderRadius: 16,
        overflow: 'hidden',
    },
    instructionsContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
    },
    stepIcon: {
        fontSize: 64,
        marginBottom: spacing.md,
    },
    stepTitle: {
        ...typography.h2,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    stepSubtitle: {
        ...typography.body,
        color: colors.grayLight,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    progress: {
        ...typography.caption,
        color: colors.aim,
        fontWeight: 'bold',
        marginBottom: spacing.lg,
    },
    stateIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: 12,
        marginBottom: spacing.lg,
    },
    stateDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: colors.gray,
        marginRight: spacing.sm,
    },
    stateDotAim: {
        backgroundColor: colors.aim,
    },
    stateDotShoot: {
        backgroundColor: colors.shoot,
    },
    stateText: {
        ...typography.body,
        color: colors.white,
    },
    gameInstructions: {
        ...typography.body,
        color: colors.grayLight,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    buttonContainer: {
        padding: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    startButton: {
        backgroundColor: colors.aim,
        paddingVertical: spacing.md,
        borderRadius: 12,
        alignItems: 'center',
    },
    startButtonText: {
        ...typography.h3,
        color: colors.background,
    },
    skipButton: {
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    skipButtonText: {
        ...typography.body,
        color: colors.gray,
    },
});
