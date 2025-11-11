// src/components/TimeSeriesCharts.js
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function TimeSeriesCharts({ history }) {
  if (!history || !history.timestamps || history.timestamps.length === 0)
    return <div style={{ color: "#9fb0d4" }}>No recent data available</div>;

  const data = history.timestamps.map((t, i) => ({
    time: new Date(t).toLocaleTimeString(),
    pack: history.pack[i],
    avgCell: history.avgCell[i],
    temp: history.temp[i],
    soc: history.soc[i],
    current: history.current[i],
  }));

  const chartCard = (title, children) => (
    <div className="chart-card">
      <h4 className="chart-title">{title}</h4>
      <ResponsiveContainer width="100%" height={200}>
        {children}
      </ResponsiveContainer>
    </div>
  );

  return (
    <div className="charts-grid">
      {/* Voltage */}
      {chartCard(
        "Voltage (V)",
        <LineChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.08)"
          />
          <XAxis dataKey="time" tick={{ fill: "#9fb0d4", fontSize: 12 }} />
          <YAxis tick={{ fill: "#9fb0d4", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              background: "rgba(12,19,30,0.9)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 8,
              color: "#fff",
              fontSize: 13,
            }}
          />
          <Legend wrapperStyle={{ color: "#9fb0d4", fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="avgCell"
            stroke="#2bd48a"
            strokeWidth={2}
            dot={{ r: 3, fill: "#2bd48a" }}
            activeDot={{ r: 6, stroke: "#2bd48a", fill: "#2bd48a" }}
            name="Avg Cell V"
          />
          <Line
            type="monotone"
            dataKey="pack"
            stroke="#4f8cff"
            strokeWidth={2}
            dot={{ r: 3, fill: "#4f8cff" }}
            activeDot={{ r: 6, stroke: "#4f8cff", fill: "#4f8cff" }}
            name="Pack V"
          />
        </LineChart>
      )}

      {/* Temperature */}
      {chartCard(
        "Temperature (°C)",
        <LineChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.08)"
          />
          <XAxis dataKey="time" tick={{ fill: "#9fb0d4", fontSize: 12 }} />
          <YAxis tick={{ fill: "#9fb0d4", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              background: "rgba(12,19,30,0.9)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 8,
              color: "#fff",
              fontSize: 13,
            }}
          />
          <Legend wrapperStyle={{ color: "#9fb0d4", fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="temp"
            stroke="#ffb86b"
            strokeWidth={2}
            dot={{ r: 3, fill: "#ffb86b" }}
            activeDot={{ r: 6, stroke: "#ffb86b", fill: "#ffb86b" }}
            name="Avg Temp"
          />
        </LineChart>
      )}

      {/* SOC */}
      {chartCard(
        "SOC (%)",
        <LineChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.08)"
          />
          <XAxis dataKey="time" tick={{ fill: "#9fb0d4", fontSize: 12 }} />
          <YAxis tick={{ fill: "#9fb0d4", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              background: "rgba(12,19,30,0.9)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 8,
              color: "#fff",
              fontSize: 13,
            }}
          />
          <Legend wrapperStyle={{ color: "#9fb0d4", fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="soc"
            stroke="#7bb3ff"
            strokeWidth={2}
            dot={{ r: 3, fill: "#7bb3ff" }}
            activeDot={{ r: 6, stroke: "#7bb3ff", fill: "#7bb3ff" }}
            name="SOC"
          />
        </LineChart>
      )}

      {/* Current */}
      {chartCard(
        "Current (A)",
        <LineChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.08)"
          />
          <XAxis dataKey="time" tick={{ fill: "#9fb0d4", fontSize: 12 }} />
          <YAxis tick={{ fill: "#9fb0d4", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              background: "rgba(12,19,30,0.9)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 8,
              color: "#fff",
              fontSize: 13,
            }}
          />
          <Legend wrapperStyle={{ color: "#9fb0d4", fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="current"
            stroke="#ff6b6b"
            strokeWidth={2}
            dot={{ r: 3, fill: "#ff6b6b" }}
            activeDot={{ r: 6, stroke: "#ff6b6b", fill: "#ff6b6b" }}
            name="Current"
          />
        </LineChart>
      )}
    </div>
  );
}
