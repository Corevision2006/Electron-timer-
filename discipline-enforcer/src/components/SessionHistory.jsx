import React from "react";

const STATUS_COLOR = {
  COMPLETED: "text-green-400",
  BROKEN:    "text-brand-red",
  ACTIVE:    "text-yellow-400",
};

const STATUS_ICON = {
  COMPLETED: "✓",
  BROKEN:    "✗",
  ACTIVE:    "●",
};

function formatDuration(start, end) {
  if (!start || !end) return "—";
  const s = start.toDate ? start.toDate() : new Date(start);
  const e = end.toDate   ? end.toDate()   : new Date(end);
  const mins = Math.round((e - s) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function SessionHistory({ sessions }) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="bg-brand-panel border border-brand-border rounded-lg p-8 text-center">
        <p className="font-mono text-brand-muted text-sm">No sessions yet. Start studying.</p>
      </div>
    );
  }

  return (
    <div className="bg-brand-panel border border-brand-border rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-brand-border">
        <h3 className="font-mono text-brand-text text-xs tracking-widest uppercase">
          // Session History
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-brand-border">
              {["Date", "Duration", "Status", "Violations", "Score"].map((h) => (
                <th
                  key={h}
                  className="px-6 py-3 text-left font-mono text-brand-muted text-xs tracking-widest uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => {
              const score = Math.max(0, 100 - (s.totalViolations || 0) * 10);
              return (
                <tr
                  key={s.id}
                  className="border-b border-brand-border/50 hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-brand-text text-xs">
                    {formatDate(s.startTime)}
                  </td>
                  <td className="px-6 py-4 font-mono text-brand-text text-xs">
                    {formatDuration(s.startTime, s.endTime)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`font-mono text-xs tracking-wider ${
                        STATUS_COLOR[s.status] || "text-brand-muted"
                      }`}
                    >
                      {STATUS_ICON[s.status]} {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-brand-text">
                    {s.totalViolations ?? 0}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`font-mono text-xs font-bold ${
                        score >= 70
                          ? "text-green-400"
                          : score >= 40
                          ? "text-yellow-400"
                          : "text-brand-red"
                      }`}
                    >
                      {score}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
