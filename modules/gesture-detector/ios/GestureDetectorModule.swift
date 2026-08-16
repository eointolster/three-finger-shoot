import ExpoModulesCore
import AVFoundation
import Vision
import UIKit

/**
 * GestureDetectorModule - Native Expo Module for Apple Vision Hand Tracking
 *
 * This module uses Apple's Vision framework to:
 * 1. Capture front camera frames
 * 2. Detect hand pose (21 keypoints) using VNDetectHumanHandPoseRequest
 * 3. Classify "finger gun" gesture (index + thumb extended, others curled)
 * 4. Detect "shoot" motion (quick forward movement)
 * 5. Emit events to React Native: onAim, onShoot, onIdle
 */
public class GestureDetectorModule: Module {

    public func definition() -> ModuleDefinition {
        Name("GestureDetector")

        // Events that can be sent to JavaScript
        Events("onGestureChange", "onAimUpdate", "onShoot")

        // View component that shows camera + processes hand tracking
        View(GestureDetectorView.self) {
            Events("onGestureChange", "onAimUpdate", "onShoot")

            Prop("isActive") { (view: GestureDetectorView, isActive: Bool) in
                if isActive {
                    view.startTracking()
                } else {
                    view.stopTracking()
                }
            }

            Prop("sensitivity") { (view: GestureDetectorView, sensitivity: Double) in
                view.sensitivity = CGFloat(sensitivity)
            }

            Prop("showDebugOverlay") { (view: GestureDetectorView, show: Bool) in
                view.showDebugOverlay = show
            }
        }
    }
}
