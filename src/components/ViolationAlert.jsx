import React from "react";

const ICONS = {
  APP_EXIT:       "🚪",
  PHONE_USAGE:    "📵",
  DISTRACTION:    "👀",
  ABSENT:         "👻",
  TAB_SWITCH:     "🔀",
  CAMERA_BLOCKED: "🚫",
};

export default function ViolationAlert({ alert }) {
  if (!alert) return null;

  const isViolation = alert.severity === "violation";

  return (
    <div
      className={`
        fixed top-0 left-0 right-0 z-50 flex items-center justify-center
        transition-all duration-300 animate-slide-up
        ${isViolation ? "animate-pulse-red" : ""}
      `}
    >
      <div
        className={`
          w-full max-w-2xl mx-4 mt-4 rounded-lg border px-6 py-4
          flex items-center gap-4 font-mono text-sm
          ${isViolation
            ? "bg-brand-red/20 border-brand-red text-white"
            : "bg-yellow-900/20 border-yellow-600 text-yellow-300"}
        `}
      >
        <span className="text-2xl">
          {isViolation ? "🚨" : "⚠️"}
        </span>
        <span className="flex-1 tracking-wide">{alert.message}</span>
        {isViolation && (
          <span className="text-brand-red font-bold tracking-widest text-xs">
            VIOLATION
          </span>
        )}
      </div>
    </div>
  );
}
