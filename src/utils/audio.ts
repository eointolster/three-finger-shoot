/**
 * Audio utility for background music
 * Uses TRUE fire-and-forget pattern per IOS_APP_LEARNINGS.md
 *
 * CRITICAL: Never await these functions - they handle errors internally
 * and will not block even if audio fails.
 */

import { Audio } from 'expo-av';
import { useSettingsStore } from '../store/settingsStore';

let backgroundSound: Audio.Sound | null = null;
let currentLoadId = 0;  // Track which load is current to cancel stale ones

// Audio file mappings
const AUDIO_FILES = {
    mainMenu: require('../../assets/audio/BackgroundMusicForMainScreen.mp3'),
    shapeHunt: require('../../assets/audio/PracticeShooter.mp3'),
    aquaticSwim1: require('../../assets/audio/AquaticGameBackground.mp3'),
    aquaticSwim2: require('../../assets/audio/AquaticGameBackground2.mp3'),
    carnival: require('../../assets/audio/FastPacedCarnival.mp3'),
};

export type AudioTrack = keyof typeof AUDIO_FILES;

/**
 * Play background music - TRUE fire and forget
 * This function catches all errors internally and will never throw/hang
 * Subsequent calls cancel any in-flight loads from previous calls
 * Respects music enabled setting
 */
export function playBackgroundMusic(track: AudioTrack | 'aquaticRandom') {
    // Check if music is enabled in settings
    const { musicEnabled } = useSettingsStore.getState();
    if (!musicEnabled) {
        stopBackgroundMusic();
        return;
    }

    // Increment load ID to cancel any in-flight loads
    const thisLoadId = ++currentLoadId;

    // Fire and forget - use .then/.catch, never await
    _playMusicInternal(track, thisLoadId)
        .catch(e => console.log('Audio play error:', e));
}

async function _playMusicInternal(track: AudioTrack | 'aquaticRandom', loadId: number) {
    // Stop existing music first
    await _stopMusicInternal().catch(() => { });

    // Check if this load was cancelled
    if (loadId !== currentLoadId) return;

    // Set audio mode with timeout protection
    const audioModePromise = Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
    });

    // Timeout after 2 seconds
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Audio mode timeout')), 2000)
    );

    await Promise.race([audioModePromise, timeout]);

    // Check if this load was cancelled again
    if (loadId !== currentLoadId) return;

    // Select track
    let source;
    if (track === 'aquaticRandom') {
        source = Math.random() > 0.5 ? AUDIO_FILES.aquaticSwim1 : AUDIO_FILES.aquaticSwim2;
    } else {
        source = AUDIO_FILES[track];
    }

    // Load with timeout protection
    const loadPromise = Audio.Sound.createAsync(
        source,
        { isLooping: true, volume: 0.5 }
    );

    const loadTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Audio load timeout')), 5000)
    );

    const result = await Promise.race([loadPromise, loadTimeout]) as { sound: Audio.Sound };

    // Final check - if cancelled, unload the sound we just loaded
    if (loadId !== currentLoadId) {
        result.sound.unloadAsync().catch(() => { });
        return;
    }

    backgroundSound = result.sound;

    // Play with catch - don't await
    result.sound.playAsync().catch(e => console.log('Play failed:', e));
}

/**
 * Stop background music - TRUE fire and forget
 */
export function stopBackgroundMusic() {
    // Increment loadId to cancel any in-flight loads
    currentLoadId++;
    _stopMusicInternal().catch(e => console.log('Stop error:', e));
}

async function _stopMusicInternal() {
    if (backgroundSound) {
        const sound = backgroundSound;
        backgroundSound = null;

        try {
            await sound.stopAsync();
            await sound.unloadAsync();
        } catch (error) {
            // Ignore errors when stopping
        }
    }
}

/**
 * Set music volume (0-1) - fire and forget
 */
export function setMusicVolume(volume: number) {
    if (backgroundSound) {
        backgroundSound.setVolumeAsync(volume).catch(() => { });
    }
}
