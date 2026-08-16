// Game types for Finger Shoot

export type GameMode = 'shape-hunt' | 'flappy-shooter' | 'target-practice';

export type GestureState = 'idle' | 'aim' | 'shoot' | 'cooldown';

export interface HandKeypoint {
    x: number;
    y: number;
    confidence: number;
}

export interface HandPose {
    // 21 keypoints: wrist + 4 per finger (thumb, index, middle, ring, pinky)
    wrist: HandKeypoint;
    thumbCMC: HandKeypoint;
    thumbMCP: HandKeypoint;
    thumbIP: HandKeypoint;
    thumbTip: HandKeypoint;
    indexMCP: HandKeypoint;
    indexPIP: HandKeypoint;
    indexDIP: HandKeypoint;
    indexTip: HandKeypoint;
    middleMCP: HandKeypoint;
    middlePIP: HandKeypoint;
    middleDIP: HandKeypoint;
    middleTip: HandKeypoint;
    ringMCP: HandKeypoint;
    ringPIP: HandKeypoint;
    ringDIP: HandKeypoint;
    ringTip: HandKeypoint;
    pinkyMCP: HandKeypoint;
    pinkyPIP: HandKeypoint;
    pinkyDIP: HandKeypoint;
    pinkyTip: HandKeypoint;
}

export interface GestureEvent {
    type: 'aim' | 'shoot' | 'idle';
    aimPosition?: { x: number; y: number }; // Normalized 0-1
    timestamp: number;
}

export interface Shape {
    id: string;
    type: 'circle' | 'square' | 'triangle';
    x: number;
    y: number;
    size: number;
    speed: number;
    direction: 'left' | 'right';
    points: number;
}

export interface Target {
    id: string;
    x: number;
    y: number;
    size: number;
    hitPoints: number;
    maxHitPoints: number;
    expiresAt: number;
}

export interface GameState {
    score: number;
    lives: number;
    isPlaying: boolean;
    isPaused: boolean;
    level: number;
}

export interface FlappyState extends GameState {
    birdY: number;
    birdVelocity: number;
    pipes: { x: number; gapY: number; passed: boolean }[];
    distance: number;
}
