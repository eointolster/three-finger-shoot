import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { colors, typography, spacing } from '../../styles/theme';
import { useProgressStore } from '../../store/progressStore';
import { useGestureStore } from '../../store/gestureStore';
import { GestureCamera } from '../../components/GestureCamera';
import { CrossPromoModal } from '../../components/CrossPromoModal';
import { playBackgroundMusic, stopBackgroundMusic } from '../../utils/audio';

const { width, height } = Dimensions.get('window');
const GAME_AREA_HEIGHT = height * 0.7;
const SQUID_SIZE = 50;
const GRAVITY = 0.08;          // VERY slow fall - almost floating
const JUMP_VELOCITY = -3;      // Gentle swim up
const PIPE_WIDTH = 50;
const PIPE_GAP = 280;          // HUGE gap - very easy to pass
const PIPE_SPEED = 1;          // Very slow pipes

// Bubble animation
interface Bubble {
    id: string;
    x: number;
    y: number;
    size: number;
    speed: number;
}

interface Pipe {
    id: string;
    x: number;
    gapY: number;
    passed: boolean;
}

type GamePhase = 'ready' | 'countdown' | 'playing' | 'gameover';

export default function FlappyShooterGame() {
    const router = useRouter();
    const { setHighScore, incrementGamesPlayed, shouldShowPromo } = useProgressStore();
    const { gestureState } = useGestureStore();

    const [phase, setPhase] = useState<GamePhase>('ready');
    const [countdownNumber, setCountdownNumber] = useState(3);
    const [squidY, setSquidY] = useState(GAME_AREA_HEIGHT / 2);
    const [velocity, setVelocity] = useState(0);
    const [pipes, setPipes] = useState<Pipe[]>([]);
    const [bubbles, setBubbles] = useState<Bubble[]>([]);
    const [score, setScore] = useState(0);
    const [showPromo, setShowPromo] = useState(false);

    // Prevent multiple gameover calls (crash fix)
    const isGameOverRef = useRef(false);
    const [lastShootTime, setLastShootTime] = useState(0);

    // Squid wobble animation
    const squidWobble = useSharedValue(0);
    const squidAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { rotate: `${squidWobble.value}deg` },
            { scale: 1 + Math.sin(squidWobble.value * 0.1) * 0.05 },
        ],
    }));

    // Start squid wobble
    useEffect(() => {
        squidWobble.value = withRepeat(
            withSequence(
                withTiming(10, { duration: 500, easing: Easing.inOut(Easing.ease) }),
                withTiming(-10, { duration: 500, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    // Background music - random pick between two aquatic tracks
    useEffect(() => {
        playBackgroundMusic('aquaticRandom');
        return () => {
            stopBackgroundMusic();
        };
    }, []);

    // Spawn bubbles
    useEffect(() => {
        const bubbleInterval = setInterval(() => {
            setBubbles(prev => [
                ...prev.filter(b => b.y > -50),
                {
                    id: Date.now().toString(),
                    x: Math.random() * width,
                    y: GAME_AREA_HEIGHT + 20,
                    size: 10 + Math.random() * 20,
                    speed: 1 + Math.random() * 2,
                },
            ]);
        }, 300);

        return () => clearInterval(bubbleInterval);
    }, []);

    // Move bubbles
    useEffect(() => {
        const bubbleMove = setInterval(() => {
            setBubbles(prev =>
                prev.map(b => ({
                    ...b,
                    y: b.y - b.speed,
                    x: b.x + Math.sin(b.y * 0.02) * 0.5,
                }))
            );
        }, 50);

        return () => clearInterval(bubbleMove);
    }, []);

    // Game loop - uses refs to avoid stale closures
    const velocityRef = useRef(velocity);
    const squidYRef = useRef(squidY);

    useEffect(() => {
        velocityRef.current = velocity;
    }, [velocity]);

    useEffect(() => {
        squidYRef.current = squidY;
    }, [squidY]);

    useEffect(() => {
        if (phase !== 'playing') return;

        const gameLoop = setInterval(() => {
            // Check if already game over
            if (isGameOverRef.current) return;

            // Apply gravity and update velocity
            setVelocity(v => {
                const newV = v + GRAVITY;
                velocityRef.current = newV;
                return newV;
            });

            // Update position using ref for current velocity
            setSquidY(y => {
                if (isGameOverRef.current) return y;
                const newY = y + velocityRef.current;
                squidYRef.current = newY;
                // Check bounds
                if (newY < 0 || newY > GAME_AREA_HEIGHT - SQUID_SIZE) {
                    if (!isGameOverRef.current) {
                        isGameOverRef.current = true;
                        setPhase('gameover');
                    }
                    return y;
                }
                return newY;
            });

            // Move pipes
            setPipes(prev => {
                return prev
                    .map(pipe => ({
                        ...pipe,
                        x: pipe.x - PIPE_SPEED,
                    }))
                    .filter(pipe => pipe.x > -PIPE_WIDTH);
            });

            // Check for score (passed pipes)
            setPipes(prev => {
                return prev.map(pipe => {
                    if (!pipe.passed && pipe.x + PIPE_WIDTH < width / 2 - SQUID_SIZE / 2) {
                        setScore(s => s + 1);
                        return { ...pipe, passed: true };
                    }
                    return pipe;
                });
            });

            // Check collision with pipes using squidYRef for current position
            setPipes(prev => {
                const currentSquidY = squidYRef.current;
                for (const pipe of prev) {
                    const squidLeft = width / 2 - SQUID_SIZE / 2;
                    const squidRight = squidLeft + SQUID_SIZE;
                    const pipeLeft = pipe.x;
                    const pipeRight = pipe.x + PIPE_WIDTH;

                    // Horizontal overlap
                    if (squidRight > pipeLeft && squidLeft < pipeRight) {
                        // Vertical check
                        const gapTop = pipe.gapY;
                        const gapBottom = pipe.gapY + PIPE_GAP;

                        if (currentSquidY < gapTop || currentSquidY + SQUID_SIZE > gapBottom) {
                            if (!isGameOverRef.current) {
                                isGameOverRef.current = true;
                                setPhase('gameover');
                            }
                            break;
                        }
                    }
                }
                return prev;
            });
        }, 16); // ~60 FPS

        return () => clearInterval(gameLoop);
    }, [phase]); // Removed velocity dep - using ref instead

    // Spawn pipes (slower rate for easier gameplay)
    useEffect(() => {
        if (phase !== 'playing') return;

        const spawnInterval = setInterval(() => {
            const gapY = Math.random() * (GAME_AREA_HEIGHT - PIPE_GAP - 150) + 75;
            setPipes(prev => [
                ...prev,
                {
                    id: Date.now().toString(),
                    x: width,
                    gapY,
                    passed: false,
                },
            ]);
        }, 4000); // Much slower pipe spawning - every 4 seconds

        return () => clearInterval(spawnInterval);
    }, [phase]);

    // Handle shoot = swim up
    useEffect(() => {
        if (phase !== 'playing') return;
        if (gestureState !== 'shoot') return;

        const now = Date.now();
        if (now - lastShootTime < 150) return; // Faster response
        setLastShootTime(now);

        setVelocity(JUMP_VELOCITY);
    }, [gestureState, phase, lastShootTime]);

    // Game over handling
    useEffect(() => {
        if (phase === 'gameover') {
            setHighScore('flappy-shooter', score);
            incrementGamesPlayed();
            // Check if we should show promo
            if (shouldShowPromo()) {
                setShowPromo(true);
            }
        }
    }, [phase]);

    const startGame = () => {
        // Start countdown phase
        setPhase('countdown');
        setCountdownNumber(3);
        isGameOverRef.current = false;

        // Countdown timer
        let count = 3;
        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                setCountdownNumber(count);
            } else {
                clearInterval(countdownInterval);
                // Start actual game
                setSquidY(GAME_AREA_HEIGHT / 2);
                setVelocity(0);
                setPipes([]);
                setScore(0);
                setPhase('playing');
            }
        }, 1000);
    };

    const goHome = () => {
        router.push('/');
    };

    // Ready screen
    if (phase === 'ready') {
        return (
            <View style={styles.container}>
                <View style={styles.readyScreen}>
                    <Text style={styles.readyEmoji}>🦑</Text>
                    <Text style={styles.readyTitle}>Aquatic Obstacle Swim</Text>
                    <Text style={styles.readyText}>
                        Make a fist to swim up!{'\n'}
                        Navigate through the coral reef.
                    </Text>
                    <TouchableOpacity style={styles.startButton} onPress={startGame}>
                        <Text style={styles.startButtonText}>START</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.backButton} onPress={goHome}>
                        <Text style={styles.backButtonText}>← Back to Menu</Text>
                    </TouchableOpacity>
                </View>
                {/* Background bubbles */}
                {bubbles.map(bubble => (
                    <View
                        key={bubble.id}
                        style={[
                            styles.bubble,
                            {
                                left: bubble.x,
                                top: bubble.y,
                                width: bubble.size,
                                height: bubble.size,
                                borderRadius: bubble.size / 2,
                            },
                        ]}
                    />
                ))}
            </View>
        );
    }

    // Countdown screen with direction arrow
    if (phase === 'countdown') {
        const countdownColors = ['#FF6B6B', '#FFE66D', '#4ECDC4']; // Red, Yellow, Green
        const countdownColor = countdownColors[3 - countdownNumber] || '#4ECDC4';

        return (
            <View style={styles.container}>
                <View style={[styles.gameArea, styles.underwaterBg]}>
                    {/* Direction arrow showing obstacles coming from right */}
                    <View style={styles.directionContainer}>
                        <Text style={styles.directionArrow}>⬅️</Text>
                        <Text style={styles.directionText}>Obstacles coming!</Text>
                    </View>

                    {/* Countdown number */}
                    <View style={styles.countdownContainer}>
                        <Text style={[styles.countdownNumber, { color: countdownColor }]}>
                            {countdownNumber}
                        </Text>
                        <Text style={styles.countdownHint}>Get Ready!</Text>
                    </View>

                    {/* Preview squid */}
                    <View style={[styles.squid, { top: GAME_AREA_HEIGHT / 2 }]}>
                        <Text style={styles.squidEmoji}>🦑</Text>
                    </View>

                    {/* Preview pipe coming */}
                    <View style={[styles.pipe, styles.pipeTop, { left: width - 80, height: 100 }]} />
                    <View style={[styles.pipe, styles.pipeBottom, { left: width - 80, height: 100, bottom: 0 }]} />
                </View>

                <View style={styles.cameraArea}>
                    <GestureCamera />
                </View>
            </View>
        );
    }

    // Game over screen
    if (phase === 'gameover') {
        return (
            <View style={styles.container}>
                <View style={styles.readyScreen}>
                    <Text style={styles.readyEmoji}>🌊</Text>
                    <Text style={styles.readyTitle}>Game Over!</Text>
                    <Text style={styles.scoreText}>Score: {score}</Text>
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
            {/* Game area - underwater theme */}
            <View style={styles.gameArea}>
                {/* Bubbles */}
                {bubbles.map(bubble => (
                    <View
                        key={bubble.id}
                        style={[
                            styles.bubble,
                            {
                                left: bubble.x,
                                top: bubble.y,
                                width: bubble.size,
                                height: bubble.size,
                                borderRadius: bubble.size / 2,
                            },
                        ]}
                    />
                ))}

                {/* Score */}
                <View style={styles.scoreContainer}>
                    <Text style={styles.liveScore}>{score}</Text>
                </View>

                {/* Coral/Seaweed pipes */}
                {pipes.map(pipe => (
                    <View key={pipe.id}>
                        {/* Top coral */}
                        <View
                            style={[
                                styles.coralTop,
                                {
                                    left: pipe.x,
                                    top: 0,
                                    height: pipe.gapY,
                                },
                            ]}
                        />
                        {/* Bottom coral */}
                        <View
                            style={[
                                styles.coralBottom,
                                {
                                    left: pipe.x,
                                    top: pipe.gapY + PIPE_GAP,
                                    height: GAME_AREA_HEIGHT - pipe.gapY - PIPE_GAP,
                                },
                            ]}
                        />
                    </View>
                ))}

                {/* Squid */}
                <Animated.View
                    style={[
                        styles.squid,
                        squidAnimatedStyle,
                        { top: squidY, left: width / 2 - SQUID_SIZE / 2 },
                    ]}
                >
                    <Text style={styles.squidEmoji}>🦑</Text>
                </Animated.View>
            </View>

            {/* Camera area - reduced size */}
            <View style={styles.cameraArea}>
                <GestureCamera />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a1628', // Deep ocean blue
    },
    gameArea: {
        height: GAME_AREA_HEIGHT,
        backgroundColor: '#0d2137', // Dark ocean
        overflow: 'hidden',
    },
    cameraArea: {
        flex: 1,
        backgroundColor: colors.grayDark,
        maxHeight: height * 0.3, // Reduced camera area
    },
    bubble: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    scoreContainer: {
        position: 'absolute',
        top: spacing.xl,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 100,
    },
    liveScore: {
        fontSize: 64,
        fontWeight: 'bold',
        color: '#7fdbff',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    coralTop: {
        position: 'absolute',
        width: PIPE_WIDTH,
        backgroundColor: '#ff6b6b',
        borderRadius: 8,
        borderWidth: 3,
        borderColor: '#c44569',
    },
    coralBottom: {
        position: 'absolute',
        width: PIPE_WIDTH,
        backgroundColor: '#26de81',
        borderRadius: 8,
        borderWidth: 3,
        borderColor: '#20bf6b',
    },
    squid: {
        position: 'absolute',
        width: SQUID_SIZE,
        height: SQUID_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
    },
    squidEmoji: {
        fontSize: 40,
    },
    readyScreen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        zIndex: 10,
    },
    readyEmoji: {
        fontSize: 72,
        marginBottom: spacing.lg,
    },
    readyTitle: {
        ...typography.h1,
        color: '#7fdbff',
        marginBottom: spacing.md,
    },
    readyText: {
        ...typography.body,
        textAlign: 'center',
        opacity: 0.8,
        marginBottom: spacing.xl,
        color: '#aaa',
    },
    scoreText: {
        ...typography.h2,
        color: '#7fdbff',
        marginBottom: spacing.xl,
    },
    startButton: {
        backgroundColor: '#7fdbff',
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.md,
        borderRadius: 12,
        marginBottom: spacing.md,
    },
    startButtonText: {
        ...typography.h3,
        color: '#0a1628',
    },
    backButton: {
        paddingVertical: spacing.sm,
    },
    backButtonText: {
        ...typography.body,
        color: colors.gray,
    },
    // Countdown styles
    underwaterBg: {
        backgroundColor: '#0a1628',
    },
    directionContainer: {
        position: 'absolute',
        top: 60,
        right: 30,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 12,
    },
    directionArrow: {
        fontSize: 32,
        marginRight: spacing.sm,
    },
    directionText: {
        ...typography.body,
        color: '#FFE66D',
        fontWeight: 'bold',
    },
    countdownContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    countdownNumber: {
        fontSize: 120,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 8,
    },
    countdownHint: {
        ...typography.h2,
        color: '#fff',
        marginTop: spacing.md,
    },
    pipe: {
        position: 'absolute',
        width: PIPE_WIDTH,
        backgroundColor: '#ff6b81',
        borderRadius: 8,
    },
    pipeTop: {
        top: 0,
    },
    pipeBottom: {
        bottom: 0,
    },
});
