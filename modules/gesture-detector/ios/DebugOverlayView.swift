import UIKit

/**
 * DebugOverlayView - Shows hand keypoints for debugging
 *
 * Draws circles at each detected keypoint position
 * and lines connecting them to visualize the hand skeleton.
 */
class DebugOverlayView: UIView {

    private var keypoints: HandKeypoints?

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = .clear
        isUserInteractionEnabled = false
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) not implemented")
    }

    func updateKeypoints(_ keypoints: HandKeypoints) {
        self.keypoints = keypoints
        DispatchQueue.main.async {
            self.setNeedsDisplay()
        }
    }

    func clearKeypoints() {
        self.keypoints = nil
        DispatchQueue.main.async {
            self.setNeedsDisplay()
        }
    }

    override func draw(_ rect: CGRect) {
        guard let ctx = UIGraphicsGetCurrentContext(),
              let kp = keypoints else { return }

        // Convert normalized coordinates to view coordinates
        func toViewPoint(_ point: HandKeypoint?) -> CGPoint? {
            guard let p = point else { return nil }
            // Vision uses bottom-left origin, flip Y
            return CGPoint(
                x: p.location.x * bounds.width,
                y: (1 - p.location.y) * bounds.height
            )
        }

        // Draw keypoints
        let keypointColor = UIColor.green.cgColor
        let lowConfidenceColor = UIColor.yellow.cgColor
        let lineColor = UIColor.green.withAlphaComponent(0.5).cgColor

        func drawKeypoint(_ kp: HandKeypoint?, size: CGFloat = 8) {
            guard let kp = kp, let point = toViewPoint(kp) else { return }

            ctx.setFillColor(kp.confidence > 0.5 ? keypointColor : lowConfidenceColor)
            ctx.fillEllipse(in: CGRect(
                x: point.x - size/2,
                y: point.y - size/2,
                width: size,
                height: size
            ))
        }

        func drawLine(from: HandKeypoint?, to: HandKeypoint?) {
            guard let fromPoint = toViewPoint(from),
                  let toPoint = toViewPoint(to) else { return }

            ctx.setStrokeColor(lineColor)
            ctx.setLineWidth(2)
            ctx.move(to: fromPoint)
            ctx.addLine(to: toPoint)
            ctx.strokePath()
        }

        // Draw connections (skeleton)
        // Thumb
        drawLine(from: kp.wrist, to: kp.thumbCMC)
        drawLine(from: kp.thumbCMC, to: kp.thumbMP)
        drawLine(from: kp.thumbMP, to: kp.thumbIP)
        drawLine(from: kp.thumbIP, to: kp.thumbTip)

        // Index
        drawLine(from: kp.wrist, to: kp.indexMCP)
        drawLine(from: kp.indexMCP, to: kp.indexPIP)
        drawLine(from: kp.indexPIP, to: kp.indexDIP)
        drawLine(from: kp.indexDIP, to: kp.indexTip)

        // Middle
        drawLine(from: kp.wrist, to: kp.middleMCP)
        drawLine(from: kp.middleMCP, to: kp.middlePIP)
        drawLine(from: kp.middlePIP, to: kp.middleDIP)
        drawLine(from: kp.middleDIP, to: kp.middleTip)

        // Ring
        drawLine(from: kp.wrist, to: kp.ringMCP)
        drawLine(from: kp.ringMCP, to: kp.ringPIP)
        drawLine(from: kp.ringPIP, to: kp.ringDIP)
        drawLine(from: kp.ringDIP, to: kp.ringTip)

        // Pinky
        drawLine(from: kp.wrist, to: kp.pinkyMCP)
        drawLine(from: kp.pinkyMCP, to: kp.pinkyPIP)
        drawLine(from: kp.pinkyPIP, to: kp.pinkyDIP)
        drawLine(from: kp.pinkyDIP, to: kp.pinkyTip)

        // Draw all keypoints on top
        drawKeypoint(kp.wrist, size: 10)

        drawKeypoint(kp.thumbCMC)
        drawKeypoint(kp.thumbMP)
        drawKeypoint(kp.thumbIP)
        drawKeypoint(kp.thumbTip, size: 10)

        drawKeypoint(kp.indexMCP)
        drawKeypoint(kp.indexPIP)
        drawKeypoint(kp.indexDIP)
        drawKeypoint(kp.indexTip, size: 12) // Larger for aiming finger

        drawKeypoint(kp.middleMCP)
        drawKeypoint(kp.middlePIP)
        drawKeypoint(kp.middleDIP)
        drawKeypoint(kp.middleTip)

        drawKeypoint(kp.ringMCP)
        drawKeypoint(kp.ringPIP)
        drawKeypoint(kp.ringDIP)
        drawKeypoint(kp.ringTip)

        drawKeypoint(kp.pinkyMCP)
        drawKeypoint(kp.pinkyPIP)
        drawKeypoint(kp.pinkyDIP)
        drawKeypoint(kp.pinkyTip)
    }
}
