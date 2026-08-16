import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useGestureStore } from '../store/gestureStore';
import { colors, typography, spacing } from '../styles/theme';

const { width } = Dimensions.get('window');

// Conditionally import native module (only available on iOS with dev client)
let GestureDetectorView: React.ComponentType<any> | null = null;

try {
    if (Platform.OS === 'ios') {
        const nativeModule = require('../../modules/gesture-detector/src');
        GestureDetectorView = nativeModule.GestureDetectorView;
    }
} catch (e) {
    console.log('Native GestureDetector not available, using fallback');
}

interface GestureCameraProps {
    showDebugOverlay?: boolean;
}

/**
 * GestureCamera Component
 *
 * Uses native Apple Vision hand tracking when available (iOS dev client build),
 * otherwise falls back to touch-based simulation for development.
 * Includes tap-to-shoot backup for when gesture detection is unreliable.
 */
export function GestureCamera({ showDebugOverlay = false }: GestureCameraProps) {
    const {
        setGestureState,
        setAimPosition,
        triggerShoot,
        gestureState
    } = useGestureStore();

    const [permissionError, setPermissionError] = React.useState(false);

    // Native gesture handlers
    const handleGestureChange = useCallback((event: any) => {
        const { state, error } = event.nativeEvent;

        // Check for permission error
        if (state === 'error' && error === 'camera_permission_denied') {
            setPermissionError(true);
            return;
        }

        setGestureState(state);
    }, [setGestureState]);

    const handleAimUpdate = useCallback((event: any) => {
        const { x, y } = event.nativeEvent;
        setAimPosition(x, y);
    }, [setAimPosition]);

    const handleShoot = useCallback((event: any) => {
        // Haptic feedback on shoot
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        triggerShoot();
    }, [triggerShoot]);

    // Tap-to-shoot backup - tap anywhere on camera to shoot
    const handleTapToShoot = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        triggerShoot();
    }, [triggerShoot]);

    // If native view is available, use it
    if (GestureDetectorView) {
        // Show permission error message if camera was denied
        if (permissionError) {
            return (
                <View style={styles.container}>
                    <View style={styles.cameraPanel}>
                        <View style={styles.fallbackCamera}>
                            <Text style={styles.fallbackEmoji}>🚫</Text>
                            <Text style={styles.fallbackText}>
                                Camera permission denied{'\n'}
                                Please enable in Settings → Privacy → Camera
                            </Text>
                        </View>
                    </View>
                </View>
            );
        }

        return (
            <TouchableOpacity
                style={styles.container}
                activeOpacity={0.9}
                onPress={handleTapToShoot}
            >
                <View style={styles.cameraPanel}>
                    <GestureDetectorView
                        style={styles.camera}
                        isActive={true}
                        sensitivity={1.5}  // Increased for better responsiveness
                        showDebugOverlay={showDebugOverlay}
                        onGestureChange={handleGestureChange}
                        onAimUpdate={handleAimUpdate}
                        onShoot={handleShoot}
                    />
                    <View style={styles.overlay}>
                        <View style={[
                            styles.statusIndicator,
                            gestureState === 'aim' && styles.statusAim,
                            gestureState === 'shoot' && styles.statusShoot,
                        ]} />
                        <Text style={styles.statusText}>
                            {gestureState === 'idle' ? '✋ Open hand to aim' :
                                gestureState === 'aim' ? '✊ Fist to shoot • or tap here' :
                                    '💥 SHOOT!'}
                        </Text>
                    </View>
                    {/* Tap hint badge */}
                    <View style={styles.tapHint}>
                        <Text style={styles.tapHintText}>TAP TO SHOOT</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    // Fallback: Touch-based simulation
    return <TouchFallback />;
}

// Touch-based fallback for development
function TouchFallback() {
    const { setGestureState, setAimPosition, triggerShoot } = useGestureStore();
    const [debugInfo, setDebugInfo] = React.useState('Waiting for gesture...');
    const [containerSize, setContainerSize] = React.useState({ width: 400, height: 300 });

    const handleLayout = (e: any) => {
        const { width, height } = e.nativeEvent.layout;
        setContainerSize({ width, height });
    };

    const handleTouchStart = (e: any) => {
        const { locationX, locationY } = e.nativeEvent;

        // Use measured container dimensions
        const normX = Math.min(1, Math.max(0, locationX / containerSize.width));
        const normY = Math.min(1, Math.max(0, locationY / containerSize.height));

        setAimPosition(normX, normY);
        setGestureState('aim');
        setDebugInfo(`Aiming: (${normX.toFixed(2)}, ${normY.toFixed(2)})`);
    };

    const handleTouchEnd = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        triggerShoot();
        setDebugInfo('SHOOT! 💥');

        setTimeout(() => {
            setGestureState('idle');
            setDebugInfo('Waiting for gesture...');
        }, 300);
    };

    return (
        <View
            style={styles.container}
            onLayout={handleLayout}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <View style={styles.cameraPanel}>
                <View style={styles.fallbackCamera}>
                    <Text style={styles.fallbackEmoji}>📷</Text>
                    <Text style={styles.fallbackText}>Native gesture detection{'\n'}requires iOS Dev Client build</Text>
                </View>
                <View style={styles.overlay}>
                    <Text style={styles.debugText}>{debugInfo}</Text>
                    <Text style={styles.hintText}>
                        👆 Touch to aim • Tap to shoot
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing.sm,
        backgroundColor: colors.background,
    },
    cameraPanel: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.15)',
        backgroundColor: colors.grayDark,
    },
    camera: {
        flex: 1,
    },
    fallbackCamera: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fallbackEmoji: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    fallbackText: {
        ...typography.body,
        color: colors.gray,
        textAlign: 'center',
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.md,
        backgroundColor: 'rgba(0,0,0,0.6)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.gray,
    },
    statusAim: {
        backgroundColor: colors.aim,
    },
    statusShoot: {
        backgroundColor: colors.shoot,
    },
    statusText: {
        ...typography.body,
        color: colors.white,
    },
    tapHint: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: 8,
    },
    tapHintText: {
        fontSize: 10,
        fontWeight: '600',
        color: colors.grayLight,
        letterSpacing: 1,
    },
    debugText: {
        ...typography.body,
        color: colors.aim,
        textAlign: 'center',
    },
    hintText: {
        ...typography.caption,
        color: colors.grayLight,
        textAlign: 'center',
    },
});
