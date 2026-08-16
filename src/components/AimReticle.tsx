import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useGestureStore } from '../store/gestureStore';
import { colors } from '../styles/theme';

const { width, height } = Dimensions.get('window');
const GAME_AREA_HEIGHT = height * 0.7;

/**
 * AimReticle - Always visible aim indicator that follows hand position
 * Includes a pulsing animation and crosshair design
 */
export function AimReticle() {
    const { gestureState, aimX, aimY } = useGestureStore();

    // Pulsing animation
    const pulse = useSharedValue(1);

    React.useEffect(() => {
        pulse.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: 500 }),
                withTiming(1, { duration: 500 })
            ),
            -1,
            true
        );
    }, []);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
    }));

    // Only show when aiming or in shoot state
    const isVisible = gestureState === 'aim' || gestureState === 'shoot';

    if (!isVisible) {
        return null;
    }

    return (
        <View
            style={[
                styles.container,
                {
                    left: aimX * width - 25,
                    top: aimY * GAME_AREA_HEIGHT - 25,
                },
            ]}
            pointerEvents="none"
        >
            <Animated.View style={[styles.reticle, pulseStyle]}>
                {/* Crosshair lines */}
                <View style={styles.horizontalLine} />
                <View style={styles.verticalLine} />
                {/* Center dot */}
                <View style={styles.centerDot} />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    reticle: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    horizontalLine: {
        position: 'absolute',
        width: 40,
        height: 2,
        backgroundColor: colors.aim,
        borderRadius: 1,
        shadowColor: colors.aim,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },
    verticalLine: {
        position: 'absolute',
        width: 2,
        height: 40,
        backgroundColor: colors.aim,
        borderRadius: 1,
        shadowColor: colors.aim,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },
    centerDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.shoot,
        shadowColor: colors.shoot,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 6,
    },
});
