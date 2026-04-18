import { reportCameraState } from "../session/RulesEngine";

let _running = false;
let _videoEl = null;
let _holisticInstance = null;

// ── Public API ───────────────────────────────────────────────
export async function startCameraMonitor() {
  if (_running) return;
  _running = true;

  // Load MediaPipe dynamically
  const { Holistic } = await import("@mediapipe/holistic");
  const { Camera }   = await import("@mediapipe/camera_utils");

  _holisticInstance = new Holistic({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
  });

  _holisticInstance.setOptions({
    modelComplexity:           1,
    smoothLandmarks:           true,
    enableSegmentation:        false,
    minDetectionConfidence:    0.5,
    minTrackingConfidence:     0.5,
  });

  _holisticInstance.onResults(_onResults);

  // Create hidden video element
  _videoEl = document.createElement("video");
  _videoEl.style.display = "none";
  document.body.appendChild(_videoEl);

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
  } catch {
    reportCameraState("CAMERA_BLOCKED");
    return;
  }

  const camera = new Camera(_videoEl, {
    onFrame: async () => {
      if (_running && _holisticInstance) {
        await _holisticInstance.send({ image: _videoEl });
      }
    },
    width: 640,
    height: 480,
  });

  camera.start();
  _videoEl._camera = camera;
  _videoEl.srcObject = stream;
}

export function stopCameraMonitor() {
  _running = false;
  if (_videoEl?._camera) _videoEl._camera.stop();
  if (_videoEl?.srcObject) {
    _videoEl.srcObject.getTracks().forEach((t) => t.stop());
  }
  if (_videoEl) {
    _videoEl.remove();
    _videoEl = null;
  }
  _holisticInstance = null;
}

// ── Landmark analysis ────────────────────────────────────────
function _onResults(results) {
  if (!_running) return;

  const pose = results.poseLandmarks;
  const hands = results.leftHandLandmarks || results.rightHandLandmarks;

  // No pose → absent
  if (!pose || pose.length === 0) {
    reportCameraState("ABSENT");
    return;
  }

  // Phone usage heuristic: hand raised near face
  if (_detectPhone(pose, results)) {
    reportCameraState("PHONE_USAGE");
    return;
  }

  // Head down heuristic: nose y-coord much lower than shoulder midpoint
  if (_detectBookReading(pose)) {
    reportCameraState("BOOK_FOCUS");
    return;
  }

  // Gaze direction: nose vs eye midpoint offset
  const gazeState = _detectGaze(pose);
  reportCameraState(gazeState);
}

function _detectPhone(pose, results) {
  // Left or right wrist near nose = likely holding phone
  const nose    = pose[0];
  const lWrist  = pose[15];
  const rWrist  = pose[16];

  if (!nose || !lWrist || !rWrist) return false;

  const lDist = Math.hypot(lWrist.x - nose.x, lWrist.y - nose.y);
  const rDist = Math.hypot(rWrist.x - nose.x, rWrist.y - nose.y);

  return lDist < 0.15 || rDist < 0.15;
}

function _detectBookReading(pose) {
  const nose      = pose[0];
  const lShoulder = pose[11];
  const rShoulder = pose[12];

  if (!nose || !lShoulder || !rShoulder) return false;

  const shoulderMidY = (lShoulder.y + rShoulder.y) / 2;
  // Head is significantly below shoulder midpoint in frame = looking down
  return nose.y > shoulderMidY + 0.15;
}

function _detectGaze(pose) {
  const nose   = pose[0];
  const lEye   = pose[2];
  const rEye   = pose[5];

  if (!nose || !lEye || !rEye) return "SCREEN_FOCUS";

  const eyeMidX = (lEye.x + rEye.x) / 2;
  const eyeMidY = (lEye.y + rEye.y) / 2;

  const offsetX = Math.abs(nose.x - eyeMidX);
  const offsetY = Math.abs(nose.y - eyeMidY);

  // Large offset = looking away from screen
  if (offsetX > 0.12 || offsetY > 0.15) return "DISTRACTION";

  return "SCREEN_FOCUS";
}
