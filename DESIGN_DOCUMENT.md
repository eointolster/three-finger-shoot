# Three Finger Shoot — Architecture Notes

- **Status:** Implemented iOS app
- **Platform:** Expo SDK 54 with an Apple-only native gesture module
- **Last reviewed:** August 16, 2026

## Product

Three Finger Shoot is a portrait arcade game controlled by hand gestures. The front camera is processed on-device with Apple's Vision framework. Players can also use the touch fallback for development or tap-to-shoot during play.

The app contains three game modes:

- Shape Hunt
- Flappy Shooter
- Target Practice

Progress, scores, settings, and calibration state are stored locally with AsyncStorage.

## Runtime architecture

```text
Front camera
    |
    v
AVCaptureSession
    |
    v
VNDetectHumanHandPoseRequest
    |
    v
GestureClassifier.swift
    |
    +--> aim position
    +--> idle / aim / shoot state
              |
              v
       Expo native view bridge
              |
              v
     React Native game screens
```

The native module treats an open hand with multiple extended fingers as aiming and a closed or curled hand as shooting. It debounces gesture state and applies a shooting cooldown. The camera view also accepts tap-to-shoot input.

When the native module is unavailable, `GestureCamera.tsx` supplies a touch-based simulation. This makes the JavaScript shell usable in Expo Go, but it does not validate Apple Vision inference.

## Project structure

```text
.
├── app.json
├── eas.json
├── assets/
│   ├── audio/
│   ├── adaptive-icon.png
│   ├── favicon.png
│   ├── icon.png
│   └── splash.png
├── modules/
│   └── gesture-detector/
│       ├── expo-module.config.json
│       ├── ios/
│       │   ├── DebugOverlayView.swift
│       │   ├── GestureClassifier.swift
│       │   ├── GestureDetectorModule.swift
│       │   └── GestureDetectorView.swift
│       └── src/index.ts
└── src/
    ├── app/
    │   ├── games/
    │   │   ├── flappy-shooter.tsx
    │   │   ├── shape-hunt.tsx
    │   │   └── target-practice.tsx
    │   ├── index.tsx
    │   ├── privacy.tsx
    │   └── settings.tsx
    ├── components/
    ├── store/
    ├── styles/
    ├── types/
    └── utils/
```

## State and persistence

- `gestureStore.ts` owns the current gesture state, normalized aim position, shot events, and JavaScript-side cooldown.
- `progressStore.ts` persists high scores and aggregate play statistics.
- `settingsStore.ts` persists music, sensitivity, and calibration preferences.
- `audio.ts` owns background-music loading and cancellation.

Changing the persisted storage keys in an existing release makes prior local state unavailable to the new version.

## Native-build boundary

Expo Go cannot load the Swift module. Real camera and gesture validation therefore requires either:

- an installed EAS development build, or
- a production/TestFlight build.

TypeScript, JavaScript, and style changes normally refresh through Metro. Swift, native dependency, plugin, app identity, icon, splash, or other native-facing configuration changes require a new native build.

The module podspec targets iOS 15.0. A physical iPhone is required for meaningful camera and gesture testing; simulator or touch-fallback testing is not equivalent evidence.

## Privacy boundary

Camera frames are processed locally and are not intentionally stored or uploaded. Game progress and settings stay in local AsyncStorage. The app includes user-initiated links that open YouTube and App Store pages outside the app.

The public privacy wording in `PRIVACY_POLICY.md` and `src/app/privacy.tsx` should remain aligned with the shipped behavior.

## Release boundary

The existing bundle identifier and EAS project identifier belong to the live Three Finger Shoot app and must remain unchanged for updates to that listing. A fork intended as a separate app must use its own identifiers, accounts, signing credentials, store record, branding, privacy details, and release metadata.

See `README.md` for local development, EAS build, submission, and fork-customization instructions.
