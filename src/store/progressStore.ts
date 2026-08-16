import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameMode } from '../types';

interface ProgressState {
    // Hydration tracking (per IOS_APP_LEARNINGS)
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;

    // High scores per game mode
    highScores: Record<GameMode, number>;
    setHighScore: (mode: GameMode, score: number) => void;

    // Total stats
    totalGamesPlayed: number;
    totalShots: number;
    totalHits: number;
    incrementGamesPlayed: () => void;
    addShots: (shots: number, hits: number) => void;

    // Cross-promo
    shouldShowPromo: () => boolean;

    // Computed
    getAccuracy: () => number;
}

export const useProgressStore = create<ProgressState>()(
    persist(
        (set, get) => ({
            _hasHydrated: false,
            setHasHydrated: (state) => set({ _hasHydrated: state }),

            highScores: {
                'shape-hunt': 0,
                'flappy-shooter': 0,
                'target-practice': 0,
            },
            setHighScore: (mode, score) => {
                const current = get().highScores[mode];
                if (score > current) {
                    set({
                        highScores: {
                            ...get().highScores,
                            [mode]: score,
                        },
                    });
                }
            },

            totalGamesPlayed: 0,
            totalShots: 0,
            totalHits: 0,

            incrementGamesPlayed: () => {
                set({ totalGamesPlayed: get().totalGamesPlayed + 1 });
            },

            addShots: (shots, hits) => {
                set({
                    totalShots: get().totalShots + shots,
                    totalHits: get().totalHits + hits,
                });
            },

            getAccuracy: () => {
                const { totalShots, totalHits } = get();
                if (totalShots === 0) return 0;
                return Math.round((totalHits / totalShots) * 100);
            },

            // Show promo using Fibonacci-like sequence: 3, 5, 8, 13... then restart
            // Games: 3, 8 (3+5), 16 (8+8), 29 (16+13)... restart cycle after 13
            // This makes promos less frequent as player engages more
            shouldShowPromo: () => {
                const { totalGamesPlayed } = get();
                if (totalGamesPlayed === 0) return false;

                // Fibonacci-like intervals: 3, 5, 8, 13 (then restart)
                const intervals = [3, 5, 8, 13];
                const cycleLength = intervals.reduce((a, b) => a + b, 0); // 29 games per cycle

                // Find position in current cycle
                const positionInCycle = totalGamesPlayed % cycleLength || cycleLength;

                // Check if at any promo point: 3, 8, 16, 29
                let promoPoint = 0;
                for (const interval of intervals) {
                    promoPoint += interval;
                    if (positionInCycle === promoPoint) {
                        return true;
                    }
                }

                return false;
            },
        }),
        {
            name: 'finger-shoot-progress',
            storage: createJSONStorage(() => AsyncStorage),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
