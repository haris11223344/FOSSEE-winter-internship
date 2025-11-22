import React, { useState, useMemo } from "react";
import ReactDOM from "react-dom/client";
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
import axios from 'axios';

// Add this above or near your main React code
async function uploadCsvToBackend(file) {
  const formData = new FormData();
  formData.append('name', file.name);
  formData.append('file', file);

  try {
    const response = await axios.post(
      'http://127.0.0.1:8000/api/datasets/',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    alert("File uploaded successfully!");
    return response.data;
  } catch (err) {
    alert("Error uploading file: " + err);
    return null;
  }
}


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

// ---- THEME ----
const blue = "#3fc1c9";
const darkBg = "#161f2a";
const darkPanel = "#222e3c";
const darkText = "#e6eaf1";
const lightBg = "#f5f8fa";
const lightPanel = "#fff";
const lightText = "#233142";
const themes = {
  light: {
    bg: lightBg,
    panel: lightPanel,
    text: lightText,
    kpiGradient: [
      `linear-gradient(135deg,${blue},#36a2eb)`,
      `linear-gradient(135deg,#ffd166,#ff9a76)`,
      `linear-gradient(135deg,#06d6a0,#8ac926)`,
      `linear-gradient(135deg,#a78bfa,#6a4c93)`,
    ],
    border: blue,
    btnBg: "#eaf1f4",
    btnText: blue,
    shadow: "0 6px 26px rgba(63,193,201,0.13)",
  },
  dark: {
    bg: darkBg,
    panel: darkPanel,
    text: darkText,
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

// ---- HELPERS ----
function toNumber(v) {
  const n = Number(String(v).replace(/[^\d.\-eE]/g, ""));
  return Number.isFinite(n) ? n : null;
}
function pretty(val, digits = 2) {
  return val === null || Number.isNaN(val) ? "—" : Number(val).toFixed(digits);
}
function basicStats(nums) {
  const vals = nums.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!vals.length) return { count: 0, min: null, max: null, mean: null, p10: null, p50: null, p90: null };
  const sum = vals.reduce((a, b) => a + b, 0);
  const mean = sum / vals.length;
  function q(p) {
    const idx = (vals.length - 1) * p;
    const lo = Math.floor(idx), hi = Math.ceil(idx);
    if (lo === hi) return vals[lo];
    return vals[lo] + (vals[hi] - vals[lo]) * (idx - lo);
  }
  return { count: vals.length, min: vals[0], max: vals[vals.length-1], mean, p10: q(0.1), p50: q(0.5), p90: q(0.9)};
}
function binHistogram(numbers, bins = 10) {
  const vals = numbers.filter(Number.isFinite);
  if (!vals.length) return { labels: [], counts: [] };
  const min = Math.min(...vals), max = Math.max(...vals), width = (max-min)/bins || 1;
  const counts = Array(bins).fill(0);
  vals.forEach((v) => {
    let idx = Math.floor((v-min)/width);
    idx = idx === bins ? bins-1 : Math.max(0, Math.min(bins-1, idx));
    counts[idx] += 1;
  });
  const labels = counts.map((_,i)=>`${pretty(min+i*width,1)}–${pretty(min+(i+1)*width,1)}`);
  return { labels, counts };
}

// ---- KPI, SectionHeader ----
function KpiCard({ label, value, hint, gradient, theme }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2, boxShadow: theme.shadow }}
      style={{
        borderRadius: 16,
        overflow: "hidden",
        color: "white",
        minWidth: 160,
        background: gradient,
        border: `2.5px solid ${themes.dark.border}`,
        boxShadow: theme.shadow,
        transition: "background 0.3s"
      }}
    >
      <div style={{position:"relative",zIndex:2,padding:"16px 16px 18px 16px"}}>
        <div style={{ fontSize: 13, opacity: 0.9 }}>{label}</div>
        <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, letterSpacing: "0.6px"}}>
          {value}
        </div>
        <div style={{marginTop:6,fontSize:12,opacity:0.95}}>{hint}</div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: .32 }}
        transition={{ delay: 0.2 }}
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(600px 150px at 10% 0%, rgba(255,255,255,0.32), transparent 60%)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />
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

// ---- DASHBOARD ----
function Dashboard({ headers, rows, theme }) {
  // Column index detection (case-insensitive)
  const idx = useMemo(() => {
    const lower = headers.map((h) => (h || "").toString().trim().toLowerCase());
    const find = (candidates) =>
      candidates
        .map((c) => lower.indexOf(c))
        .find((i) => i !== -1);
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
    () => binHistogram(flowVals, 12),
    [flowVals]
  );

  const scatterData = useMemo(() => {
    const pts = [];
    rows.forEach((r) => {
      const x = idx.press >= 0 ? toNumber(r[idx.press]) : null;
      const y = idx.temp >= 0 ? toNumber(r[idx.temp]) : null;
      if (Number.isFinite(x) && Number.isFinite(y)) pts.push({ x, y });
    });
    return pts.slice(0, 2000); // cap for performance
  }, [rows, idx]);

  return (
    <div style={{
      minHeight: "80vh",
      padding: "28px",
      background: theme.bg,
      color: theme.text,
      transition: "background .3s",
    }}>
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridAutoRows: "min-content",
        gap: "18px"
      }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 18 }}
          style={{
            gridColumn: "1 / -1",
            background: theme.panel,
            borderRadius: 14,
            padding: "18px 20px",
            boxShadow: theme.shadow,
            border: `2.2px solid ${blue}`,
          }}>
          <h1 style={{
            margin: 0, color: theme.text, letterSpacing: "0.5px"
          }}>
            Chemical Equipment Dashboard
          </h1>
          <div style={{
            marginTop: 6, color: theme.text, fontSize: 14, opacity: 0.86
          }}>
            Overview of Type mix, Flowrate distribution, and Pressure–Temperature relationships.
          </div>
        </motion.div>

        {/* KPI CARDS */}
        <div style={{
          gridColumn: "1 / -1",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
        }}>
          <KpiCard
            theme={theme}
            gradient={theme.kpiGradient[0]}
            label="Total Equipment"
            value={rows.length}
            hint="Entries parsed"
          />
          <KpiCard
            theme={theme}
            gradient={theme.kpiGradient[1]}
            label="Avg Flowrate"
            value={pretty(flowStats.mean)}
            hint={`P50 ${pretty(flowStats.p50)} • P90 ${pretty(flowStats.p90)}`}
          />
          <KpiCard
            theme={theme}
            gradient={theme.kpiGradient[2]}
            label="Avg Pressure"
            value={pretty(pressStats.mean)}
            hint={`Min ${pretty(pressStats.min)} • Max ${pretty(pressStats.max)}`}
          />
          <KpiCard
            theme={theme}
            gradient={theme.kpiGradient[3]}
            label="Avg Temperature"
            value={pretty(tempStats.mean)}
            hint={`P10 ${pretty(tempStats.p10)} • P90 ${pretty(tempStats.p90)}`}
          />
        </div>

        {/* Charts */}
        <motion.div
          initial={{ opacity:0, y: 20 }}
          animate={{ opacity:1, y:0 }}
          transition={{ type: "spring", stiffness:170, damping:22, delay:0.1 }}
          style={{
            background: theme.panel, borderRadius: 14, padding: 16, boxShadow: theme.shadow,
            border: `2px solid ${blue}`
          }}>
          <SectionHeader title="Equipment Type Mix" theme={theme}/>
          <Bar
            data={{
              labels: equipmentTypeCounts.map(([t]) => t),
              datasets: [{
                label: "Count",
                data: equipmentTypeCounts.map(([, c]) => c),
                backgroundColor: equipmentTypeCounts.map(() => blue + "cc"),
                borderColor: equipmentTypeCounts.map(() => blue),
                borderRadius:8,
              }],
            }}
            options={{
              responsive:true,
              maintainAspectRatio:false,
              plugins:{legend:{display:false}},
              scales:{x:{grid:{display:false}},y:{grid:{color:"rgba(0,0,0,0.08)"},beginAtZero:true}},
              animation:{duration:800,easing:"easeOutQuart"},
            }}
            height={280}
          />
        </motion.div>
        <motion.div
          initial={{ opacity:0, y: 20 }}
          animate={{ opacity:1, y:0 }}
          transition={{ type:"spring", stiffness:170, damping:22, delay:0.12 }}
          style={{
            background:theme.panel, borderRadius: 14, padding: 16, boxShadow: theme.shadow,
            border: `2px solid ${blue}`
          }}>
          <SectionHeader title="Flowrate Distribution" theme={theme}/>
          <Bar
            data={{
              labels: flowBins,
              datasets: [{
                label:'Count',
                data: flowCounts,
                backgroundColor: blue+"99", borderColor:blue, borderRadius:8
              }]
            }}
            options={{
              responsive:true,
              maintainAspectRatio:false,
              plugins:{legend:{display:false}},
              scales:{x:{grid:{display:false}},y:{grid:{color:"rgba(0,0,0,0.09)"},beginAtZero:true}},
              animation:{duration:800,easing:"easeOutQuart"}
            }}
            height={280}
          />
        </motion.div>
        <motion.div
          initial={{ opacity:0, y:24 }}
          animate={{ opacity:1, y:0 }}
          transition={{ type:"spring", stiffness:170, damping:22, delay:0.18 }}
          style={{
            background:theme.panel, borderRadius:14, padding:16, boxShadow:theme.shadow,
            gridColumn:'1/-1', marginTop:10, border:`2.5px solid ${blue}`
          }}>
          <SectionHeader title="Pressure vs Temperature" theme={theme}/>
          <div style={{ height: 360 }}>
            <Scatter
              data={{
                datasets: [{
                  label:'Equipment',
                  data: scatterData,
                  backgroundColor: blue,
                  borderColor:blue,
                  pointRadius:4,
                  pointHoverRadius:7,
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
                  x:{title:{display:true,text:"Pressure"},grid:{color:"rgba(0,0,0,0.08)"}},
                  y:{title:{display:true,text:"Temperature"},grid:{color:"rgba(0,0,0,0.08)"}}
                },
                animation:{duration:900,easing:"easeOutQuint"}
              }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ---- APP ----
function App() {
  const [mode, setMode] = useState("dark");
  const theme = themes[mode];
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [showTable, setShowTable] = useState(false);

  const handleFileChange = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  await uploadCsvToBackend(file);
  // Optionally, keep lines below to ALSO update table immediately:
  const text = await file.text();
  const lines = text.replace(/\r\n/g, "\n").trim().split("\n");
  const hdrs = lines[0].split(",").map((x) => x.trim());
  const data = lines.slice(1).map((l) => l.split(",").map((c) => c.trim()));
  setHeaders(hdrs); setRows(data); setShowTable(false);
};


  function ThemeToggle() {
    return (
      <motion.button
        onClick={() => setMode(prev=>prev==="dark"?"light":"dark")}
        style={{
          border: `2px solid ${blue}`,
          background: mode==="dark"?darkPanel:lightPanel,
          color: theme.text,
          borderRadius: 24,
          width: 58, height: 34, cursor: "pointer", marginLeft: 18,
          display: "flex", alignItems:"center", justifyContent:"space-between",
          overflow:"hidden", boxShadow:theme.shadow, position:"relative"
        }}
        whileTap={{ scale: 0.93, rotate: -3 }}
        aria-label="Toggle dark/light mode"
      >
        <motion.div
          layout
          style={{
            width: 28, height: 28,
            borderRadius: "50%", background: blue, margin: 2,
            boxShadow: `0 2px 8px ${blue}90`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, transition: "background 0.2s"
          }}
          initial={false}
          animate={{ x: mode==="dark"?24:0, rotate: mode==="dark"?360:0 }}
          transition={{ type: "spring", stiffness: 180, damping: 18 }}
        >
          {mode==="dark" ? "🌙" : "☀️"}
        </motion.div>
      </motion.button>
    );
  }

  function ActionBtn({ children, onClick, style, ...props }) {
    return (
      <motion.button
        whileHover={{ scale: 1.06, boxShadow: `0 6px 18px ${blue}50` }}
        whileTap={{ scale: 0.95, color: "#fff", background: blue }}
        onClick={onClick}
        style={{
          background: theme.btnBg,
          color: theme.btnText,
          border: `2px solid ${blue}`,
          fontWeight: 600,
          borderRadius: 11, fontSize: 16, padding: "10px 22px",
          margin: "12px 10px 6px 0", boxShadow: theme.shadow, cursor:"pointer",
          transition: "all .15s cubic-bezier(.5,1.6,.15,1)"
        }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }

  // Table viewer
  const table = rows.length > 0 && showTable && (
    <div style={{
      margin: "40px auto", maxWidth: 920, background: theme.panel, borderRadius: 12, overflow: "auto",
      boxShadow: theme.shadow, border: `2.2px solid ${blue}`, padding: 12
    }}>
      <ActionBtn onClick={()=>setShowTable(false)}>Back to Dashboard</ActionBtn>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead>
          <tr>{headers.map((h,i)=><th key={i} style={{
            borderBottom: `2px solid ${blue}`, color: blue, background:"none", fontSize:15, padding:"8px"
          }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r,ri)=>(
            <tr key={ri} style={{background:ri%2===0?theme.bg:"transparent"}}>
              {r.map((c,ci)=><td key={ci} style={{
                border:"1px solid #3fc1c944", color: theme.text, padding:"7px 12px"
              }}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh", background: theme.bg, color: theme.text,
      transition: "background .3s"
    }}>
      {/* HEADER */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        maxWidth: 1200, margin:"0 auto", padding:"28px 26px 16px"
      }}>
        <h1 style={{
          margin: 0, color: theme.text, fontWeight:800, fontSize:40, letterSpacing:"1px"
        }}>Chemical Equipment Dashboard</h1>
        <ThemeToggle />
      </div>

      {/* ACTIONS */}
      <div style={{display:"flex", alignItems:"center", gap:10, maxWidth:1200, margin:"0 auto 16px", padding: "0 26px"}}>
        <div>
  <input
    id="csv-loader"
    type="file"
    accept=".csv"
    style={{ display: "none" }}
    onChange={handleFileChange}
  />
  <ActionBtn
    onClick={() => document.getElementById("csv-loader").click()}
    type="button"
  >
    Upload CSV
  </ActionBtn>
</div>

        <ActionBtn onClick={()=>setShowTable(s=>!s)} disabled={rows.length===0 || showTable}>
          View Table
        </ActionBtn>
        <ActionBtn onClick={()=>window.print()} disabled={rows.length===0}>
          Download as PDF
        </ActionBtn>
      </div>

      {/* CONTENT */}
      <AnimatePresence>
        {table || (
          rows.length > 0
            ? <Dashboard headers={headers} rows={rows} theme={theme} />
            : <motion.div
                initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness:180, damping:21 }}
                style={{
                  minHeight:"64vh", display:"grid", placeItems:"center"
                }}
              >
                <motion.div
                  animate={{ scale: [1,1.04,1], filter: ["brightness(0.85)", "brightness(1.08)", "brightness(1.0)"], boxShadow:[theme.shadow,"0 2px 16px #3fc1c9bb",theme.shadow] }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}
                  style={{
                    background:theme.panel, border:`2.5px solid ${blue}`, padding:"38px 42px",
                    borderRadius:16, textAlign:"center"
                  }}>
                  <h2 style={{ margin: 0 }}>Upload a CSV to get started</h2>
                  <p style={{margin: "15px 0 0"}}>CSV should have: Equipment Name, Type, Flowrate, Pressure, Temperature.</p>
                </motion.div>
              </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- MOUNT ----
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
