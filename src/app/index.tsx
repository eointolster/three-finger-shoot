import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing } from '../styles/theme';
import { useProgressStore } from '../store/progressStore';
import { GameMode } from '../types';
import { playBackgroundMusic, stopBackgroundMusic } from '../utils/audio';

const { width, height } = Dimensions.get('window');

interface GameCardProps {
    title: string;
    description: string;
    emoji: string;
    mode: GameMode;
    highScore: number;
    gradientColors: [string, string];
}

function GameCard({ title, description, emoji, mode, highScore, gradientColors }: GameCardProps) {
    const router = useRouter();

    const handlePress = () => {
        router.push(`/games/${mode}`);
    };

    return (
        <TouchableOpacity style={styles.cardContainer} onPress={handlePress} activeOpacity={0.8}>
            <LinearGradient colors={gradientColors} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.cardEmoji}>{emoji}</Text>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardDescription}>{description}</Text>
                {highScore > 0 && (
                    <View style={styles.highScoreBadge}>
                        <Text style={styles.highScoreText}>Best: {highScore}</Text>
                    </View>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
}

export default function HomeScreen() {
    const router = useRouter();
    const { highScores, getAccuracy, totalGamesPlayed } = useProgressStore();

    // Play main menu background music
    useEffect(() => {
        playBackgroundMusic('mainMenu');
        return () => {
            stopBackgroundMusic();
        };
    }, []);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => router.push('/settings')}
                >
                    <Text style={styles.settingsIcon}>⚙️</Text>
                </TouchableOpacity>
                <Text style={styles.logo}>✋🎯</Text>
                <Text style={styles.title}>THREE FINGER SHOOT</Text>
                <Text style={styles.subtitle}>Gesture-controlled arcade action</Text>
            </View>

            {/* Stats */}
            {totalGamesPlayed > 0 && (
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{totalGamesPlayed}</Text>
                        <Text style={styles.statLabel}>Games</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{getAccuracy()}%</Text>
                        <Text style={styles.statLabel}>Accuracy</Text>
                    </View>
                </View>
            )}

            {/* Game Mode Cards */}
            <View style={styles.cardsContainer}>
                <GameCard
                    title="Shape Hunt"
                    description="Blast shapes before they escape!"
                    emoji="🎯"
                    mode="shape-hunt"
                    highScore={highScores['shape-hunt']}
                    gradientColors={['#e94560', '#c73e54']}
                />
                <GameCard
                    title="Aquatic Obstacle Swim"
                    description="Swim through the ocean depths!"
                    emoji="🦑"
                    mode="flappy-shooter"
                    highScore={highScores['flappy-shooter']}
                    gradientColors={['#4ecdc4', '#2ab7ca']}
                />
                <GameCard
                    title="Fast Paced Carnival"
                    description="Test your aim and speed!"
                    emoji="🎪"
                    mode="target-practice"
                    highScore={highScores['target-practice']}
                    gradientColors={['#ffe66d', '#f0c000']}
                />
            </View>

            {/* Instructions */}
            <View style={styles.instructions}>
                <Text style={styles.instructionText}>
                    ✋ Open hand to aim
                </Text>
                <Text style={styles.instructionText}>
                    ✊ Make a fist to shoot!
                </Text>
            </View>

            {/* Bottom Links */}
            <View style={styles.bottomLinks}>
                <TouchableOpacity onPress={() => router.push('/settings')} style={styles.bottomLink}>
                    <Text style={styles.bottomLinkText}>⚙️ Settings</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/privacy')} style={styles.bottomLink}>
                    <Text style={styles.bottomLinkText}>🔒 Privacy Policy</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: 60,
        paddingHorizontal: spacing.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.lg,
        position: 'relative',
    },
    settingsButton: {
        position: 'absolute',
        top: 0,
        right: 0,
        padding: spacing.sm,
    },
    settingsIcon: {
        fontSize: 24,
    },
    logo: {
        fontSize: 48,
        marginBottom: spacing.sm,
    },
    title: {
        ...typography.h1,
        letterSpacing: 4,
    },
    subtitle: {
        ...typography.caption,
        marginTop: spacing.xs,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.xl,
        marginBottom: spacing.lg,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        ...typography.h2,
        color: colors.primary,
    },
    statLabel: {
        ...typography.caption,
    },
    cardsContainer: {
        flex: 1,
        gap: spacing.md,
    },
    cardContainer: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    card: {
        flex: 1,
        padding: spacing.lg,
        justifyContent: 'center',
    },
    cardEmoji: {
        fontSize: 36,
        marginBottom: spacing.xs,
    },
    cardTitle: {
        ...typography.h3,
        marginBottom: spacing.xs,
    },
    cardDescription: {
        ...typography.caption,
        color: colors.white,
        opacity: 0.9,
    },
    highScoreBadge: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: 8,
    },
    highScoreText: {
        ...typography.caption,
        color: colors.white,
        fontWeight: 'bold',
    },
    instructions: {
        paddingVertical: spacing.lg,
        alignItems: 'center',
        gap: spacing.xs,
    },
    instructionText: {
        ...typography.body,
        opacity: 0.7,
    },
    bottomLinks: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.xl,
        paddingVertical: spacing.md,
    },
    bottomLink: {
        paddingVertical: spacing.sm,
    },
    bottomLinkText: {
        ...typography.caption,
        color: colors.gray,
    },
});
