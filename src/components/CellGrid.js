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
  if (!arr.length) arr = new Array(8).fill(null); // default 8 cells if none
  const cells = arr.map((v, i) => {
    const n = parseNumber(v);
    const display = n !== null && !Number.isNaN(n) ? `${n.toFixed(2)} V` : "—";
    return { idx: i + 1, cls: classFor(n), display };
  });

  return (
    <>
      {cells.map((c) => (
        <div key={c.idx} className={`cell ${c.cls}`}>
          <div className="volt">{c.display}</div>
          <div className="label">Cell {c.idx}</div>
        </div>
      ))}
    </>
  );
}
