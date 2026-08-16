import { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useGestureStore } from '../store/gestureStore';
import { colors } from '../styles/theme';

const { width, height } = Dimensions.get('window');
const GAME_AREA_HEIGHT = height * 0.7; // Match game area height

export function ShootIndicator() {
    const { gestureState, aimX, aimY } = useGestureStore();
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (gestureState === 'shoot') {
            scale.value = 0;
            opacity.value = 1;
            scale.value = withSequence(
                withTiming(1.5, { duration: 100 }),
                withTiming(2, { duration: 150 })
            );
            opacity.value = withSequence(
                withTiming(1, { duration: 100 }),
                withTiming(0, { duration: 150 })
            );
        }
    }, [gestureState]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                styles.container,
                animatedStyle,
                {
                    left: aimX * width - 30,
                    top: aimY * GAME_AREA_HEIGHT - 30,
                },
            ]}
        >
            <View style={styles.flash} />
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 200,
    },
    flash: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.shoot,
        shadowColor: colors.shoot,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 20,
    },
});
