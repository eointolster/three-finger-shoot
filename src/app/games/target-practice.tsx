import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { colors, typography, spacing } from '../../styles/theme';
import { useProgressStore } from '../../store/progressStore';
import { useGestureStore } from '../../store/gestureStore';
import { Target } from '../../types';
import { GameHUD } from '../../components/GameHUD';
import { GestureCamera } from '../../components/GestureCamera';
import { ShootIndicator } from '../../components/ShootIndicator';
import { AimReticle } from '../../components/AimReticle';
import { CrossPromoModal } from '../../components/CrossPromoModal';
import { playBackgroundMusic, stopBackgroundMusic } from '../../utils/audio';

const { width, height } = Dimensions.get('window');
const GAME_AREA_HEIGHT = height * 0.7; // Increased for more game space
const ROUND_TIME = 30; // seconds

interface AnimatedTargetProps {
    target: Target;
    onHit: (id: string) => void;
    aimX: number;
    aimY: number;
    isShoot: boolean;
}

function AnimatedTarget({ target, onHit, aimX, aimY, isShoot }: AnimatedTargetProps) {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(1);

    useEffect(() => {
        scale.value = withSpring(1, { damping: 10 });
    }, []);

    // Check for hit when shoot happens - with aim assist
    useEffect(() => {
        if (!isShoot) return;

        const aimScreenX = aimX * width;
        const aimScreenY = aimY * GAME_AREA_HEIGHT;
        const distance = Math.sqrt(
            Math.pow(aimScreenX - target.x, 2) + Math.pow(aimScreenY - target.y, 2)
        );

        // Aim assist: 40% larger hit radius for targets
        const hitRadius = target.size * 1.4;
        if (distance < hitRadius) {
            // Hit!
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            scale.value = withSequence(
                withSpring(1.3, { damping: 5 }),
                withTiming(0, { duration: 200 })
            );
            opacity.value = withTiming(0, { duration: 200 });
            setTimeout(() => onHit(target.id), 200);
        }
    }, [isShoot]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const healthPercent = target.hitPoints / target.maxHitPoints;

    return (
        <Animated.View
            style={[
                styles.target,
                animatedStyle,
                {
                    left: target.x - target.size,
                    top: target.y - target.size,
                    width: target.size * 2,
                    height: target.size * 2,
                    borderRadius: target.size,
                },
            ]}
        >
            <View style={styles.targetInner}>
                <View style={[styles.targetCenter, { opacity: healthPercent }]} />
            </View>
        </Animated.View>
    );
}

type GamePhase = 'ready' | 'playing' | 'gameover';

export default function TargetPracticeGame() {
    const router = useRouter();
    const { setHighScore, incrementGamesPlayed, addShots, shouldShowPromo } = useProgressStore();
    const { gestureState, aimX, aimY } = useGestureStore();

    const [phase, setPhase] = useState<GamePhase>('ready');
    const [score, setScore] = useState(0);
    const [targets, setTargets] = useState<Target[]>([]);
    const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
    const [combo, setCombo] = useState(0);
    const [shotsCount, setShots] = useState(0);
    const [hitsCount, setHits] = useState(0);
    const [isShoot, setIsShoot] = useState(false);
    const [showPromo, setShowPromo] = useState(false);

    // Background music
    useEffect(() => {
        playBackgroundMusic('carnival');
        return () => {
            stopBackgroundMusic();
        };
    }, []);

    // Timer
    useEffect(() => {
        if (phase !== 'playing') return;

        const timer = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    setPhase('gameover');
                    return 0;
                }
                return t - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [phase]);

    // Spawn targets - SLOWER
    useEffect(() => {
        if (phase !== 'playing') return;

        const spawnTarget = () => {
            // Much larger targets for easier hitting
            const size = 50 + Math.random() * 40;
            const newTarget: Target = {
                id: Date.now().toString(),
                x: size + Math.random() * (width - size * 2),
                y: size + Math.random() * (GAME_AREA_HEIGHT - size * 2),
                size,
                hitPoints: 1,
                maxHitPoints: 1,
                expiresAt: Date.now() + 8000 + Math.random() * 4000, // Much longer (8-12 sec)
            };
            setTargets(prev => [...prev.slice(-5), newTarget]); // Max 6 targets
        };

        // Initial spawn
        spawnTarget();

        // Spawn every 3 seconds
        const interval = setInterval(spawnTarget, 3000);
        return () => clearInterval(interval);
    }, [phase]);

    // Remove expired targets
    useEffect(() => {
        if (phase !== 'playing') return;

        const checkExpired = setInterval(() => {
            const now = Date.now();
            setTargets(prev => {
                const expired = prev.filter(t => t.expiresAt < now);
                if (expired.length > 0) {
                    setCombo(0); // Reset combo on miss/expire
                }
                return prev.filter(t => t.expiresAt >= now);
            });
        }, 100);

        return () => clearInterval(checkExpired);
    }, [phase]);

    // Handle shoot
    useEffect(() => {
        if (gestureState !== 'shoot' || phase !== 'playing') return;

        setShots(prev => prev + 1);
        setIsShoot(true);
        setTimeout(() => setIsShoot(false), 100);
    }, [gestureState, phase]);

    // Handle target hit
    const handleTargetHit = useCallback((id: string) => {
        setTargets(prev => prev.filter(t => t.id !== id));
        setHits(h => h + 1);
        setCombo(c => {
            const newCombo = c + 1;
            // Score with combo multiplier
            const points = 10 * Math.min(newCombo, 5);
            setScore(s => s + points);
            return newCombo;
        });
    }, []);

    // Game over handling
    useEffect(() => {
        if (phase === 'gameover') {
            setHighScore('target-practice', score);
            incrementGamesPlayed();
            addShots(shotsCount, hitsCount);
            // Check if we should show promo
            if (shouldShowPromo()) {
                setShowPromo(true);
            }
        }
    }, [phase]);

    const startGame = () => {
        setPhase('playing');
        setScore(0);
        setTargets([]);
        setTimeLeft(ROUND_TIME);
        setCombo(0);
        setShots(0);
        setHits(0);
    };

    const goHome = () => {
        router.push('/');
    };

    // Ready screen
    if (phase === 'ready') {
        return (
            <View style={styles.container}>
                <View style={styles.readyScreen}>
                    <Text style={styles.readyEmoji}>🎪</Text>
                    <Text style={styles.readyTitle}>Fast Paced Carnival</Text>
                    <Text style={styles.readyText}>
                        Hit as many targets as you can!{'\n'}
                        Build combos for bonus points.{'\n'}
                        You have {ROUND_TIME} seconds.
                    </Text>
                    <TouchableOpacity style={styles.startButton} onPress={startGame}>
                        <Text style={styles.startButtonText}>START</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.backButton} onPress={goHome}>
                        <Text style={styles.backButtonText}>← Back to Menu</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Game over screen
    if (phase === 'gameover') {
        return (
            <View style={styles.container}>
                <View style={styles.readyScreen}>
                    <Text style={styles.readyEmoji}>⏱️</Text>
                    <Text style={styles.readyTitle}>Time's Up!</Text>
                    <Text style={styles.scoreText}>Score: {score}</Text>
                    <Text style={styles.statsText}>
                        Accuracy: {shotsCount > 0 ? Math.round((hitsCount / shotsCount) * 100) : 0}%
                    </Text>
                    <TouchableOpacity style={styles.startButton} onPress={startGame}>
                        <Text style={styles.startButtonText}>PLAY AGAIN</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.backButton} onPress={goHome}>
                        <Text style={styles.backButtonText}>← Back to Menu</Text>
                    </TouchableOpacity>
                </View>

                {/* Cross-promo modal */}
                <CrossPromoModal
                    visible={showPromo}
                    onClose={() => setShowPromo(false)}
                />
            </View>
        );
    }

    // Playing screen
    return (
        <View style={styles.container}>
            {/* Game area */}
            <View style={styles.gameArea}>
                {/* HUD */}
                <View style={styles.hudRow}>
                    <Text style={styles.hudScore}>{score}</Text>
                    <Text style={styles.hudTimer}>{timeLeft}s</Text>
                    {combo > 1 && <Text style={styles.hudCombo}>x{combo}</Text>}
                </View>

                {/* Targets */}
                {targets.map(target => (
                    <AnimatedTarget
                        key={target.id}
                        target={target}
                        onHit={handleTargetHit}
                        aimX={aimX}
                        aimY={aimY}
                        isShoot={isShoot}
                    />
                ))}

                {/* Aim reticle - always visible when aiming */}
                <AimReticle />

                <ShootIndicator />
            </View>

            {/* Camera area */}
            <View style={styles.cameraArea}>
                <GestureCamera />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    gameArea: {
        height: GAME_AREA_HEIGHT,
        backgroundColor: colors.backgroundLight,
        overflow: 'hidden',
    },
    cameraArea: {
        flex: 1,
        backgroundColor: colors.grayDark,
        maxHeight: height * 0.3, // Reduced camera for more game space
    },
    hudRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        zIndex: 100,
    },
    hudScore: {
        ...typography.h2,
        color: colors.white,
    },
    hudTimer: {
        ...typography.h2,
        color: colors.primary,
    },
    hudCombo: {
        ...typography.h3,
        color: colors.hit,
    },
    target: {
        position: 'absolute',
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: colors.white,
    },
    targetInner: {
        width: '60%',
        height: '60%',
        borderRadius: 100,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    targetCenter: {
        width: '50%',
        height: '50%',
        borderRadius: 100,
        backgroundColor: colors.primary,
    },
    aimIndicator: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: colors.aim,
        backgroundColor: 'rgba(0, 255, 136, 0.2)',
    },
    readyScreen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    readyEmoji: {
        fontSize: 64,
        marginBottom: spacing.lg,
    },
    readyTitle: {
        ...typography.h1,
        marginBottom: spacing.md,
    },
    readyText: {
        ...typography.body,
        textAlign: 'center',
        opacity: 0.8,
        marginBottom: spacing.xl,
    },
    scoreText: {
        ...typography.h2,
        color: colors.primary,
        marginBottom: spacing.sm,
    },
    statsText: {
        ...typography.body,
        marginBottom: spacing.xl,
    },
    startButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.md,
        borderRadius: 12,
        marginBottom: spacing.md,
    },
    startButtonText: {
        ...typography.h3,
        color: colors.white,
    },
    backButton: {
        paddingVertical: spacing.sm,
    },
    backButtonText: {
        ...typography.body,
        color: colors.gray,
    },
});
