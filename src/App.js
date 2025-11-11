// src/App.js
import React, { useEffect, useRef, useState } from "react";
import Dashboard from "./components/Dashboard";
import CellGrid from "./components/CellGrid";
import TimeSeriesCharts from "./components/TimeSeriesCharts";
import Footer from "./components/Footer";
import { db } from "./firebase";
import { ref as dbRef, onValue } from "firebase/database";

const MAX_HISTORY = 90;

/* small helper that extracts numeric value from strings like '323V' or '15A' */
function parseNum(s) {
  if (s == null) return null;
  if (typeof s === "number") return s;
  const m = String(s).match(/-?[\d.]+/);
  return m ? parseFloat(m[0]) : null;
}

/* normalize payload shapes for Firebase BMS structure */
function normalizePayload(raw) {
  if (!raw || typeof raw !== "object") return raw;
  const p = { ...raw };

  // timestamp normalization -> ms since epoch
  if (p.timestamp != null) {
    const ts =
      typeof p.timestamp === "string" ? parseInt(p.timestamp, 10) : p.timestamp;
    p.timestamp = Number.isFinite(ts) ? ts : Date.now();
  } else {
    p.timestamp = Date.now();
  }

  // Build dashboard object from BMS data
  if (!p.dashboard) {
    p.dashboard = {};

    // Pack voltage from totalPackVoltage
    if (p.totalPackVoltage != null) {
      const pack = parseFloat(p.totalPackVoltage);
      p.dashboard.PackVoltage = Number.isFinite(pack)
        ? `${pack.toFixed(2)}V`
        : String(p.totalPackVoltage);
    } else if (p.packVoltage != null) {
      p.dashboard.PackVoltage = String(p.packVoltage);
    }

    // SOC mapping
    if (p.SOC != null) {
      p.dashboard.SOC = Math.round(Number(p.SOC));
    } else if (p.soc != null) {
      p.dashboard.SOC = Math.round(Number(p.soc));
    }

    // SOH - default to 100 if not provided
    if (p.SOH != null) {
      p.dashboard.SOH = Math.round(Number(p.SOH));
    } else {
      p.dashboard.SOH = 100;
    }

    // Current mapping
    if (p.current != null) {
      const curr = parseFloat(p.current);
      p.dashboard.CurrentAmps = Number.isFinite(curr)
        ? `${curr.toFixed(2)}A`
        : String(p.current);
    } else if (p.CurrentAmps) {
      p.dashboard.CurrentAmps = String(p.CurrentAmps);
    }
  }

  // Build systemStatus from faults object
  if (!p.systemStatus && p.faults) {
    p.systemStatus = {
      Overvoltage: !p.faults.voltage, // fault=false means OK=true
      Overcurrent: !p.faults.current, // fault=false means OK=true
      Overtemp: !p.faults.temperature, // fault=false means OK=true
      ShortCircuit: true, // default to OK if not specified
    };
  }

  // Normalize voltages into cellVoltages[] array
  if (!Array.isArray(p.cellVoltages)) {
    const voltArray = [];

    // Case: voltages object with keys V1..V8
    if (p.voltages && typeof p.voltages === "object") {
      for (let i = 1; i <= 32; i++) {
        const key = `V${i}`;
        if (Object.prototype.hasOwnProperty.call(p.voltages, key)) {
          const v = parseFloat(p.voltages[key]);
          if (Number.isFinite(v)) voltArray.push(v);
        } else {
          if (i > 8) break; // stop after trying V1-V8
        }
      }
    }

    // Fallback: voltages stored as root keys V1..Vn
    if (voltArray.length === 0) {
      for (let i = 1; i <= 32; i++) {
        const key1 = `V${i}`;
        const key2 = `v${i}`;
        if (Object.prototype.hasOwnProperty.call(p, key1)) {
          const v = parseFloat(p[key1]);
          if (Number.isFinite(v)) voltArray.push(v);
        } else if (Object.prototype.hasOwnProperty.call(p, key2)) {
          const v = parseFloat(p[key2]);
          if (Number.isFinite(v)) voltArray.push(v);
        }
      }
    }

    if (voltArray.length > 0) p.cellVoltages = voltArray;
  }

  // Normalize temperatures into array of {time, value}
  if (!Array.isArray(p.temperatures)) {
    const temps = [];

    // Case: temperatures object with keys T1..T8
    if (p.temperatures && typeof p.temperatures === "object") {
      for (let i = 1; i <= 32; i++) {
        const key = `T${i}`;
        if (Object.prototype.hasOwnProperty.call(p.temperatures, key)) {
          const v = parseFloat(p.temperatures[key]);
          if (Number.isFinite(v)) temps.push({ time: i - 1, value: v });
        } else {
          if (i > 8) break;
        }
      }
    }

    // Fallback: T1..Tn at root level
    if (temps.length === 0) {
      for (let i = 1; i <= 32; i++) {
        const key = `T${i}`;
        if (Object.prototype.hasOwnProperty.call(p, key)) {
          const v = parseFloat(p[key]);
          if (Number.isFinite(v)) temps.push({ time: i - 1, value: v });
        }
      }
    }

    if (temps.length > 0) p.temperatures = temps;
  }

  return p;
}

/* ---------------------------
   App component
   --------------------------- */
export default function App() {
  const [latest, setLatest] = useState(null);
  const [connected, setConnected] = useState(false);

  // expose firebase helpers for debugging
  useEffect(() => {
    window.db = db;
    window.ref = dbRef;
    window.onValue = onValue;
    console.log(
      "✅ Firebase DB + helpers exposed as window.db / window.ref / window.onValue"
    );
  }, []);

  // history used by TimeSeriesCharts
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

  // process incoming payload and update UI + history
  const handlePayload = (payloadRaw) => {
    if (!payloadRaw) return;
    const payload = normalizePayload(payloadRaw);
    if (!payload) return;

    // keep a copy for UI
    setLatest(payload);

    // compute derived values for charts
    const now = payload.timestamp || Date.now();
    const packParsed =
      parseNum(payload.computed?.packVoltageV) ??
      parseNum(payload.dashboard?.PackVoltage);
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

  // manual fetch (REST) fallback that reads the RTDB /BMS JSON
  const fetchNow = async () => {
    try {
      const dbUrl = db.app.options.databaseURL.replace(/\/$/, "");
      const url = `${dbUrl}/BMS.json`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        console.warn("fetchNow: response not OK", res.status);
        return;
      }
      const json = await res.json();
      handlePayload(json);
      console.info("✅ fetchNow: UI refreshed from Firebase REST");
    } catch (e) {
      console.warn("fetchNow failed:", e);
    }
  };

  // subscribe to RTDB path BMS
  useEffect(() => {
    const latestRef = dbRef(db, "BMS");

    const unsub = onValue(
      latestRef,
      (snapshot) => {
        const val = snapshot.val();
        if (val) {
          handlePayload(val);
          setConnected(true);
          console.log("✅ Firebase data received:", val);
        } else {
          setConnected(true);
          console.log("⚠️ Connected but no data in BMS path");
        }
      },
      (err) => {
        console.error("❌ Firebase onValue error:", err);
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
    <div className="container">
      <header className="header">
        <div className="brand">
          <div className="logo">⚡</div>
          <div>
            <div className="title">Flash BMS Monitor</div>
            <div className="meta">
              Real-time •{" "}
              {latest ? new Date(latest.timestamp).toLocaleString() : "—"}
            </div>
          </div>
        </div>

        <div className="meta">
          {connected ? "🟢 Connected (RTDB)" : "🔴 Disconnected"}
        </div>
      </header>

      <div className="panel top-panel">
        <div
          className={`left-rings ${
            latest?.dashboard?.PackVoltage &&
            /charge/i.test(String(latest.dashboard.PackVoltage))
              ? "charging"
              : ""
          }`}
        >
          <div className="ring-wrap">
            <Dashboard
              dashboard={latest?.dashboard}
              systemStatus={latest?.systemStatus}
              onRefresh={fetchNow}
            />
          </div>
        </div>
      </div>

      <div className="cell-panel panel">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700 }}>Cell Monitoring</div>
        </div>

        <div className="cell-grid">
          <CellGrid voltages={latest?.cellVoltages ?? []} />
        </div>

        <div className="legend">
          <div>
            <span className="legend-dot green" /> ≥3.20V (green)
          </div>
          <div>
            <span className="legend-dot yellow" /> 3.00–3.19V (yellow)
          </div>
          <div>
            <span className="legend-dot red" /> &lt;3.00V (red)
          </div>
        </div>
      </div>

      <div className="panel timeseries-panel">
        <TimeSeriesCharts history={historyForUI} />
      </div>

      <Footer
        guide="Dr. Sumita Motade"
        team={["Omkar Kolhe", "Vipin Jain", "Samyak Bakliwal"]}
      />
    </div>
  );
}
