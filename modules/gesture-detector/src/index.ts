import { requireNativeViewManager, requireNativeModule } from 'expo-modules-core';
import { ViewProps } from 'react-native';

// Native module types
export type GestureState = 'idle' | 'aim' | 'shoot' | 'error';

export interface GestureChangeEvent {
    state: GestureState;
    confidence?: number;
    error?: string; // 'camera_permission_denied' when permission is denied
}

export interface AimUpdateEvent {
    x: number; // 0-1 normalized
    y: number; // 0-1 normalized
}

export interface ShootEvent {
    x: number;
    y: number;
    timestamp: number;
}

// View props
export interface GestureDetectorViewProps extends ViewProps {
    /** Whether gesture detection is active */
    isActive?: boolean;

    /** Sensitivity multiplier (0.5 = more strict, 2.0 = more lenient) */
    sensitivity?: number;

    /** Show debug overlay with hand skeleton */
    showDebugOverlay?: boolean;

    /** Called when gesture state changes (idle, aim, shoot) */
    onGestureChange?: (event: { nativeEvent: GestureChangeEvent }) => void;

    /** Called when aim position updates (every frame while aiming) */
    onAimUpdate?: (event: { nativeEvent: AimUpdateEvent }) => void;

    /** Called when shoot gesture is detected */
    onShoot?: (event: { nativeEvent: ShootEvent }) => void;
}

// Export the native view
export const GestureDetectorView = requireNativeViewManager<GestureDetectorViewProps>('GestureDetector');

// Export the native module (for any non-view functionality)
export const GestureDetectorModule = requireNativeModule('GestureDetector');
