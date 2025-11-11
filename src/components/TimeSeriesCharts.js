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
  if (!history || !history.timestamps || history.timestamps.length === 0) {
    return <div className="no-data">No historical data available</div>;
  }

  const data = history.timestamps.map((t, i) => ({
    time: new Date(t).toLocaleTimeString(),
    pack: history.pack[i],
    avgCell: history.avgCell[i],
    temp: history.temp[i],
    soc: history.soc[i],
    current: history.current[i],
  }));

  const chartCardStyle = {
    background: "rgba(12, 19, 30, 0.6)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
  };

  const tooltipStyle = {
    background: "rgba(12,19,30,0.95)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: "8px 12px",
  };

  return (
    <div className="charts-container">
      {/* Voltage Chart */}
      <div style={chartCardStyle}>
        <h4 className="chart-title-modern">⚡ Voltage Trends</h4>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.08)"
            />
            <XAxis dataKey="time" tick={{ fill: "#9fb0d4", fontSize: 12 }} />
            <YAxis tick={{ fill: "#9fb0d4", fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: "#9fb0d4", fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="avgCell"
              stroke="#2bd48a"
              strokeWidth={3}
              dot={false}
              name="Avg Cell V"
            />
            <Line
              type="monotone"
              dataKey="pack"
              stroke="#4f8cff"
              strokeWidth={3}
              dot={false}
              name="Pack V"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Temperature Chart */}
      <div style={chartCardStyle}>
        <h4 className="chart-title-modern">🌡️ Temperature Trends</h4>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.08)"
            />
            <XAxis dataKey="time" tick={{ fill: "#9fb0d4", fontSize: 12 }} />
            <YAxis tick={{ fill: "#9fb0d4", fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: "#9fb0d4", fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="temp"
              stroke="#ffb86b"
              strokeWidth={3}
              dot={false}
              name="Avg Temp °C"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* SOC Chart */}
      <div style={chartCardStyle}>
        <h4 className="chart-title-modern">🔋 State of Charge</h4>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.08)"
            />
            <XAxis dataKey="time" tick={{ fill: "#9fb0d4", fontSize: 12 }} />
            <YAxis tick={{ fill: "#9fb0d4", fontSize: 12 }} domain={[0, 100]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: "#9fb0d4", fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="soc"
              stroke="#7bb3ff"
              strokeWidth={3}
              dot={false}
              name="SOC %"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Current Chart */}
      <div style={chartCardStyle}>
        <h4 className="chart-title-modern">⚡ Current Flow</h4>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.08)"
            />
            <XAxis dataKey="time" tick={{ fill: "#9fb0d4", fontSize: 12 }} />
            <YAxis tick={{ fill: "#9fb0d4", fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: "#9fb0d4", fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="current"
              stroke="#ff6b6b"
              strokeWidth={3}
              dot={false}
              name="Current A"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
