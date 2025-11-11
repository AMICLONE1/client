// src/components/CellGrid.js
import React from "react";

const parseNumber = (v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).trim();
  if (!s) return null;
  const m = s.match(/-?[\d]+(?:\.[\d]+)?/);
  return m ? parseFloat(m[0]) : null;
};

const classFor = (n) => {
  if (n === null || n === undefined || Number.isNaN(n)) return "cell-none";
  if (n >= 3.2) return "cell-green";
  if (n >= 3.0) return "cell-yellow";
  return "cell-red";
};

export default function CellGrid({ voltages = [] }) {
  let arr = Array.isArray(voltages) ? voltages : [];
  if (!arr.length) arr = new Array(8).fill(null);

  return (
    <div className="cell-grid-modern">
      {arr.map((v, i) => {
        const n = parseNumber(v);
        const display =
          n !== null && !Number.isNaN(n) ? `${n.toFixed(3)}V` : "—";
        const cls = classFor(n);

        return (
          <div key={i} className={`cell-modern ${cls}`}>
            <div className="cell-number">#{i + 1}</div>
            <div className="cell-voltage">{display}</div>
            <div className="cell-bar">
              <div
                className="cell-bar-fill"
                style={{
                  width: n ? `${Math.min(100, (n / 4.2) * 100)}%` : "0%",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
