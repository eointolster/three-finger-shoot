# Three Finger Shoot

Three Finger Shoot is an iOS arcade game controlled with hand gestures. The app uses a custom Expo native module, Apple's Vision framework, and the front-facing camera to detect aiming and shooting gestures on-device.

## Connect

- [YouTube — @eointolster](https://youtube.com/@eointolster?si=i_t0AsrSxBFBkjJR)
- [LinkedIn](https://www.linkedin.com/in/eoin-tolster-2290b6221)

## Requirements

- Node.js and npm
- An Expo account
- EAS CLI 16.28.0 or newer
- A physical iPhone for camera and gesture-inference testing
- A paid Apple Developer account for signed iOS builds and App Store Connect submission

Expo Go can display the app's touch-fallback shell, but it cannot load the custom Swift gesture-detector module. Real camera and Apple Vision inference requires an installed development build or a production/TestFlight build.





<img width="645" height="1398" alt="IMG_5219" src="https://github.com/user-attachments/assets/730e7ed5-fa65-498d-801d-99c5e0ff48eb" />

## Quick start

**Practical rule:** Start Metro and the JavaScript app shell with:

```bash
npx expo start --lan --clear
```

Then validate real gesture inference on a physical iPhone using a native iOS development build. When a tested build is ready for production submission, use:

```bash
eas build --platform ios --profile production --auto-submit
```

The second command is a release action: it consumes an EAS cloud build and uploads the result to App Store Connect/TestFlight.

## Install

From the repository root:

```bash
npm ci
```

Install EAS CLI and sign in if this machine has not been configured before:

```bash
npm install --global eas-cli
eas login
```

## Make a fork your own

The checked-in configuration belongs to the existing live Three Finger Shoot app. If you are maintaining that app, keep its current iOS bundle identifier and EAS project identifier unchanged.

If you are creating a separate app, make these changes only in your own fork or copy and complete them before running an EAS build or submission:

| Area | Where | What to provide |
| --- | --- | --- |
| App identity | `app.json` | Your app name, slug, URL scheme, version, camera-permission wording, and other store-facing text |
| Store identity | `app.json` | Your own unique `expo.ios.bundleIdentifier` and `expo.android.package` values |
| EAS project | `app.json` | Remove the checked-in `expo.extra.eas.projectId`, then link the fork to an EAS project owned by your Expo account |
| Permissions and compliance | `app.json` | Camera wording, permissions actually used by the fork, and truthful encryption settings |
| Package metadata | `package.json` | Your package name while retaining the required local `gesture-detector` dependency; regenerate `package-lock.json` afterward |
| Branding | `assets/`, `src/utils/audio.ts` | Your own icon, adaptive icon, splash image, favicon, and replacement media; update audio mappings if filenames change |
| Visible copy and privacy | `src/`, `PRIVACY_POLICY.md` | Your app name, privacy wording, support route, and any other user-facing text |
| Promotion links | `README.md`, `src/components/CrossPromoModal.tsx` | Your creator links, displayed handle, `OTHER_APPS`, `YOUTUBE_URL`, and `ALL_APPS_URL` values, or remove the promotion UI |
| Native-module metadata | `modules/gesture-detector/ios/GestureDetector.podspec` | Your repository homepage and project attribution |
| Store accounts | Expo and Apple portals | Your own Expo account, Apple Developer team, App Store Connect record, signing credentials, privacy URL, and support URL |

Search for remaining original names and internal identifiers:

```bash
git grep -n -E 'Three Finger Shoot|Finger Shoot|finger-shoot|fingershoot|eointolster|GestureDetector'
```

If the package name changes, synchronize the lockfile before using `npm ci` again:

```bash
npm install --package-lock-only
```

In a fork, remove only the existing `expo.extra.eas.projectId` block from `app.json`, then create or link an EAS project under the new owner's account:

```bash
eas login
eas project:init
eas project:info
```

Do not reuse the checked-in EAS project identifier, Apple credentials, or store record for a separate app. Changing the iOS bundle identifier creates a different App Store app and will not update the existing Three Finger Shoot listing.

Before a fork uses `--auto-submit`, confirm that `eas whoami`, `eas project:info`, the bundle identifier, and the selected Apple account all belong to the fork owner. Create a new development build after changing native app configuration.

The native module names and JavaScript bridge identifiers can normally remain unchanged. Rename `GestureDetector`, `GestureDetectorModule`, or the `gesture-detector` package only if you also update every matching native and JavaScript reference.

The persisted-storage keys and the native dispatch-queue label are optional internal names. Leave the storage keys unchanged when updating an existing shipped app; changing them resets locally stored progress and settings. If a fork does not record audio, remove the Android recording permission and set `recordAudioAndroid` to `false` in the `expo-camera` plugin configuration so native generation does not add it again.

## Create the iOS development build

Create an installable development client when setting up a device for the first time, or after changing native Swift code, native dependencies, plugins, or native app configuration:

```bash
eas build --platform ios --profile development
```

Follow the EAS installation link on the registered iPhone after the build completes. The `development` profile uses internal distribution, so EAS may prompt to register the device.

Normal TypeScript, JavaScript, and style changes do not require another native build. In-app media loaded by JavaScript usually refreshes through Metro, but app icons, splash images, plugins, and other native-facing assets or configuration require a new development build.

## Run locally

Keep the development computer and iPhone on the same local network. From the repository root, start Metro with:

```bash
npx expo start --lan --clear
```

Then open the installed Three Finger Shoot development build and select the detected development server or scan the QR code. Grant camera access when prompted.

To inspect only the touch-fallback shell in Expo Go, explicitly select Expo Go:

```bash
npx expo start --go --lan --clear
```

If LAN discovery is blocked by the network, use a tunnel as a fallback:

```bash
npx expo start --tunnel --clear
```

Tunnel mode is normally slower than LAN mode.

To stop the local server, press `Ctrl+C` in the terminal running Expo.

### Optional local iOS compilation

On macOS with Xcode installed, a development build can also be compiled and installed directly:

```bash
npx expo run:ios --device
```

Use a physical iPhone to validate camera tracking and gesture inference; the simulator cannot provide equivalent proof.

## Production iOS build and submission

Before building an update to the live app:

1. Check the current live or previously submitted version in App Store Connect.
2. Set `expo.version` in `app.json` to the intended next, unused App Store marketing version.
3. Run `npx expo-doctor` and resolve release-blocking findings.
4. Confirm the release works on a physical iPhone.
5. Confirm that App Store privacy, support, screenshots, review notes, and other metadata are current.

The production profile automatically increments the iOS build number. It does not choose the next App Store marketing version.

Authenticate and confirm the active Expo account:

```bash
eas login
eas whoami
```

Build the production app and automatically submit the completed build:

Only a maintainer signed in to the correct Expo and Apple accounts should run this release command.

```bash
eas build --platform ios --profile production --auto-submit
```

This command consumes an EAS build, signs the iOS app, and uploads the result to App Store Connect/TestFlight. It does **not** automatically release the app publicly. After Apple finishes processing the build, select it in App Store Connect and complete the normal App Review and release steps.

For a production build without automatic submission, omit `--auto-submit`:

```bash
eas build --platform ios --profile production
```

## Repository safety

Never commit Apple signing certificates, provisioning profiles, App Store Connect API keys, Expo access tokens, passwords, local environment files, or service-account credentials. Keep release credentials in Apple, EAS, or an approved secret store.

Before making the repository public:

1. Review every staged filename and diff.
2. Scan the complete Git history with a dedicated secret scanner.
3. Remove personal contact details and local filesystem paths unless they are intentionally public.
4. Confirm redistribution rights for bundled images and any newly added assets.
5. Use a GitHub `noreply` address for public commit metadata if author-email privacy is required.

The iOS bundle identifier and EAS project identifier are project identifiers, not passwords. The canonical release configuration must retain the correct bundle identifier so future builds update the existing App Store app.

The bundled audio files are approved for public inclusion with this project. Their scope and reuse terms are recorded in [ASSET_NOTICE.md](./ASSET_NOTICE.md).

## License

The source code and documentation are available under the [MIT License](./LICENSE). Files under `assets/` are not covered by MIT. The bundled audio may be shared only under the terms in [ASSET_NOTICE.md](./ASSET_NOTICE.md). Replace the icons, splash image, favicon, and other branding before distributing a rebranded version.

## References

- [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Using an Expo development build](https://docs.expo.dev/develop/development-builds/use-development-builds/)
- [Submitting iOS builds with EAS](https://docs.expo.dev/submit/ios/)
- [Creating or linking an EAS project](https://docs.expo.dev/eas/cli/#eas-projectinit)
