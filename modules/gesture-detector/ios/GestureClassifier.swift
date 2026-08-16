import Foundation
import CoreGraphics

/**
 * GestureClassifier - Detects hand open/closed state for aiming and shooting
 *
 * IMPROVED ALGORITHM:
 * Instead of measuring tip-to-MCP distance (which fails because tips disappear in fist),
 * we check if fingertips are ABOVE or BELOW the PIP joint (middle knuckle).
 * - Extended finger: tip is ABOVE PIP (in screen Y coords, lower value = higher on screen)
 * - Curled finger: tip is BELOW or AT SAME LEVEL as PIP
 *
 * We also fall back to checking if we can even SEE the fingertip - if not, likely curled.
 */
class GestureClassifier {

    // State tracking
    private var consecutiveAimFrames = 0
    private var consecutiveFistFrames = 0
    private let framesNeededForAim = 2    // Need 2 consecutive aim frames
    private let framesNeededForFist = 2   // Need 2 consecutive fist frames for shoot

    // Shoot detection
    private var lastShootTime: Date = Date.distantPast
    private let shootCooldown: TimeInterval = 0.3  // 300ms cooldown

    // Last state for debouncing
    private var lastEmittedState: GestureState = .idle

    struct ClassificationResult {
        let state: GestureState
        let confidence: Double
    }

    func classify(keypoints: HandKeypoints, sensitivity: CGFloat) -> ClassificationResult {
        // Check if we have basic keypoints for hand detection
        guard keypoints.wrist != nil else {
            // No hand at all
            consecutiveAimFrames = 0
            consecutiveFistFrames = 0
            return ClassificationResult(state: .idle, confidence: 0)
        }

        // Count how many fingers we can determine are extended vs curled
        var extendedCount = 0
        var curledCount = 0
        var uncertainCount = 0

        // Check each finger using the new Y-position based method
        let indexState = getFingerState(tip: keypoints.indexTip, pip: keypoints.indexPIP, mcp: keypoints.indexMCP)
        let middleState = getFingerState(tip: keypoints.middleTip, pip: keypoints.middlePIP, mcp: keypoints.middleMCP)
        let ringState = getFingerState(tip: keypoints.ringTip, pip: keypoints.ringPIP, mcp: keypoints.ringMCP)
        let pinkyState = getFingerState(tip: keypoints.pinkyTip, pip: keypoints.pinkyPIP, mcp: keypoints.pinkyMCP)

        for state in [indexState, middleState, ringState, pinkyState] {
            switch state {
            case .extended: extendedCount += 1
            case .curled: curledCount += 1
            case .uncertain: uncertainCount += 1
            }
        }

        // Debug logging
        print("GestureClassifier: extended=\(extendedCount), curled=\(curledCount), uncertain=\(uncertainCount)")

        // Determine current frame state
        var frameState: GestureState = .idle
        var confidence: Double = 0.5

        // Open hand detection: 2+ fingers clearly extended
        if extendedCount >= 2 {
            frameState = .aim
            confidence = Double(extendedCount) / 4.0
            consecutiveAimFrames += 1
            consecutiveFistFrames = 0
        }
        // Fist detection: 2+ fingers clearly curled AND less than 2 extended
        // OR: most fingers are uncertain (tips hidden = likely curled under palm)
        else if curledCount >= 2 && extendedCount <= 1 {
            frameState = .shoot
            confidence = 0.9
            consecutiveFistFrames += 1
            consecutiveAimFrames = 0
        }
        // Alternative fist: lots of uncertainty (tips hidden) and few extended
        else if uncertainCount >= 2 && extendedCount <= 1 {
            frameState = .shoot
            confidence = 0.7
            consecutiveFistFrames += 1
            consecutiveAimFrames = 0
        }
        // Partial or ambiguous - maintain last state
        else {
            consecutiveAimFrames = 0
            consecutiveFistFrames = 0
        }

        // Debounce logic
        if frameState == .shoot && consecutiveFistFrames >= framesNeededForFist && canShoot() {
            lastShootTime = Date()
            lastEmittedState = .shoot
            return ClassificationResult(state: .shoot, confidence: confidence)
        }

        if frameState == .aim && consecutiveAimFrames >= framesNeededForAim {
            lastEmittedState = .aim
            return ClassificationResult(state: .aim, confidence: confidence)
        }

        // Return last stable state, or idle
        if lastEmittedState == .shoot {
            // Don't stay in shoot - transition back to aim or idle
            if frameState == .aim {
                lastEmittedState = .aim
            } else {
                lastEmittedState = .idle
            }
        }

        return ClassificationResult(state: lastEmittedState, confidence: confidence)
    }

    // MARK: - Finger State Detection

    enum FingerState {
        case extended
        case curled
        case uncertain
    }

    private func getFingerState(tip: HandKeypoint?, pip: HandKeypoint?, mcp: HandKeypoint?) -> FingerState {
        // If we can't see the tip at all (low confidence), it's likely curled under
        guard let tip = tip, tip.confidence > 0.2 else {
            // Can't see tip - might be curled under palm
            // Check if we can see PIP - if PIP visible but tip not, likely curled
            if let pip = pip, pip.confidence > 0.3 {
                return .curled // PIP visible but tip hidden = curled
            }
            return .uncertain
        }

        // If we can see tip but not PIP, use MCP as fallback
        guard let pip = pip, pip.confidence > 0.2 else {
            // Fall back to comparing tip to MCP
            guard let mcp = mcp, mcp.confidence > 0.2 else {
                return .uncertain
            }
            // If tip is significantly above MCP (in Y, lower = higher on screen)
            // Note: Vision coordinates have origin at bottom-left
            if tip.location.y > mcp.location.y + 0.05 {
                return .extended
            } else {
                return .curled
            }
        }

        // Primary method: compare tip Y to PIP Y
        // Vision coordinates: Y=0 at bottom, Y=1 at top
        // Extended finger: tip is ABOVE PIP (higher Y value)
        // Curled finger: tip is AT or BELOW PIP (lower or equal Y value)

        let tipY = tip.location.y
        let pipY = pip.location.y

        // Extended if tip is clearly above PIP (tolerance for noise)
        if tipY > pipY + 0.02 {
            return .extended
        }
        // Curled if tip is at or below PIP
        else if tipY <= pipY {
            return .curled
        }
        // Very close - uncertain
        else {
            return .uncertain
        }
    }

    private func canShoot() -> Bool {
        return Date().timeIntervalSince(lastShootTime) > shootCooldown
    }

    // MARK: - Utilities

    private func distance(_ a: CGPoint, _ b: CGPoint) -> CGFloat {
        let dx = a.x - b.x
        let dy = a.y - b.y
        return sqrt(dx * dx + dy * dy)
    }
}
