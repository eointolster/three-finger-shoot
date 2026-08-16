import { create } from 'zustand';
import { GestureState } from '../types';

interface GestureStore {
    // Current gesture state
    gestureState: GestureState;
    setGestureState: (state: GestureState) => void;

    // Aim position (normalized 0-1)
    aimX: number;
    aimY: number;
    setAimPosition: (x: number, y: number) => void;

    // Shoot event tracking
    lastShootTime: number;
    triggerShoot: () => void;

    // Track if we've seen aim since last shoot (prevents holding fist to spam)
    hasAimedSinceLastShoot: boolean;
    setHasAimedSinceLastShoot: (v: boolean) => void;

    // Cooldown management
    cooldownMs: number;
    setCooldownMs: (ms: number) => void;
    isInCooldown: () => boolean;
    canShoot: () => boolean;
}

export const useGestureStore = create<GestureStore>((set, get) => ({
    gestureState: 'idle',
    setGestureState: (state) => {
        // Track when we enter aim state
        if (state === 'aim') {
            set({ gestureState: state, hasAimedSinceLastShoot: true });
        } else {
            set({ gestureState: state });
        }
    },

    aimX: 0.5,
    aimY: 0.5,
    setAimPosition: (x, y) => set({ aimX: x, aimY: y }),

    lastShootTime: 0,
    hasAimedSinceLastShoot: true, // Start as true so first shot works
    setHasAimedSinceLastShoot: (v) => set({ hasAimedSinceLastShoot: v }),

    triggerShoot: () => {
        const now = Date.now();
        const { cooldownMs, lastShootTime, hasAimedSinceLastShoot } = get();

        // Require cooldown AND must have aimed since last shoot (prevents holding fist)
        if (now - lastShootTime >= cooldownMs && hasAimedSinceLastShoot) {
            set({
                lastShootTime: now,
                gestureState: 'shoot',
                hasAimedSinceLastShoot: false // Reset - must aim again before next shoot
            });

            // Auto-transition to cooldown then idle
            setTimeout(() => {
                set({ gestureState: 'cooldown' });
                setTimeout(() => {
                    set({ gestureState: 'idle' });
                }, 100);
            }, 100);
        }
    },

    cooldownMs: 300, // Increased to 300ms cooldown between shots
    setCooldownMs: (ms) => set({ cooldownMs: ms }),

    isInCooldown: () => {
        const { lastShootTime, cooldownMs } = get();
        return Date.now() - lastShootTime < cooldownMs;
    },

    canShoot: () => {
        const { lastShootTime, cooldownMs, hasAimedSinceLastShoot } = get();
        return Date.now() - lastShootTime >= cooldownMs && hasAimedSinceLastShoot;
    },
}));
