import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing } from '../../styles/theme';
import { useProgressStore } from '../../store/progressStore';
import { useGestureStore } from '../../store/gestureStore';
import { GameHUD } from '../../components/GameHUD';
import { GestureCamera } from '../../components/GestureCamera';
import { ShootIndicator } from '../../components/ShootIndicator';
import { AimReticle } from '../../components/AimReticle';
import { CrossPromoModal } from '../../components/CrossPromoModal';
import { playBackgroundMusic, stopBackgroundMusic } from '../../utils/audio';

const { width, height } = Dimensions.get('window');
const GAME_AREA_HEIGHT = height * 0.7;

// Movement pattern types
type MovementPattern = 'straight' | 'diagonal' | 'wave';

// Shape type with mutable x position and movement pattern
interface GameShapeType {
    id: string;
    type: 'circle' | 'square' | 'triangle';
    x: number;
    y: number;
    baseY: number;  // Original Y for wave calculation
    size: number;
    speed: number;  // pixels per frame
    direction: 'left' | 'right';
    points: number;
    spawnTime: number;
    waveAmplitude: number;  // How much it oscillates up/down
    waveFrequency: number;  // How fast it oscillates
    movementPattern: MovementPattern;  // Type of movement
    diagonalDirection: 1 | -1;  // For diagonal: up or down
}

type GamePhase = 'ready' | 'playing' | 'gameover';

export default function ShapeHuntGame() {
    const router = useRouter();
    const { setHighScore, incrementGamesPlayed, addShots, shouldShowPromo } = useProgressStore();
    const { gestureState, aimX, aimY } = useGestureStore();

    const [phase, setPhase] = useState<GamePhase>('ready');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [shapes, setShapes] = useState<GameShapeType[]>([]);
    const [level, setLevel] = useState(1);
    const [shotsCount, setShots] = useState(0);
    const [hitsCount, setHits] = useState(0);
    const [showPromo, setShowPromo] = useState(false);

    // Use refs for game loop to avoid stale closures
    const shapesRef = useRef<GameShapeType[]>([]);
    const livesRef = useRef(3);

    // Keep refs in sync
    useEffect(() => {
        shapesRef.current = shapes;
    }, [shapes]);

    useEffect(() => {
        livesRef.current = lives;
    }, [lives]);

    // Background music
    useEffect(() => {
        playBackgroundMusic('shapeHunt');
        return () => {
            stopBackgroundMusic();
        };
    }, []);

    // Main game loop - updates shape positions
    useEffect(() => {
        if (phase !== 'playing') return;

        const gameLoop = setInterval(() => {
            const now = Date.now();

            setShapes(prev => {
                const updated: GameShapeType[] = [];
                const escaped: string[] = [];

                for (const shape of prev) {
                    const elapsed = now - shape.spawnTime;
                    const baseXMove = shape.direction === 'left' ? -shape.speed : shape.speed;

                    let newX = shape.x;
                    let newY = shape.y;

                    // Apply movement based on pattern type
                    switch (shape.movementPattern) {
                        case 'straight':
                            // Just move horizontally
                            newX = shape.x + baseXMove;
                            newY = shape.baseY; // Stay at original Y
                            break;

                        case 'diagonal':
                            // Move diagonally - constant Y change
                            newX = shape.x + baseXMove;
                            const ySpeed = shape.speed * 0.5 * shape.diagonalDirection;
                            newY = shape.y + ySpeed;
                            // Bounce off top/bottom
                            if (newY < 60 || newY > GAME_AREA_HEIGHT - shape.size - 10) {
                                // Flip direction by updating shape
                                shape.diagonalDirection = (shape.diagonalDirection * -1) as 1 | -1;
                                newY = Math.max(60, Math.min(GAME_AREA_HEIGHT - shape.size - 10, newY));
                            }
                            break;

                        case 'wave':
                            // Sinusoidal S-curve movement
                            const wavePhase = elapsed * shape.waveFrequency;
                            const yOffset = Math.sin(wavePhase) * shape.waveAmplitude;
                            const xWobble = Math.cos(wavePhase) * (shape.speed * 0.3);
                            newX = shape.x + baseXMove + xWobble;
                            newY = Math.max(60, Math.min(GAME_AREA_HEIGHT - shape.size - 10, shape.baseY + yOffset));
                            break;
                    }

                    // Check if escaped off screen
                    if (shape.direction === 'left' && newX < -shape.size) {
                        escaped.push(shape.id);
                    } else if (shape.direction === 'right' && newX > width) {
                        escaped.push(shape.id);
                    } else {
                        updated.push({ ...shape, x: newX, y: newY });
                    }
                }

                // Handle escaped shapes (lose life)
                if (escaped.length > 0 && livesRef.current > 0) {
                    const newLives = livesRef.current - escaped.length;
                    if (newLives <= 0) {
                        setPhase('gameover');
                    }
                    setLives(Math.max(0, newLives));
                }

                return updated;
            });
        }, 16); // ~60 FPS

        return () => clearInterval(gameLoop);
    }, [phase]);

    // Spawn shapes at intervals - starts slow, gets faster
    useEffect(() => {
        if (phase !== 'playing') return;

        // Spawn rate decreases as level increases (starts at 4s, goes down to 1s at level 10)
        const baseSpawnInterval = level <= 2 ? 4000 : 3500;
        const spawnInterval = Math.max(baseSpawnInterval - level * 300, 1000);

        const spawn = () => {
            const types: Array<'circle' | 'square' | 'triangle'> = ['circle', 'square', 'triangle'];
            const type = types[Math.floor(Math.random() * types.length)];
            const direction: 'left' | 'right' = Math.random() > 0.5 ? 'left' : 'right';

            // Shapes get smaller as level increases (harder to hit)
            const baseSize = level <= 2 ? 80 : Math.max(50, 80 - level * 3);
            const sizeVariance = 20;
            const size = baseSize + Math.random() * sizeVariance;

            // Speed increases SIGNIFICANTLY with level
            // Level 1-2: 0.5-1.0 px/frame (very slow)
            // Level 5: 1.5-2.5 px/frame (medium)
            // Level 10: 3.5-4.5 px/frame (fast!)
            const baseSpeed = 0.5 + level * 0.3;
            const speed = baseSpeed + Math.random() * 0.5;

            // Wave movement parameters - SMOOTH gentle sine waves
            const baseY = Math.random() * (GAME_AREA_HEIGHT - size - 60) + 60;
            const waveAmplitude = 15 + Math.random() * 25; // 15-40 pixels (gentler)
            const waveFrequency = 0.001 + Math.random() * 0.002; // MUCH slower oscillation

            // Random movement pattern: straight (33%), diagonal (33%), wave (33%)
            const patterns: MovementPattern[] = ['straight', 'diagonal', 'wave'];
            const movementPattern = patterns[Math.floor(Math.random() * patterns.length)];
            const diagonalDirection: 1 | -1 = Math.random() > 0.5 ? 1 : -1;

            const newShape: GameShapeType = {
                id: Date.now().toString() + Math.random(),
                type,
                x: direction === 'left' ? width : -size,
                y: baseY,
                baseY,
                size,
                speed,
                direction,
                points: type === 'circle' ? 10 : type === 'square' ? 20 : 30,
                spawnTime: Date.now(),
                waveAmplitude,
                waveFrequency,
                movementPattern,
                diagonalDirection,
            };

            setShapes(prev => [...prev, newShape]);
        };

        // Spawn first shape immediately
        spawn();

        const interval = setInterval(spawn, spawnInterval);
        return () => clearInterval(interval);
    }, [phase, level]);

    // Handle shoot event with aim assist
    useEffect(() => {
        if (gestureState !== 'shoot' || phase !== 'playing') return;

        setShots(prev => prev + 1);

        const aimScreenX = aimX * width;
        const aimScreenY = aimY * GAME_AREA_HEIGHT;

        setShapes(prev => {
            let hit = false;
            const newShapes = prev.filter(shape => {
                // Use current shape.x (updated by game loop)
                const shapeCenter = {
                    x: shape.x + shape.size / 2,
                    y: shape.y + shape.size / 2
                };
                const distance = Math.sqrt(
                    Math.pow(aimScreenX - shapeCenter.x, 2) +
                    Math.pow(aimScreenY - shapeCenter.y, 2)
                );

                // Aim assist: 50% larger hit radius for very forgiving hits
                const hitRadius = shape.size * 1.5;
                if (distance < hitRadius) {
                    hit = true;
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setScore(s => s + shape.points);
                    setHits(h => h + 1);
                    return false;
                }
                return true;
            });

            if (!hit) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }

            return newShapes;
        });
    }, [gestureState, aimX, aimY, phase]);

    // Level progression - uses threshold, not exact match
    useEffect(() => {
        const expectedLevel = Math.min(Math.floor(score / 100) + 1, 10);
        if (expectedLevel > level) {
            setLevel(expectedLevel);
        }
    }, [score, level]);

    // Game over handling
    useEffect(() => {
        if (phase === 'gameover') {
            setHighScore('shape-hunt', score);
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
        setLives(3);
        setShapes([]);
        setLevel(1);
        setShots(0);
        setHits(0);
    };

    const goHome = () => {
        router.push('/');
    };

    // Get shape color
    const getShapeColor = (type: string) => {
        return type === 'circle' ? colors.shapeCircle :
            type === 'square' ? colors.shapeSquare :
                colors.shapeTriangle;
    };

    // Ready screen
    if (phase === 'ready') {
        return (
            <View style={styles.container}>
                <View style={styles.readyScreen}>
                    <Text style={styles.readyEmoji}>🎯</Text>
                    <Text style={styles.readyTitle}>Shape Hunt</Text>
                    <Text style={styles.readyText}>
                        Shoot the shapes before they escape!{'\n'}
                        ● = 10 pts  ■ = 20 pts  ▲ = 30 pts
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
                    <Text style={styles.readyEmoji}>💥</Text>
                    <Text style={styles.readyTitle}>Game Over!</Text>
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
            <View style={styles.gameArea}>
                <GameHUD score={score} lives={lives} level={level} />

                {/* Shapes - rendered with direct position styling */}
                {shapes.map(shape => {
                    const shapeColor = getShapeColor(shape.type);
                    return (
                        <View
                            key={shape.id}
                            style={[
                                styles.shape,
                                {
                                    left: shape.x,
                                    top: shape.y,
                                    width: shape.size,
                                    height: shape.size,
                                    backgroundColor: shape.type !== 'triangle' ? shapeColor : 'transparent',
                                    borderRadius: shape.type === 'circle' ? shape.size / 2 : 4,
                                    // Triangle using borders
                                    borderLeftWidth: shape.type === 'triangle' ? shape.size / 2 : 0,
                                    borderRightWidth: shape.type === 'triangle' ? shape.size / 2 : 0,
                                    borderBottomWidth: shape.type === 'triangle' ? shape.size : 0,
                                    borderLeftColor: 'transparent',
                                    borderRightColor: 'transparent',
                                    borderBottomColor: shape.type === 'triangle' ? shapeColor : 'transparent',
                                },
                            ]}
                        />
                    );
                })}

                {/* Aim reticle - always visible when aiming */}
                <AimReticle />

                <ShootIndicator />
            </View>

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
        maxHeight: height * 0.3,
    },
    shape: {
        position: 'absolute',
        // Add glow effect for visibility
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 5,
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
