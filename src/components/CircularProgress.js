import React, { useMemo } from "react";

export default function CircularProgress({
  size = 140,
  stroke = 14,
  percentage = 0,
  color1 = "#4f8cff",
  color2 = "#7bb3ff",
  label,
}) {
  const radius = useMemo(() => (size - stroke) / 2, [size, stroke]);
  const circumference = useMemo(() => 2 * Math.PI * radius, [radius]);
  const pct = Math.max(0, Math.min(100, percentage || 0));
  const offset = useMemo(
    () => circumference - (pct / 100) * circumference,
    [circumference, pct]
  );
  const gradId = `grad-${Math.floor(Math.random() * 1e6)}`;

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color1} />
            <stop offset="100%" stopColor={color2} />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 700ms cubic-bezier(.2,.9,.3,1)",
          }}
        />
      </svg>

      <div
        style={{
          position: "absolute",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 800 }}>{pct}%</div>
        {label && (
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
            {label}
          </div>
        )}
      </div>
    </div>
  );
}
