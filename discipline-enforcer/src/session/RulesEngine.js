import { logViolation } from "./SessionManager";

// ── Thresholds (ms) ──────────────────────────────────────────
const DISTRACTION_WARNING_MS = 5_000;
const DISTRACTION_VIOLATION_MS = 10_000;
const ABSENT_VIOLATION_MS = 10_000;

// ── Internal state ───────────────────────────────────────────
let _state = "IDLE"; // IDLE | MONITORING
let _lastBadStateAt = null;
let _currentCameraState = "SCREEN_FOCUS";
let _pendingViolationType = null;
let _onAlert = null;       // callback: (msg, severity) => void
let _intervalId = null;

// ── Start / stop ─────────────────────────────────────────────
export function startRulesEngine(onAlertCallback) {
  _state = "MONITORING";
  _onAlert = onAlertCallback;
  _lastBadStateAt = null;
  _pendingViolationType = null;

  // Poll every 500ms to evaluate time-based rules
  _intervalId = setInterval(_tick, 500);
}

export function stopRulesEngine() {
  _state = "IDLE";
  if (_intervalId) clearInterval(_intervalId);
  _intervalId = null;
  _lastBadStateAt = null;
}

// ── Called by CameraMonitor with detected state ──────────────
export function reportCameraState(cameraState) {
  _currentCameraState = cameraState;

  // Instant violations
  if (_state !== "MONITORING") return;

  if (cameraState === "PHONE_USAGE") {
    _fireViolation("PHONE_USAGE", "📵 PHONE DETECTED — Instant Violation!");
    return;
  }

  if (cameraState === "CAMERA_BLOCKED") {
    _fireViolation("CAMERA_BLOCKED", "🚫 Camera blocked — Violation logged.");
    return;
  }

  // For DISTRACTION / ABSENT: start timer
  if (cameraState === "DISTRACTION" || cameraState === "ABSENT") {
    if (!_lastBadStateAt) {
      _lastBadStateAt = Date.now();
      _pendingViolationType =
        cameraState === "ABSENT" ? "ABSENT" : "DISTRACTION";
    }
  } else {
    // Good state — reset timer
    _lastBadStateAt = null;
    _pendingViolationType = null;
    if (_onAlert) _onAlert(null, null); // clear alert
  }
}

// ── Tab/window events ────────────────────────────────────────
export async function reportTabSwitch() {
  if (_state !== "MONITORING") return;
  await _fireViolation("TAB_SWITCH", "🔀 Tab switch detected — Violation logged.");
}

export async function reportAppExit() {
  await _fireViolation("APP_EXIT", "🚪 App closed during session — Violation logged.");
}

// ── Tick: check time-based violations ────────────────────────
async function _tick() {
  if (_state !== "MONITORING" || !_lastBadStateAt) return;

  const elapsed = Date.now() - _lastBadStateAt;

  if (_pendingViolationType === "ABSENT") {
    if (elapsed >= ABSENT_VIOLATION_MS) {
      await _fireViolation("ABSENT", "👻 Not at desk — Violation logged.");
      _lastBadStateAt = null;
    } else if (_onAlert) {
      _onAlert(`Not detected — violation in ${Math.ceil((ABSENT_VIOLATION_MS - elapsed) / 1000)}s`, "warning");
    }
    return;
  }

  if (_pendingViolationType === "DISTRACTION") {
    if (elapsed >= DISTRACTION_VIOLATION_MS) {
      await _fireViolation("DISTRACTION", "👀 Distracted too long — Violation logged.");
      _lastBadStateAt = null;
    } else if (elapsed >= DISTRACTION_WARNING_MS) {
      if (_onAlert) _onAlert("⚠️ Focus! Distraction violation incoming...", "warning");
    }
    return;
  }
}

// ── Internal fire ────────────────────────────────────────────
async function _fireViolation(type, message) {
  try {
    await logViolation(type);
  } catch (e) {
    console.error("Failed to log violation:", e);
  }
  if (_onAlert) _onAlert(message, "violation");
}
