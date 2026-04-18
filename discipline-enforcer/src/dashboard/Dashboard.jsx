import React, { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useSession } from "../hooks/useSession";
import SessionTimer from "../components/SessionTimer";
import StatsCard from "../components/StatsCard";
import ViolationAlert from "../components/ViolationAlert";
import SessionHistory from "../components/SessionHistory";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

export default function Dashboard() {
  const { user, logout }                              = useAuth();
  const { active, alert, violations, elapsed, sessions, begin, finish } = useSession();
  const [ending, setEnding]                           = useState(false);
  const [view, setView]                               = useState("home"); // home | history

  // ── Derived stats ──────────────────────────────────────
  const completedSessions = sessions.filter((s) => s.status === "COMPLETED");
  const brokenSessions    = sessions.filter((s) => s.status === "BROKEN");
  const streak            = computeStreak(sessions);
  const avgScore          = sessions.length
    ? Math.round(
        sessions.reduce(
          (acc, s) => acc + Math.max(0, 100 - (s.totalViolations || 0) * 10),
          0
        ) / sessions.length
      )
    : 0;

  // Chart data — last 7 sessions
  const chartData = sessions.slice(0, 7).reverse().map((s, i) => ({
    name: `S${i + 1}`,
    score: Math.max(0, 100 - (s.totalViolations || 0) * 10),
    violations: s.totalViolations || 0,
    status: s.status,
  }));

  async function handleStart() {
    try {
      await begin();
    } catch (e) {
      console.error("Failed to start session:", e);
    }
  }

  async function handleEnd() {
    setEnding(true);
    try {
      await finish("COMPLETED");
    } catch (e) {
      console.error("Failed to end session:", e);
    } finally {
      setEnding(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark text-white font-body">
      {/* Violation alert */}
      <ViolationAlert alert={alert} />

      {/* Top bar */}
      <header className="border-b border-brand-border px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl tracking-widest text-white">DISCIPLINE</h1>
          <span className="font-mono text-brand-muted text-xs">v1.0</span>
        </div>

        <nav className="flex items-center gap-6">
          {["home", "history"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`font-mono text-xs tracking-widest uppercase transition-colors ${
                view === v ? "text-white" : "text-brand-muted hover:text-brand-text"
              }`}
            >
              {v}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <span className="font-mono text-brand-muted text-xs">{user?.email}</span>
          <button
            onClick={logout}
            className="font-mono text-xs text-brand-muted hover:text-brand-red transition-colors tracking-widest"
          >
            LOGOUT
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-10">

        {/* ── HOME VIEW ──────────────────────────────────── */}
        {view === "home" && (
          <div className="space-y-8 animate-fade-in">

            {/* Timer + controls */}
            <div className="bg-brand-panel border border-brand-border rounded-xl p-10 flex flex-col items-center gap-8">
              <SessionTimer elapsed={elapsed} active={active} />

              {!active ? (
                <button
                  onClick={handleStart}
                  className="bg-brand-red text-white font-display text-2xl tracking-widest px-16 py-4 rounded-lg hover:bg-red-500 transition-all hover:scale-105 active:scale-100"
                >
                  START SESSION
                </button>
              ) : (
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 font-mono text-green-400 text-sm">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block" />
                    MONITORING ACTIVE
                  </div>
                  <button
                    onClick={handleEnd}
                    disabled={ending}
                    className="border border-brand-border text-brand-text font-mono text-xs tracking-widest px-6 py-2 rounded hover:border-brand-red hover:text-brand-red transition-colors disabled:opacity-50"
                  >
                    {ending ? "ENDING..." : "END SESSION"}
                  </button>
                </div>
              )}

              {active && (
                <p className="font-mono text-brand-muted text-xs text-center max-w-sm">
                  Camera monitoring is active. Stay focused. Any distraction, absence,
                  phone use, or tab switch will be logged as a violation.
                </p>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatsCard label="Violations" value={violations} sub="this session" accent={violations > 0} />
              <StatsCard label="Sessions" value={completedSessions.length} sub="completed" />
              <StatsCard label="Streak" value={`${streak}d`} sub="consecutive days" />
              <StatsCard label="Avg Score" value={avgScore} sub="across all sessions" />
            </div>

            {/* Score chart */}
            {chartData.length > 0 && (
              <div className="bg-brand-panel border border-brand-border rounded-xl p-6">
                <h3 className="font-mono text-brand-muted text-xs tracking-widest uppercase mb-6">
                  // Score — Last {chartData.length} Sessions
                </h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} barSize={28}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false}
                      tick={{ fill: "#444", fontFamily: "Share Tech Mono", fontSize: 11 }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false}
                      tick={{ fill: "#444", fontFamily: "Share Tech Mono", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "#111", border: "1px solid #222", borderRadius: 6, fontFamily: "Share Tech Mono", fontSize: 12 }}
                      labelStyle={{ color: "#ccc" }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.score >= 70 ? "#22c55e" : entry.score >= 40 ? "#eab308" : "#FF2D2D"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

          </div>
        )}

        {/* ── HISTORY VIEW ───────────────────────────────── */}
        {view === "history" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-3xl tracking-widest">SESSION HISTORY</h2>
              <div className="flex gap-6 font-mono text-xs text-brand-muted">
                <span>Total: <span className="text-white">{sessions.length}</span></span>
                <span>Broken: <span className="text-brand-red">{brokenSessions.length}</span></span>
                <span>Completed: <span className="text-green-400">{completedSessions.length}</span></span>
              </div>
            </div>
            <SessionHistory sessions={sessions} />
          </div>
        )}

      </main>
    </div>
  );
}

// ── Streak util ──────────────────────────────────────────────
function computeStreak(sessions) {
  if (!sessions.length) return 0;

  const days = new Set(
    sessions
      .filter((s) => s.status === "COMPLETED" && s.startTime)
      .map((s) => {
        const d = s.startTime.toDate ? s.startTime.toDate() : new Date(s.startTime);
        return d.toDateString();
      })
  );

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (days.has(d.toDateString())) streak++;
    else break;
  }
  return streak;
}
