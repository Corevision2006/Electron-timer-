import React from "react";

function pad(n) {
  return String(n).padStart(2, "0");
}

export default function SessionTimer({ elapsed, active }) {
  const hrs  = Math.floor(elapsed / 3600);
  const mins = Math.floor((elapsed % 3600) / 60);
  const secs = elapsed % 60;

  return (
    <div className="text-center">
      <div
        className={`font-display text-7xl tracking-widest transition-colors duration-500 ${
          active ? "text-white" : "text-brand-muted"
        }`}
      >
        {hrs > 0 && <span>{pad(hrs)}:</span>}
        <span>{pad(mins)}</span>
        <span className={`${active ? "opacity-100" : "opacity-30"} transition-opacity`}>
          :{pad(secs)}
        </span>
      </div>
      <p className="font-mono text-brand-muted text-xs tracking-widest mt-1">
        {active ? "SESSION ACTIVE" : "NO SESSION"}
      </p>
    </div>
  );
}
