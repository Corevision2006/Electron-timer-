import React from "react";

export default function StatsCard({ label, value, sub, accent = false }) {
  return (
    <div
      className={`
        bg-brand-panel border rounded-lg p-5 flex flex-col gap-1
        ${accent ? "border-brand-red/50" : "border-brand-border"}
      `}
    >
      <p className="font-mono text-brand-muted text-xs tracking-widest uppercase">
        {label}
      </p>
      <p
        className={`font-display text-4xl tracking-wide ${
          accent ? "text-brand-red" : "text-white"
        }`}
      >
        {value}
      </p>
      {sub && (
        <p className="font-mono text-brand-muted text-xs">{sub}</p>
      )}
    </div>
  );
}
