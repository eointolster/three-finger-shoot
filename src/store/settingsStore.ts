import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
    // Hydration tracking
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;

    // Audio settings
    musicEnabled: boolean;
    setMusicEnabled: (enabled: boolean) => void;

    // Gesture settings
    trackingSensitivity: number; // 0.5 = stricter, 1.0 = default, 2.0 = lenient
    setTrackingSensitivity: (sensitivity: number) => void;

    // Calibration settings
    showCalibrationBeforeGame: boolean;
    setShowCalibrationBeforeGame: (show: boolean) => void;

    // Calibration status
    lastCalibrationTime: number;
    setLastCalibrationTime: (time: number) => void;
    isCalibrated: () => boolean;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            _hasHydrated: false,
            setHasHydrated: (state) => set({ _hasHydrated: state }),

            // Audio - default ON
            musicEnabled: true,
            setMusicEnabled: (enabled) => set({ musicEnabled: enabled }),

            // Sensitivity - default 1.0
            trackingSensitivity: 1.0,
            setTrackingSensitivity: (sensitivity) => set({ trackingSensitivity: sensitivity }),

            // Show calibration before games - default true
            showCalibrationBeforeGame: true,
            setShowCalibrationBeforeGame: (show) => set({ showCalibrationBeforeGame: show }),

            // Track last calibration
            lastCalibrationTime: 0,
            setLastCalibrationTime: (time) => set({ lastCalibrationTime: time }),

            // Calibrated within last 30 minutes
            isCalibrated: () => {
                const { lastCalibrationTime } = get();
                const thirtyMinutes = 30 * 60 * 1000;
                return Date.now() - lastCalibrationTime < thirtyMinutes;
            },
        }),
        {
            name: 'finger-shoot-settings',
            storage: createJSONStorage(() => AsyncStorage),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
