// src/components/Dashboard.js
import React from "react";
import CircularProgress from "./CircularProgress";

/* Small presentational helper: InfoCard */
function InfoCard({ title, value, sub }) {
  return (
    <div className="info-card improved" role="group" aria-label={title}>
      <div className="info-title">{title}</div>
      <div className="info-value">{value}</div>
      {sub && <div className="info-sub">{sub}</div>}
    </div>
  );
}

/* StatusChip: uses semantic role and accessible label */
function StatusChip({ label, ok }) {
  return (
    <div
      className={`status-chip ${ok ? "ok" : "bad"}`}
      role="status"
      aria-pressed={ok}
      aria-label={`${label}: ${ok ? "OK" : "ALARM"}`}
    >
      <div className="status-label">{label}</div>
      <div className="status-icon" aria-hidden>
        {ok ? "✔" : "✖"}
      </div>
    </div>
  );
}

/* Dashboard main component
   - Accepts onRefresh prop: a function to perform an immediate refresh.
   - If onRefresh isn't provided, falls back to dispatching ui-refresh event.
*/
export default function Dashboard({
  dashboard = {},
  systemStatus = {},
  onRefresh,
}) {
  const SOC = dashboard?.SOC ?? 0;
  const SOH = dashboard?.SOH ?? 0;
  const pack = dashboard?.PackVoltage ?? "—";
  const current = dashboard?.CurrentAmps ?? "—";
  const timestamp = dashboard?.timestamp ?? null;
  const isCharging = typeof pack === "string" && /charge/i.test(pack);

  const handleRefreshClick = () => {
    if (typeof onRefresh === "function") {
      try {
        onRefresh();
      } catch (e) {
        // fallback to event dispatch if callback throws
        window.dispatchEvent(new CustomEvent("ui-refresh"));
      }
    } else {
      // fallback: older code path (keeps backward compatibility)
      window.dispatchEvent(new CustomEvent("ui-refresh"));
    }
  };

  return (
    <div className="top-card" aria-label="BMS dashboard">
      {/* LEFT: Large SOC / SOH rings */}
      <div className="top-left">
        <div className={`rings ${isCharging ? "charging" : ""}`} aria-hidden>
          <div className="ring-item">
            <CircularProgress
              size={150}
              stroke={14}
              percentage={SOC}
              color1="#5da6ff"
              color2="#7bb3ff"
              label="SOC"
            />
          </div>

          <div className="ring-item">
            <CircularProgress
              size={150}
              stroke={14}
              percentage={SOH}
              color1="#2bd48a"
              color2="#58f1b0"
              label="SOH"
            />
          </div>
        </div>
      </div>

      {/* MIDDLE: Pack + Current + actions */}
      <div className="top-mid">
        <div className="mid-grid" role="region" aria-label="Pack information">
          <InfoCard
            title="Pack Voltage"
            value={<span className="pack-large">{pack}</span>}
            sub={
              isCharging ? (
                <span className="charging-pill">Charging</span>
              ) : null
            }
          />
          <InfoCard
            title="Current"
            value={<span className="pack-large">{current}</span>}
          />
        </div>

        <div className="mid-actions" aria-hidden>
          <button
            className="btn-ghost"
            onClick={handleRefreshClick}
            title="Refresh UI"
          >
            Refresh UI
          </button>

          <div className="small-note">
            Live • {timestamp ? new Date(timestamp).toLocaleString() : "—"}
          </div>
        </div>
      </div>

      {/* RIGHT: vertical status chips */}
      <div
        className="top-right"
        role="complementary"
        aria-label="System status"
      >
        <div className="chips-vertical">
          <StatusChip label="Overvoltage" ok={!!systemStatus?.Overvoltage} />
          <StatusChip label="Overcurrent" ok={!!systemStatus?.Overcurrent} />
          <StatusChip label="Overtemp" ok={!!systemStatus?.Overtemp} />
          <StatusChip label="ShortCircuit" ok={!!systemStatus?.ShortCircuit} />
        </div>
      </div>
    </div>
  );
}
