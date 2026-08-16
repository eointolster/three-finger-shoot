import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../styles/theme';

interface GameHUDProps {
    score: number;
    lives?: number;
    level?: number;
    timer?: number;
    combo?: number;
}

export function GameHUD({ score, lives, level, timer, combo }: GameHUDProps) {
    return (
        <View style={styles.container}>
            <View style={styles.left}>
                <Text style={styles.score}>{score}</Text>
                {level !== undefined && (
                    <Text style={styles.level}>Lvl {level}</Text>
                )}
            </View>

            <View style={styles.right}>
                {lives !== undefined && (
                    <Text style={styles.lives}>
                        {'♥'.repeat(lives)}{'♡'.repeat(Math.max(0, 3 - lives))}
                    </Text>
                )}
                {timer !== undefined && (
                    <Text style={styles.timer}>{timer}s</Text>
                )}
                {combo !== undefined && combo > 1 && (
                    <Text style={styles.combo}>x{combo}</Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        zIndex: 100,
    },
    left: {
        alignItems: 'flex-start',
    },
    right: {
        alignItems: 'flex-end',
    },
    score: {
        fontSize: 36,
        fontWeight: 'bold',
        color: colors.white,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    level: {
        ...typography.caption,
        color: colors.grayLight,
    },
    lives: {
        fontSize: 24,
        color: colors.primary,
    },
    timer: {
        ...typography.h3,
        color: colors.primary,
    },
    combo: {
        ...typography.h3,
        color: colors.hit,
        marginTop: spacing.xs,
    },
});
