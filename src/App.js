// src/App.js
import React, { useEffect, useRef, useState } from "react";
import Dashboard from "./components/Dashboard";
import CellGrid from "./components/CellGrid";
import TemperatureGrid from "./components/TemperatureGrid";
import TimeSeriesCharts from "./components/TimeSeriesCharts";
import Footer from "./components/Footer";
import { db } from "./firebase";
import { ref as dbRef, onValue } from "firebase/database";

const MAX_HISTORY = 90;

// Flash BMS Logo SVG
const FlashLogo = () => (
  <svg
    width="120"
    height="60"
    viewBox="0 0 200 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: "#4f8cff", stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: "#2bd48a", stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <text
      x="10"
      y="35"
      style={{
        fill: "url(#textGrad)",
        fontFamily: "Arial, sans-serif",
        fontWeight: 900,
        fontSize: 32,
      }}
    >
      FLASH
    </text>
    <text
      x="10"
      y="75"
      style={{
        fill: "url(#textGrad)",
        fontFamily: "Arial, sans-serif",
        fontWeight: 900,
        fontSize: 32,
      }}
    >
      BMS
    </text>
    <polygon
      points="140,20 120,50 130,50 110,80 135,50 125,50"
      fill="#ffb86b"
      stroke="#ff9b3d"
      strokeWidth="2"
    />
  </svg>
);

function parseNum(s) {
  if (s == null) return null;
  if (typeof s === "number") return s;
  const m = String(s).match(/-?[\d.]+/);
  return m ? parseFloat(m[0]) : null;
}

function normalizePayload(raw) {
  if (!raw || typeof raw !== "object") return raw;
  const p = { ...raw };

  if (p.timestamp != null) {
    const ts =
      typeof p.timestamp === "string" ? parseInt(p.timestamp, 10) : p.timestamp;
    p.timestamp = Number.isFinite(ts) ? ts : Date.now();
  } else {
    p.timestamp = Date.now();
  }

  if (!p.dashboard) {
    p.dashboard = {};

    if (p.totalPackVoltage != null) {
      const pack = parseFloat(p.totalPackVoltage);
      p.dashboard.PackVoltage = Number.isFinite(pack)
        ? `${pack.toFixed(2)}V`
        : String(p.totalPackVoltage);
    }

    if (p.SOC != null) p.dashboard.SOC = Math.round(Number(p.SOC));
    if (p.SOH != null) p.dashboard.SOH = Math.round(Number(p.SOH));
    else p.dashboard.SOH = 100;

    if (p.current != null) {
      const curr = parseFloat(p.current);
      p.dashboard.CurrentAmps = Number.isFinite(curr)
        ? `${curr.toFixed(2)}A`
        : String(p.current);
    }
  }

  if (!p.systemStatus && p.faults) {
    p.systemStatus = {
      Overvoltage: !p.faults.voltage,
      Overcurrent: !p.faults.current,
      Overtemp: !p.faults.temperature,
      DeltaVoltage: !p.faults.deltaVoltage,
    };
  }

  if (
    !Array.isArray(p.cellVoltages) &&
    p.voltages &&
    typeof p.voltages === "object"
  ) {
    const voltArray = [];
    for (let i = 1; i <= 32; i++) {
      const key = `V${i}`;
      if (Object.prototype.hasOwnProperty.call(p.voltages, key)) {
        const v = parseFloat(p.voltages[key]);
        if (Number.isFinite(v)) voltArray.push(v);
      } else if (i > 8) break;
    }
    if (voltArray.length > 0) p.cellVoltages = voltArray;
  }

  if (
    !Array.isArray(p.temperatures) &&
    p.temperatures &&
    typeof p.temperatures === "object"
  ) {
    const temps = [];
    for (let i = 1; i <= 32; i++) {
      const key = `T${i}`;
      if (Object.prototype.hasOwnProperty.call(p.temperatures, key)) {
        const v = parseFloat(p.temperatures[key]);
        if (Number.isFinite(v)) temps.push({ time: i - 1, value: v });
      } else if (i > 8) break;
    }
    if (temps.length > 0) p.temperatures = temps;
  }

  return p;
}

export default function App() {
  const [latest, setLatest] = useState(null);
  const [connected, setConnected] = useState(false);

  const historyRef = useRef({
    times: [],
    pack: [],
    avgCell: [],
    temp: [],
    soc: [],
    current: [],
  });

  const pushHistory = (sample) => {
    const h = historyRef.current;
    h.times.push(sample.time);
    h.pack.push(sample.pack ?? null);
    h.avgCell.push(sample.avgCell ?? null);
    h.temp.push(sample.temp ?? null);
    h.soc.push(sample.soc ?? null);
    h.current.push(sample.current ?? null);
    while (h.times.length > MAX_HISTORY) {
      h.times.shift();
      h.pack.shift();
      h.avgCell.shift();
      h.temp.shift();
      h.soc.shift();
      h.current.shift();
    }
  };

  const handlePayload = (payloadRaw) => {
    if (!payloadRaw) return;
    const payload = normalizePayload(payloadRaw);
    if (!payload) return;

    setLatest(payload);

    const now = payload.timestamp || Date.now();
    const packParsed = parseNum(payload.dashboard?.PackVoltage);
    const cells = Array.isArray(payload.cellVoltages)
      ? payload.cellVoltages.map(parseNum).filter(Number.isFinite)
      : [];
    const avgCell = cells.length
      ? cells.reduce((a, b) => a + b, 0) / cells.length
      : null;
    const temps = Array.isArray(payload.temperatures)
      ? payload.temperatures
          .map((t) => parseNum(t?.value))
          .filter(Number.isFinite)
      : [];
    const avgTemp = temps.length
      ? temps.reduce((a, b) => a + b, 0) / temps.length
      : null;
    const soc = parseNum(payload.dashboard?.SOC);
    const current = parseNum(payload.dashboard?.CurrentAmps);

    pushHistory({
      time: now,
      pack: packParsed,
      avgCell,
      temp: avgTemp,
      soc,
      current,
    });
  };

  const fetchNow = async () => {
    try {
      const dbUrl = db.app.options.databaseURL.replace(/\/$/, "");
      const url = `${dbUrl}/BMS.json`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      handlePayload(json);
      console.info("✅ Data refreshed");
    } catch (e) {
      console.warn("Fetch failed:", e);
    }
  };

  useEffect(() => {
    const latestRef = dbRef(db, "BMS");
    const unsub = onValue(
      latestRef,
      (snapshot) => {
        const val = snapshot.val();
        if (val) {
          handlePayload(val);
          setConnected(true);
        }
      },
      (err) => {
        console.error("Firebase error:", err);
        setConnected(false);
      }
    );
    return () => unsub();
  }, []);

  const historyForUI = {
    timestamps: historyRef.current.times,
    pack: historyRef.current.pack,
    avgCell: historyRef.current.avgCell,
    temp: historyRef.current.temp,
    soc: historyRef.current.soc,
    current: historyRef.current.current,
  };

  return (
    <div className="app-container">
      <div className="app-content">
        {/* Header */}
        <header className="app-header">
          <div className="header-left">
            <FlashLogo />
            <div className="header-info">
              <h1 className="header-title">Flash BMS Monitor</h1>
              <p className="header-subtitle">
                Real-time Battery Management System
              </p>
            </div>
          </div>
          <div className="header-right">
            <div
              className={`connection-badge ${
                connected ? "connected" : "disconnected"
              }`}
            >
              <span className="connection-dot"></span>
              <span className="connection-text">
                {connected ? "Connected" : "Disconnected"}
              </span>
            </div>
            <div className="timestamp-display">
              {latest ? new Date(latest.timestamp).toLocaleString() : "—"}
            </div>
          </div>
        </header>

        {/* Dashboard */}
        <div className="section-container">
          <Dashboard
            dashboard={latest?.dashboard}
            systemStatus={latest?.systemStatus}
            fans={latest?.fans}
            vMax={latest?.vMax}
            vMin={latest?.vMin}
            vDelta={latest?.vDelta}
            tMax={latest?.tMax}
            tMin={latest?.tMin}
            onRefresh={fetchNow}
          />
        </div>

        {/* Cell Voltages */}
        <div className="section-container">
          <div className="section-header">
            <h3 className="section-title">⚡ Cell Voltages</h3>
          </div>
          <CellGrid voltages={latest?.cellVoltages ?? []} />
          <div className="legend-row">
            <div className="legend-item">
              <span className="legend-dot green"></span>
              <span>≥3.20V Optimal</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot yellow"></span>
              <span>3.00-3.19V Warning</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot red"></span>
              <span>&lt;3.00V Critical</span>
            </div>
          </div>
        </div>

        {/* Temperature Sensors */}
        <div className="section-container">
          <div className="section-header">
            <h3 className="section-title">🌡️ Temperature Sensors</h3>
          </div>
          <TemperatureGrid temperatures={latest?.temperatures ?? []} />
          <div className="legend-row">
            <div className="legend-item">
              <span className="legend-dot temp-critical"></span>
              <span>≥40°C Critical</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot temp-high"></span>
              <span>30-39°C High</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot temp-normal"></span>
              <span>20-29°C Normal</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot temp-cool"></span>
              <span>10-19°C Cool</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot temp-cold"></span>
              <span>&lt;10°C Cold</span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="section-container">
          <div className="section-header">
            <h3 className="section-title">📊 Historical Trends</h3>
          </div>
          <TimeSeriesCharts history={historyForUI} />
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
