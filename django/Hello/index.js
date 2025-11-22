import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  ScatterController,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Bar, Scatter } from "react-chartjs-2";

// ---- Chart.js setup ----
ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  ScatterController,
  Tooltip,
  Legend,
  Title
);

const blue = "#3fc1c9";
const darkBg = "#161f2a";
const darkPanel = "#222e3c";
const darkText = "#e6eaf1";
const axisColor = "#bde2fc";
const themes = {
  dark: {
    bg: darkBg,
    panel: darkPanel,
    text: darkText,
    axis: axisColor,
    kpiGradient: [
      `linear-gradient(135deg,${blue},#0e2d3c)`,
      `linear-gradient(135deg,#1a2330,#223046)`,
      `linear-gradient(135deg,#193c38,#19647e)`,
      `linear-gradient(135deg,#232b43,#3b2c71)`,
    ],
    border: blue,
    btnBg: "#212d43",
    btnText: blue,
    shadow: `0 6px 24px ${blue}33`,
  },
};

function toNumber(v) {
  const n = Number(String(v).replace(/[^\d.\-eE]/g, ""));
  return Number.isFinite(n) ? n : null;
}
function pretty(val, digits = 2) {
  return val === null || Number.isNaN(val) ? "—" : Number(val).toFixed(digits);
}
function basicStats(nums) {
  const vals = nums.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!vals.length)
    return {
      count: 0,
      min: null,
      max: null,
      mean: null,
      p10: null,
      p50: null,
      p90: null,
    };
  const sum = vals.reduce((a, b) => a + b, 0);
  const mean = sum / vals.length;
  function q(p) {
    const idx = (vals.length - 1) * p;
    const lo = Math.floor(idx),
      hi = Math.ceil(idx);
    if (lo === hi) return vals[lo];
    return vals[lo] + (vals[hi] - vals[lo]) * (idx - lo);
  }
  return {
    count: vals.length,
    min: vals[0],
    max: vals[vals.length - 1],
    mean,
    p10: q(0.1),
    p50: q(0.5),
    p90: q(0.9),
  };
}
function binHistogram(numbers, bins = 10) {
  const vals = numbers.filter(Number.isFinite);
  if (!vals.length) return { labels: [], counts: [] };
  const min = Math.min(...vals),
    max = Math.max(...vals),
    width = (max - min) / bins || 1;
  const counts = Array(bins).fill(0);
  vals.forEach((v) => {
    let idx = Math.floor((v - min) / width);
    idx = idx === bins ? bins - 1 : Math.max(0, Math.min(bins - 1, idx));
    counts[idx] += 1;
  });
  const labels = counts.map(
    (_, i) => `${pretty(min + i * width, 1)}–${pretty(min + (i + 1) * width, 1)}`
  );
  return { labels, counts };
}

function KpiCard({ label, value, hint, gradient, theme }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2, boxShadow: theme.shadow }}
      style={{
        borderRadius: 16,
        color: "white",
        minWidth: 140,
        background: gradient,
        border: `2.5px solid ${themes.dark.border}`,
        boxShadow: theme.shadow,
        transition: "background 0.3s",
        padding: "13px 12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        lineHeight: 1.2,
      }}
    >
      <div style={{ fontSize: 13, opacity: 0.9 }}>{label}</div>
      <div
        style={{
          marginTop: 7,
          fontSize: 25,
          fontWeight: 700,
          letterSpacing: "0.6px",
        }}
      >
        {value}
      </div>
      <div style={{ marginTop: 5, fontSize: 12, opacity: 0.93 }}>{hint}</div>
    </motion.div>
  );
}
function SectionHeader({ title, theme }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <motion.h3
        initial={{ x: -8, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ type: "spring", stiffness: 240, damping: 20 }}
        style={{
          margin: 0,
          color: theme.text,
          fontSize: 16,
          letterSpacing: "0.4px",
        }}
      >
        {title}
      </motion.h3>
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.6 }}
        style={{
          height: 2,
          background: `linear-gradient(90deg,${blue},#06d6a0)`,
          transformOrigin: "left",
          marginTop: 8,
          borderRadius: 2,
        }}
      />
    </div>
  );
}

// ==== MAIN DASHBOARD FUNCTION ====
function Dashboard({ headers, rows, theme }) {
  // index code, calculations (all your previous work)
  const idx = useMemo(() => {
    const lower = headers.map((h) => (h || "").toString().trim().toLowerCase());
    const find = (candidates) =>
      candidates.map((c) => lower.indexOf(c)).find((i) => i !== -1);
    return {
      name: find(["equipment name", "name", "equipment"]) ?? -1,
      type: find(["type", "equipment type", "category"]) ?? -1,
      flow: find(["flowrate", "flow rate", "flow"]) ?? -1,
      press: find(["pressure", "press"]) ?? -1,
      temp: find(["temperature", "temp"]) ?? -1,
    };
  }, [headers]);

  const equipmentTypeCounts = useMemo(() => {
    const map = new Map();
    rows.forEach((r) => {
      const t = idx.type >= 0 ? r[idx.type]?.toString().trim() : "Unknown";
      map.set(t || "Unknown", (map.get(t || "Unknown") || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [rows, idx]);

  const flowVals = useMemo(
    () => (idx.flow >= 0 ? rows.map((r) => toNumber(r[idx.flow])) : []),
    [rows, idx]
  );
  const pressVals = useMemo(
    () => (idx.press >= 0 ? rows.map((r) => toNumber(r[idx.press])) : []),
    [rows, idx]
  );
  const tempVals = useMemo(
    () => (idx.temp >= 0 ? rows.map((r) => toNumber(r[idx.temp])) : []),
    [rows, idx]
  );
  const flowStats = useMemo(() => basicStats(flowVals), [flowVals]);
  const pressStats = useMemo(() => basicStats(pressVals), [pressVals]);
  const tempStats = useMemo(() => basicStats(tempVals), [tempVals]);
  const { labels: flowBins, counts: flowCounts } = useMemo(
    () => binHistogram(flowVals, 10),
    [flowVals]
  );
  const scatterData = useMemo(() => {
    const pts = [];
    rows.forEach((r) => {
      const x = idx.press >= 0 ? toNumber(r[idx.press]) : null;
      const y = idx.temp >= 0 ? toNumber(r[idx.temp]) : null;
      if (Number.isFinite(x) && Number.isFinite(y)) pts.push({ x, y });
    });
    return pts.slice(0, 1000);
  }, [rows, idx]);

  return (
    <div style={{
      minHeight: "70vh",
      padding: "16px 0",
      background: theme.bg,
      color: theme.text,
      transition: "background .3s",
    }}>
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 12
      }}>
        {/* Header/KPI */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 18 }}
          style={{
            background: theme.panel,
            borderRadius: 14,
            padding: "12px 16px",
            boxShadow: theme.shadow,
            border: `2.2px solid ${blue}`,
            marginBottom: "4px"
          }}>
          <h1 style={{
            margin: 0, color: theme.text, fontSize: 28
          }}>
            Chemical Equipment Dashboard
          </h1>
          <div style={{
            marginTop: 4, color: theme.text, fontSize: 14, opacity: 0.83
          }}>
            Overview of Type mix, Flowrate distribution, and Pressure–Temperature relationships.
          </div>
        </motion.div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(120px, 1fr))",
          gap: 8,
          marginBottom: 6
        }}>
          <KpiCard gradient={theme.kpiGradient[0]} theme={theme} label="Total Equipment" value={rows.length} hint="Entries parsed" />
          <KpiCard gradient={theme.kpiGradient[1]} theme={theme} label="Avg Flowrate" value={pretty(flowStats.mean)} hint={`P50 ${pretty(flowStats.p50)} • P90 ${pretty(flowStats.p90)}`} />
          <KpiCard gradient={theme.kpiGradient[2]} theme={theme} label="Avg Pressure" value={pretty(pressStats.mean)} hint={`Min ${pretty(pressStats.min)} • Max ${pretty(pressStats.max)}`} />
          <KpiCard gradient={theme.kpiGradient[3]} theme={theme} label="Avg Temperature" value={pretty(tempStats.mean)} hint={`P10 ${pretty(tempStats.p10)} • P90 ${pretty(tempStats.p90)}`} />
        </div>
        {/* CHARTS ROW, super compact */}
        <div 
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            width: "100%",
            justifyContent: "space-between",
            alignItems: "flex-start"
          }}
        >
          {/* Equipment Type Mix */}
          <motion.div
            initial={{ opacity:0, y: 16 }}
            animate={{ opacity:1, y:0 }}
            transition={{ type:"spring", stiffness:180, damping:18, delay:0.1 }}
            style={{
              background: theme.panel,
              borderRadius: 10,
              padding: 6,
              boxShadow: theme.shadow,
              border: `2px solid ${blue}`,
              minWidth: 200,
              maxWidth: 330,
              flex: "1 1 200px",
              height: 180,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <SectionHeader title="Equipment Type Mix" theme={theme}/>
            <div style={{flex: 1, height: 0, minHeight: 0}}>
            <Bar
              data={{
                labels: equipmentTypeCounts.map(([t]) => t),
                datasets: [{
                  label: "Count",
                  data: equipmentTypeCounts.map(([, c]) => c),
                  backgroundColor: equipmentTypeCounts.map(() => blue + "bb"),
                  borderColor: equipmentTypeCounts.map(() => blue),
                  borderRadius:6,
                }],
              }}
              options={{
                responsive:true,
                maintainAspectRatio:false,
                plugins:{legend:{display:false}},
                scales:{
                  x:{grid:{display:false}, ticks: { color: theme.axis }},
                  y:{grid:{color:"rgba(0,0,0,0.10)"}, beginAtZero:true, ticks: { color: theme.axis }}
                },
                animation:{duration:650,easing:"easeOutQuad"},
              }}
            />
            </div>
          </motion.div>
          {/* Flowrate Distribution */}
          <motion.div
            initial={{ opacity:0, y: 16 }}
            animate={{ opacity:1, y:0 }}
            transition={{ type:"spring", stiffness:180, damping:18, delay:0.12 }}
            style={{
              background:theme.panel,
              borderRadius: 10,
              padding: 6,
              boxShadow: theme.shadow,
              border: `2px solid ${blue}`,
              minWidth: 200,
              maxWidth: 330,
              flex: "1 1 200px",
              height: 180,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <SectionHeader title="Flowrate Distribution" theme={theme}/>
            <div style={{flex: 1, height: 0, minHeight: 0}}>
            <Bar
              data={{
                labels: flowBins,
                datasets: [{
                  label:'Count',
                  data: flowCounts,
                  backgroundColor: blue+"88", borderColor:blue, borderRadius:6
                }]
              }}
              options={{
                responsive:true,
                maintainAspectRatio:false,
                plugins:{legend:{display:false}},
                scales:{
                  x:{grid:{display:false}, ticks: { color: theme.axis }},
                  y:{grid:{color:"rgba(0,0,0,0.11)"}, beginAtZero:true, ticks: { color: theme.axis }}
                },
                animation:{duration:650,easing:"easeOutQuad"}
              }}
            />
            </div>
          </motion.div>
          {/* Pressure vs Temperature Scatter */}
          <motion.div
            initial={{ opacity:0, y:16 }}
            animate={{ opacity:1, y:0 }}
            transition={{ type:"spring", stiffness:180, damping:18, delay:0.13 }}
            style={{
              background:theme.panel,
              borderRadius:10,
              padding:6,
              boxShadow:theme.shadow,
              border:`2px solid ${blue}`,
              minWidth: 200,
              maxWidth: 330,
              flex: "1 1 200px",
              height: 180,
              display: "flex",
              flexDirection: "column",
            }}>
            <SectionHeader title="Pressure vs Temperature" theme={theme}/>
            <div style={{flex: 1, height: 0, minHeight: 0}}>
            <Scatter
              data={{
                datasets: [{
                  label:'Equipment',
                  data: scatterData,
                  backgroundColor: blue,
                  borderColor:blue,
                  pointRadius:3,
                  pointHoverRadius:5,
                }]
              }}
              options={{
                responsive:true,
                maintainAspectRatio:false,
                plugins:{
                  legend:{display:false},
                  tooltip:{callbacks:{label:ctx=>`P: ${pretty(ctx.raw.x)} • T: ${pretty(ctx.raw.y)}`}}
                },
                scales:{
                  x:{title:{display:true,text:"Pressure"},grid:{color:"rgba(0,0,0,0.08)"}, ticks: { color: theme.axis }},
                  y:{title:{display:true,text:"Temperature"},grid:{color:"rgba(0,0,0,0.08)"}, ticks: { color: theme.axis } }
                },
                animation:{duration:650,easing:"easeOutQuad"}
              }}
            />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Call Dashboard in your App and pass in headers/rows/theme as before, for example:
export default Dashboard;
// Or wrap in an App.js with file upload, table toggle, DarkTheme, etc.
