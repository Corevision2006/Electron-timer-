import { useState, useEffect, useRef, useCallback } from "react";
import {
  startSession,
  endSession,
  logViolation,
  isSessionActive,
  fetchRecentSessions,
  computeScore,
} from "../session/SessionManager";
import {
  startRulesEngine,
  stopRulesEngine,
  reportTabSwitch,
  reportAppExit,
} from "../session/RulesEngine";
import { startCameraMonitor, stopCameraMonitor } from "../monitoring/CameraMonitor";

export function useSession() {
  const [active, setActive]       = useState(false);
  const [alert, setAlert]         = useState(null);   // { message, severity }
  const [violations, setViolations] = useState(0);
  const [elapsed, setElapsed]     = useState(0);      // seconds
  const [sessions, setSessions]   = useState([]);
  const timerRef                  = useRef(null);
  const startTimeRef              = useRef(null);

  // ── Alert handler from RulesEngine ──────────────────────
  const handleAlert = useCallback((message, severity) => {
    if (!message) { setAlert(null); return; }
    setAlert({ message, severity });
    setViolations((v) => v + (severity === "violation" ? 1 : 0));
    if (severity === "violation") {
      // auto-clear after 4s
      setTimeout(() => setAlert(null), 4000);
    }
  }, []);

  // ── Start session ────────────────────────────────────────
  const begin = useCallback(async () => {
    await startSession();
    setActive(true);
    setViolations(0);
    setElapsed(0);
    startTimeRef.current = Date.now();

    startRulesEngine(handleAlert);
    await startCameraMonitor();

    // Elapsed timer
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, [handleAlert]);

  // ── End session ──────────────────────────────────────────
  const finish = useCallback(async (status = "COMPLETED") => {
    stopRulesEngine();
    stopCameraMonitor();
    clearInterval(timerRef.current);
    await endSession(status);
    setActive(false);
    setAlert(null);
    await refreshSessions();
  }, []);

  // ── Refresh session history ──────────────────────────────
  const refreshSessions = useCallback(async () => {
    try {
      const data = await fetchRecentSessions(15);
      setSessions(data);
    } catch (e) {
      console.error("Failed to fetch sessions:", e);
    }
  }, []);

  // ── Tab visibility change ────────────────────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && isSessionActive()) {
        reportTabSwitch();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // ── Electron IPC listeners ───────────────────────────────
  useEffect(() => {
    if (!window.electronAPI) return;

    const handleForceExit = async () => {
      await logViolation("APP_EXIT");
      await endSession("BROKEN");
      window.electronAPI.violationLogged();
    };

    const handleMinimized = () => {
      if (isSessionActive()) handleAlert("⚠️ App minimized — violation logged.", "violation");
      logViolation("TAB_SWITCH");
    };

    window.electronAPI.onAppExitViolation(handleForceExit);
    window.electronAPI.onAppMinimized(handleMinimized);

    return () => {
      window.electronAPI.removeAllListeners("app-exit-violation");
      window.electronAPI.removeAllListeners("app-minimized");
    };
  }, [handleAlert]);

  // ── Load sessions on mount ───────────────────────────────
  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  // ── Cleanup on unmount ───────────────────────────────────
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      stopRulesEngine();
      stopCameraMonitor();
    };
  }, []);

  return {
    active,
    alert,
    violations,
    elapsed,
    sessions,
    begin,
    finish,
    refreshSessions,
    computeScore,
  };
}
