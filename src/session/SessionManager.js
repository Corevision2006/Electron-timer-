import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  increment,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../firebase/config";

// ── Module-level state ──────────────────────────────────────
let _activeSessionId = null;

// ── Getters ─────────────────────────────────────────────────
export function getActiveSessionId() {
  return _activeSessionId;
}

export function isSessionActive() {
  return _activeSessionId !== null;
}

// ── Session lifecycle ────────────────────────────────────────
export async function startSession() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");

  const ref = await addDoc(collection(db, "sessions"), {
    userId:          uid,
    startTime:       serverTimestamp(),
    endTime:         null,
    status:          "ACTIVE",
    totalViolations: 0,
  });

  _activeSessionId = ref.id;

  // Notify Electron if available
  if (window.electronAPI) {
    window.electronAPI.setSessionActive(true);
  }

  return ref.id;
}

export async function endSession(status = "COMPLETED") {
  if (!_activeSessionId) return;

  await updateDoc(doc(db, "sessions", _activeSessionId), {
    endTime: serverTimestamp(),
    status,
  });

  _activeSessionId = null;

  if (window.electronAPI) {
    window.electronAPI.setSessionActive(false);
  }
}

// ── Violations ───────────────────────────────────────────────
export async function logViolation(type) {
  const uid = auth.currentUser?.uid;
  if (!uid || !_activeSessionId) return;

  const VALID_TYPES = [
    "APP_EXIT", "PHONE_USAGE", "DISTRACTION",
    "ABSENT", "TAB_SWITCH", "CAMERA_BLOCKED",
  ];

  if (!VALID_TYPES.includes(type)) {
    console.warn("Unknown violation type:", type);
    return;
  }

  // Write violation document
  await addDoc(collection(db, "violations"), {
    userId:    uid,
    sessionId: _activeSessionId,
    type,
    timestamp: serverTimestamp(),
  });

  // Atomically increment session counter
  await updateDoc(doc(db, "sessions", _activeSessionId), {
    totalViolations: increment(1),
  });
}

// ── Queries ──────────────────────────────────────────────────
export async function fetchRecentSessions(limitCount = 10) {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  const q = query(
    collection(db, "sessions"),
    where("userId", "==", uid),
    orderBy("startTime", "desc"),
    limit(limitCount)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchSessionViolations(sessionId) {
  const uid = auth.currentUser?.uid;
  if (!uid || !sessionId) return [];

  const q = query(
    collection(db, "violations"),
    where("sessionId", "==", sessionId),
    orderBy("timestamp", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchAllViolations(limitCount = 50) {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  const q = query(
    collection(db, "violations"),
    where("userId", "==", uid),
    orderBy("timestamp", "desc"),
    limit(limitCount)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ── Score calculation ────────────────────────────────────────
export function computeScore(violations) {
  const PENALTY = {
    APP_EXIT:       30,
    PHONE_USAGE:    25,
    DISTRACTION:    10,
    ABSENT:         15,
    TAB_SWITCH:     20,
    CAMERA_BLOCKED: 5,
  };
  const total = violations.reduce((acc, v) => acc + (PENALTY[v.type] || 10), 0);
  return Math.max(0, 100 - total);
}
