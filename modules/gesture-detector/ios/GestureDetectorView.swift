import ExpoModulesCore
import AVFoundation
import Vision
import UIKit

/**
 * GestureDetectorView - Camera preview with hand tracking overlay
 *
 * This view:
 * 1. Shows the front camera feed
 * 2. Processes each frame through Apple Vision
 * 3. Draws debug overlay showing hand keypoints (optional)
 * 4. Emits gesture events to React Native
 */
public class GestureDetectorView: ExpoView, AVCaptureVideoDataOutputSampleBufferDelegate {

    // MARK: - Properties

    private var captureSession: AVCaptureSession?
    private var previewLayer: AVCaptureVideoPreviewLayer?
    private var videoOutput: AVCaptureVideoDataOutput?
    private let videoQueue = DispatchQueue(label: "com.fingershoot.videoQueue", qos: .userInteractive)

    // Race condition prevention
    private var isSettingUp: Bool = false

    // Hand pose request
    private let handPoseRequest: VNDetectHumanHandPoseRequest = {
        let request = VNDetectHumanHandPoseRequest()
        request.maximumHandCount = 1 // Only track one hand
        return request
    }()

    // Gesture classifier
    private let gestureClassifier = GestureClassifier()

    // Configuration
    var sensitivity: CGFloat = 1.0
    var showDebugOverlay: Bool = false {
        didSet {
            debugOverlayView.isHidden = !showDebugOverlay
        }
    }

    // Debug overlay
    private let debugOverlayView = DebugOverlayView()

    // Current state
    private var currentGestureState: GestureState = .idle
    private var lastAimPosition: CGPoint = CGPoint(x: 0.5, y: 0.5)

    // Event callbacks (set by Expo)
    let onGestureChange = EventDispatcher()
    let onAimUpdate = EventDispatcher()
    let onShoot = EventDispatcher()

    // MARK: - Initialization

    public required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        setupUI()
    }

    private func setupUI() {
        backgroundColor = .black

        // Add debug overlay
        debugOverlayView.isHidden = true
        debugOverlayView.translatesAutoresizingMaskIntoConstraints = false
        addSubview(debugOverlayView)

        NSLayoutConstraint.activate([
            debugOverlayView.topAnchor.constraint(equalTo: topAnchor),
            debugOverlayView.leadingAnchor.constraint(equalTo: leadingAnchor),
            debugOverlayView.trailingAnchor.constraint(equalTo: trailingAnchor),
            debugOverlayView.bottomAnchor.constraint(equalTo: bottomAnchor)
        ])
    }

    // MARK: - Camera Setup

    func startTracking() {
        // Prevent race condition - check both session and setup flag
        guard captureSession == nil && !isSettingUp else { return }
        isSettingUp = true

        // Check camera authorization status
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            // Already authorized, start camera
            DispatchQueue.global(qos: .userInitiated).async { [weak self] in
                self?.setupCamera()
            }

        case .notDetermined:
            // Request permission
            AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                if granted {
                    DispatchQueue.global(qos: .userInitiated).async {
                        self?.setupCamera()
                    }
                } else {
                    self?.handlePermissionDenied()
                }
            }

        case .denied, .restricted:
            handlePermissionDenied()

        @unknown default:
            handlePermissionDenied()
        }
    }

    private func handlePermissionDenied() {
        isSettingUp = false
        print("GestureDetector: Camera permission denied")

        // Notify JS that permission was denied
        DispatchQueue.main.async { [weak self] in
            self?.onGestureChange([
                "state": "error",
                "error": "camera_permission_denied"
            ])
        }
    }

    func stopTracking() {
        captureSession?.stopRunning()
        captureSession = nil
        isSettingUp = false

        DispatchQueue.main.async { [weak self] in
            self?.previewLayer?.removeFromSuperlayer()
            self?.previewLayer = nil
        }
    }

    private func setupCamera() {
        let session = AVCaptureSession()
        session.sessionPreset = .medium // Lower resolution for performance

        // Get front camera
        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front),
              let input = try? AVCaptureDeviceInput(device: device) else {
            print("GestureDetector: Failed to get front camera")
            isSettingUp = false
            return
        }

        if session.canAddInput(input) {
            session.addInput(input)
        }

        // Video output for frame processing
        let output = AVCaptureVideoDataOutput()
        output.setSampleBufferDelegate(self, queue: videoQueue)
        output.alwaysDiscardsLateVideoFrames = true
        output.videoSettings = [
            kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA
        ]

        if session.canAddOutput(output) {
            session.addOutput(output)
        }

        // Configure connection for front camera - mirror for natural selfie view
        if let connection = output.connection(with: .video) {
            connection.videoOrientation = .portrait
            // Mirror the data output so Vision coordinates match preview
            connection.isVideoMirrored = true
        }

        self.captureSession = session
        self.videoOutput = output

        // Setup preview layer on main thread
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            let preview = AVCaptureVideoPreviewLayer(session: session)
            preview.videoGravity = .resizeAspectFill
            preview.frame = self.bounds

            // Mirror preview layer to match data output
            if let connection = preview.connection {
                connection.automaticallyAdjustsVideoMirroring = false
                connection.isVideoMirrored = true
            }

            self.layer.insertSublayer(preview, at: 0)
            self.previewLayer = preview

            // Bring debug overlay to front
            self.bringSubviewToFront(self.debugOverlayView)
        }

        // Start capture
        session.startRunning()
        isSettingUp = false
    }

    public override func layoutSubviews() {
        super.layoutSubviews()
        previewLayer?.frame = bounds
    }

    // MARK: - Video Frame Processing

    public func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }

        // Run Vision hand pose detection
        // Use .upMirrored since we mirrored the video data for front camera
        let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: .upMirrored, options: [:])

        do {
            try handler.perform([handPoseRequest])

            guard let observation = handPoseRequest.results?.first else {
                // No hand detected
                handleNoHand()
                return
            }

            // Process hand pose
            processHandPose(observation)

        } catch {
            print("GestureDetector: Vision error - \(error)")
        }
    }

    // MARK: - Hand Pose Processing

    private func processHandPose(_ observation: VNHumanHandPoseObservation) {
        // Get all keypoints
        guard let keypointsDict = try? observation.recognizedPoints(.all) else { return }

        // Convert to our format
        let keypoints = HandKeypoints(from: keypointsDict)

        // Update debug overlay
        if showDebugOverlay {
            DispatchQueue.main.async { [weak self] in
                self?.debugOverlayView.updateKeypoints(keypoints)
            }
        }

        // Calculate aim position using palm center (average of MCP joints for stability)
        // This gives smoother aiming than tracking a single fingertip
        var palmX: CGFloat = 0
        var palmY: CGFloat = 0
        var pointCount: CGFloat = 0

        if let indexMCP = keypoints.indexMCP, indexMCP.confidence > 0.3 {
            palmX += indexMCP.location.x
            palmY += indexMCP.location.y
            pointCount += 1
        }
        if let middleMCP = keypoints.middleMCP, middleMCP.confidence > 0.3 {
            palmX += middleMCP.location.x
            palmY += middleMCP.location.y
            pointCount += 1
        }
        if let ringMCP = keypoints.ringMCP, ringMCP.confidence > 0.3 {
            palmX += ringMCP.location.x
            palmY += ringMCP.location.y
            pointCount += 1
        }

        if pointCount > 0 {
            palmX /= pointCount
            palmY /= pointCount

            // Fix coordinate system:
            // - Invert X because front camera is mirrored (right hand should move aim right)
            // - Invert Y to convert from bottom-left to top-left origin
            let aimX = 1.0 - palmX  // Invert X for natural right = right
            let aimY = 1.0 - palmY  // Invert Y for screen coordinates

            let newAimPosition = CGPoint(x: aimX, y: aimY)

            // Faster smoothing for more responsive aiming (0.5 = 50% new, 50% old)
            lastAimPosition = CGPoint(
                x: lastAimPosition.x * 0.5 + newAimPosition.x * 0.5,
                y: lastAimPosition.y * 0.5 + newAimPosition.y * 0.5
            )

            // Send aim update
            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                self.onAimUpdate([
                    "x": self.lastAimPosition.x,
                    "y": self.lastAimPosition.y
                ])
            }
        }

        // Classify gesture
        let gestureResult = gestureClassifier.classify(keypoints: keypoints, sensitivity: sensitivity)

        // Handle state changes
        if gestureResult.state != currentGestureState {
            currentGestureState = gestureResult.state

            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }

                self.onGestureChange([
                    "state": gestureResult.state.rawValue,
                    "confidence": gestureResult.confidence
                ])

                if gestureResult.state == .shoot {
                    self.onShoot([
                        "x": self.lastAimPosition.x,
                        "y": self.lastAimPosition.y,
                        "timestamp": Date().timeIntervalSince1970 * 1000
                    ])
                }
            }
        }
    }

    private func handleNoHand() {
        if currentGestureState != .idle {
            currentGestureState = .idle

            DispatchQueue.main.async { [weak self] in
                self?.onGestureChange([
                    "state": "idle",
                    "confidence": 0.0
                ])
            }
        }

        // Clear debug overlay
        if showDebugOverlay {
            DispatchQueue.main.async { [weak self] in
                self?.debugOverlayView.clearKeypoints()
            }
        }
    }
}

// MARK: - Gesture State

enum GestureState: String {
    case idle = "idle"
    case aim = "aim"
    case shoot = "shoot"
}

// MARK: - Hand Keypoints

struct HandKeypoint {
    let location: CGPoint
    let confidence: Float
}

struct HandKeypoints {
    // Wrist
    var wrist: HandKeypoint?

    // Thumb
    var thumbCMC: HandKeypoint?
    var thumbMP: HandKeypoint?
    var thumbIP: HandKeypoint?
    var thumbTip: HandKeypoint?

    // Index
    var indexMCP: HandKeypoint?
    var indexPIP: HandKeypoint?
    var indexDIP: HandKeypoint?
    var indexTip: HandKeypoint?

    // Middle
    var middleMCP: HandKeypoint?
    var middlePIP: HandKeypoint?
    var middleDIP: HandKeypoint?
    var middleTip: HandKeypoint?

    // Ring
    var ringMCP: HandKeypoint?
    var ringPIP: HandKeypoint?
    var ringDIP: HandKeypoint?
    var ringTip: HandKeypoint?

    // Pinky
    var pinkyMCP: HandKeypoint?
    var pinkyPIP: HandKeypoint?
    var pinkyDIP: HandKeypoint?
    var pinkyTip: HandKeypoint?

    init(from points: [VNHumanHandPoseObservation.JointName: VNRecognizedPoint]) {
        func convert(_ point: VNRecognizedPoint?) -> HandKeypoint? {
            guard let p = point, p.confidence > 0.1 else { return nil }
            return HandKeypoint(location: p.location, confidence: p.confidence)
        }

        wrist = convert(points[.wrist])

        thumbCMC = convert(points[.thumbCMC])
        thumbMP = convert(points[.thumbMP])
        thumbIP = convert(points[.thumbIP])
        thumbTip = convert(points[.thumbTip])

        indexMCP = convert(points[.indexMCP])
        indexPIP = convert(points[.indexPIP])
        indexDIP = convert(points[.indexDIP])
        indexTip = convert(points[.indexTip])

        middleMCP = convert(points[.middleMCP])
        middlePIP = convert(points[.middlePIP])
        middleDIP = convert(points[.middleDIP])
        middleTip = convert(points[.middleTip])

        ringMCP = convert(points[.ringMCP])
        ringPIP = convert(points[.ringPIP])
        ringDIP = convert(points[.ringDIP])
        ringTip = convert(points[.ringTip])

        pinkyMCP = convert(points[.littleMCP])
        pinkyPIP = convert(points[.littlePIP])
        pinkyDIP = convert(points[.littleDIP])
        pinkyTip = convert(points[.littleTip])
    }
}
