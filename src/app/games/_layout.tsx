import { Stack } from 'expo-router';
import { colors } from '../../styles/theme';

export default function GamesLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="shape-hunt" />
            <Stack.Screen name="flappy-shooter" />
            <Stack.Screen name="target-practice" />
        </Stack>
    );
}
