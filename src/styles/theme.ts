// Theme colors and typography for Finger Shoot
export const colors = {
    // Background
    background: '#0a0a0a',
    backgroundLight: '#1a1a2e',
    backgroundAccent: '#16213e',

    // Primary action colors
    primary: '#e94560',
    primaryDark: '#c73e54',
    secondary: '#0f3460',

    // Game-specific
    aim: '#00ff88',
    shoot: '#ff6b35',
    hit: '#ffd700',
    miss: '#ff4444',

    // Neutrals
    white: '#ffffff',
    gray: '#888888',
    grayLight: '#cccccc',
    grayDark: '#333333',

    // Shapes
    shapeCircle: '#ff6b6b',
    shapeSquare: '#4ecdc4',
    shapeTriangle: '#ffe66d',
};

export const fonts = {
    regular: 'System',
    bold: 'System',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const typography = {
    h1: {
        fontSize: 48,
        fontWeight: 'bold' as const,
        color: colors.white,
    },
    h2: {
        fontSize: 32,
        fontWeight: 'bold' as const,
        color: colors.white,
    },
    h3: {
        fontSize: 24,
        fontWeight: '600' as const,
        color: colors.white,
    },
    body: {
        fontSize: 16,
        color: colors.white,
    },
    caption: {
        fontSize: 14,
        color: colors.gray,
    },
};
