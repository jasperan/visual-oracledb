"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type RacTab = "architecture" | "rebalance" | "scalability" | "recovery";

// ============================================================
// SUB-WIDGET 1: Cluster Architecture
// ============================================================
function ArchitecturePanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [tick, setTick] = useState(0);
  const [activeTransfer, setActiveTransfer] = useState<{ from: number; to: number; progress: number } | null>(null);
  const [hoveredInst, setHoveredInst] = useState(-1);

  const instances = [
    { id: 1, label: "Instance 1", x: 100, y: 100, color: "#38bdf8" },
    { id: 2, label: "Instance 2", x: 280, y: 100, color: "#4ade80" },
    { id: 3, label: "Instance 3", x: 460, y: 100, color: "#fbbf24" },
    { id: 4, label: "Instance 4", x: 640, y: 100, color: "#f472b6" },
  ];

  // Animate Cache Fusion transfers
  useEffect(() => {
    let running = true;
    const animate = () => {
      if (!running) return;
      setTick((t) => t + 1);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, []);

  // Periodic cache fusion transfer
  useEffect(() => {
    const interval = setInterval(() => {
      const from = Math.floor(Math.random() * 4);
      let to = Math.floor(Math.random() * 4);
      while (to === from) to = Math.floor(Math.random() * 4);
      setActiveTransfer({ from, to, progress: 0 });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Progress the transfer
  useEffect(() => {
    if (!activeTransfer) return;
    if (activeTransfer.progress >= 1) {
      setActiveTransfer(null);
      return;
    }
    const timer = setTimeout(() => {
      setActiveTransfer((prev) => prev ? { ...prev, progress: prev.progress + 0.05 } : null);
    }, 30);
    return () => clearTimeout(timer);
  }, [activeTransfer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = 740, H = 360;

    ctx.save();
    ctx.setTransform(2, 0, 0, 2, 0, 0);

    ctx.fillStyle = "#0d0d0f";
    ctx.fillRect(0, 0, W, H);

    // Shared storage at bottom
    const storageY = 270;
    ctx.fillStyle = "rgba(167,139,250,0.06)";
    ctx.fillRect(40, storageY - 10, W - 80, 60);
    ctx.strokeStyle = "rgba(167,139,250,0.3)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 3]);
    ctx.strokeRect(40, storageY - 10, W - 80, 60);
    ctx.setLineDash([]);

    ctx.fillStyle = "rgba(167,139,250,0.7)";
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("Oracle ASM — Shared Storage (OCR + Voting Disk + Data)", W / 2, storageY + 28);

    // Draw instances
    for (let i = 0; i < instances.length; i++) {
      const inst = instances[i];
      const isHovered = hoveredInst === i;

      // Connection to storage
      ctx.beginPath();
      ctx.moveTo(inst.x, inst.y + 40);
      ctx.lineTo(inst.x, storageY - 10);
      ctx.strokeStyle = `${inst.color}44`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Instance box
      const boxW = 120, boxH = 70;
      const bx = inst.x - boxW / 2;
      const by = inst.y - boxH / 2;

      if (isHovered) {
        ctx.shadowColor = inst.color;
        ctx.shadowBlur = 15;
      }
      ctx.fillStyle = "rgba(13,13,15,0.9)";
      ctx.strokeStyle = inst.color;
      ctx.lineWidth = isHovered ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.roundRect(bx, by, boxW, boxH, 8);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // SGA indicator inside
      const sgaH = 16;
      ctx.fillStyle = `${inst.color}22`;
      ctx.fillRect(bx + 8, by + boxH - sgaH - 8, boxW - 16, sgaH);
      ctx.fillStyle = `${inst.color}88`;
      ctx.font = "8px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText("SGA / Buffer Cache", inst.x, by + boxH - 12);

      // Label
      ctx.fillStyle = inst.color;
      ctx.font = "bold 11px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(inst.label, inst.x, inst.y - 4);

      // Active indicator
      ctx.fillStyle = "#4ade80";
      ctx.beginPath();
      ctx.arc(bx + 10, by + 10, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "8px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText("ACTIVE", bx + 18, by + 13);
    }

    // Cache Fusion interconnect line
    const cfY = 165;
    ctx.strokeStyle = "rgba(56,189,248,0.2)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(instances[0].x, cfY);
    ctx.lineTo(instances[3].x, cfY);
    ctx.stroke();

    ctx.fillStyle = "rgba(56,189,248,0.5)";
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("Cache Fusion Interconnect (RDMA on Exadata)", (instances[0].x + instances[3].x) / 2, cfY - 8);

    // Animated block transfer
    if (activeTransfer) {
      const fromInst = instances[activeTransfer.from];
      const toInst = instances[activeTransfer.to];
      const p = activeTransfer.progress;
      const cx = fromInst.x + (toInst.x - fromInst.x) * p;

      // Trail
      ctx.beginPath();
      ctx.moveTo(fromInst.x, cfY);
      ctx.lineTo(cx, cfY);
      ctx.strokeStyle = "rgba(250,204,21,0.6)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Moving block
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(cx, cfY, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#facc15";
      ctx.font = "8px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText("block transfer", cx, cfY + 16);
    }

    // SCAN listener at top
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(160, 10, 420, 24);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.strokeRect(160, 10, 420, 24);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("SCAN (Single Client Access Name) — JDBC / OCI / ODP.Net", 370, 26);

    ctx.restore();

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    tick;
  }, [tick, activeTransfer, hoveredInst]);

  return (
    <div>
      <div className="w-full" style={{ aspectRatio: "740/360" }}>
        <canvas
          ref={canvasRef}
          width={1480}
          height={720}
          className="block rounded-lg w-full h-full"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mx = ((e.clientX - rect.left) / rect.width) * 740;
            const my = ((e.clientY - rect.top) / rect.height) * 360;
            const idx = instances.findIndex((inst) => Math.abs(mx - inst.x) < 60 && Math.abs(my - inst.y) < 35);
            setHoveredInst(idx);
          }}
          onMouseLeave={() => setHoveredInst(-1)}
        />
      </div>
      <div className="mt-3 font-mono text-xs text-muted-foreground">
        All instances are <span className="text-emerald-400">active-active</span> — each can read and write simultaneously.{" "}
        <span className="text-amber-400">Cache Fusion</span> transfers data blocks between instances via high-speed interconnect (RDMA on Exadata).
      </div>
    </div>
  );
}

// ============================================================
// SUB-WIDGET 2: Smart Connection Rebalancing
// ============================================================
function RebalancePanel() {
  const [balanced, setBalanced] = useState(false);
  const [sessions, setSessions] = useState([
    { id: 1, workload: "Sales", inst: 0, color: "#38bdf8" },
    { id: 2, workload: "Sales", inst: 1, color: "#38bdf8" },
    { id: 3, workload: "Sales", inst: 2, color: "#38bdf8" },
    { id: 4, workload: "HR", inst: 0, color: "#4ade80" },
    { id: 5, workload: "HR", inst: 2, color: "#4ade80" },
    { id: 6, workload: "HR", inst: 3, color: "#4ade80" },
    { id: 7, workload: "Inventory", inst: 1, color: "#fbbf24" },
    { id: 8, workload: "Inventory", inst: 3, color: "#fbbf24" },
    { id: 9, workload: "Inventory", inst: 0, color: "#fbbf24" },
  ]);

  const instNames = ["Inst 1", "Inst 2", "Inst 3", "Inst 4"];

  const smartRebalance = useCallback(() => {
    if (balanced) {
      // Reset to scattered
      setSessions([
        { id: 1, workload: "Sales", inst: 0, color: "#38bdf8" },
        { id: 2, workload: "Sales", inst: 1, color: "#38bdf8" },
        { id: 3, workload: "Sales", inst: 2, color: "#38bdf8" },
        { id: 4, workload: "HR", inst: 0, color: "#4ade80" },
        { id: 5, workload: "HR", inst: 2, color: "#4ade80" },
        { id: 6, workload: "HR", inst: 3, color: "#4ade80" },
        { id: 7, workload: "Inventory", inst: 1, color: "#fbbf24" },
        { id: 8, workload: "Inventory", inst: 3, color: "#fbbf24" },
        { id: 9, workload: "Inventory", inst: 0, color: "#fbbf24" },
      ]);
      setBalanced(false);
    } else {
      // Group by workload
      setSessions((prev) => prev.map((s) => {
        if (s.workload === "Sales") return { ...s, inst: 0 };
        if (s.workload === "HR") return { ...s, inst: 1 };
        return { ...s, inst: 2 };
      }));
      setBalanced(true);
    }
  }, [balanced]);

  // Count cross-instance contention
  const contentionCount = (() => {
    const workloadInsts: Record<string, Set<number>> = {};
    for (const s of sessions) {
      if (!workloadInsts[s.workload]) workloadInsts[s.workload] = new Set();
      workloadInsts[s.workload].add(s.inst);
    }
    return Object.values(workloadInsts).reduce((sum, set) => sum + Math.max(0, set.size - 1), 0);
  })();

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={smartRebalance} className="btn-mono active">
          {balanced ? "Reset (Scatter)" : "Enable SMART_CONN"}
        </button>
        <span className="font-mono text-xs text-muted-foreground ml-2">
          Cross-instance contention: <span style={{ color: contentionCount > 0 ? "#ef4444" : "#4ade80" }}>{contentionCount}</span>
        </span>
        {balanced && (
          <span className="font-mono text-xs text-emerald-400 ml-2">
            Up to 95% reduction in cluster waits
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {instNames.map((name, iIdx) => {
          const instSessions = sessions.filter((s) => s.inst === iIdx);
          return (
            <div key={iIdx} className="bg-black/40 border border-border rounded-lg p-3 min-h-[140px]">
              <div className="font-mono text-xs text-muted-foreground mb-2">{name}</div>
              <div className="flex flex-col gap-1.5">
                {instSessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono transition-all duration-500"
                    style={{ background: `${s.color}15`, borderLeft: `3px solid ${s.color}` }}
                  >
                    <span style={{ color: s.color }}>{s.workload}</span>
                  </div>
                ))}
                {instSessions.length === 0 && (
                  <div className="text-xs text-muted-foreground/30 font-mono italic">idle</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 font-mono text-xs text-muted-foreground">
        <strong>Smart Connection Rebalancing</strong> groups sessions accessing the same data objects onto the same instance — reducing Cache Fusion block transfers and cluster wait events.{" "}
        <code className="bg-white/5 px-1 rounded text-[10px]">srvctl modify service -rlbgoal SMART_CONN</code>
      </div>
    </div>
  );
}

// ============================================================
// SUB-WIDGET 3: Linear Scalability (GloVe-25 benchmark)
// ============================================================

// Real GloVe-25 numbers: capacity per N instances
const CAPACITY: Record<number, number> = {
  1: 14638,
  2: 28646,
  3: 56787,
  4: 103798,
  5: 131070,
};

const INST_COLORS = ["#38bdf8", "#4ade80", "#fbbf24", "#f472b6", "#a78bfa"];

function ScalabilityPanel() {
  const [instanceCount, setInstanceCount] = useState(1);
  const [workload, setWorkload] = useState(5000); // current demand in qps
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<{ t: number; qps: number; instances: number; cpu: number }[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const workloadRef = useRef(5000);
  const instanceRef = useRef(1);
  const tRef = useRef(0);

  workloadRef.current = workload;
  instanceRef.current = instanceCount;

  const capacity = CAPACITY[instanceCount] ?? instanceCount * 14638;
  const cpuPct = Math.min(100, (workload / capacity) * 100);
  const cpuPerInstance = cpuPct; // simplified: all instances share load equally
  const needsMoreInstances = cpuPct > 90 && instanceCount < 5;
  const atMaxCapacity = cpuPct > 85 && instanceCount >= 5;
  const healthy = !needsMoreInstances && !atMaxCapacity;

  // Increase workload over time
  const startSimulation = useCallback(() => {
    if (running) return;
    setRunning(true);
    setWorkload(5000);
    setInstanceCount(1);
    setHistory([]);
    workloadRef.current = 5000;
    instanceRef.current = 1;
    tRef.current = 0;

    tickRef.current = setInterval(() => {
      tRef.current++;
      // Workload ramps up over time
      const newWorkload = Math.min(140000, 5000 + tRef.current * 800);
      workloadRef.current = newWorkload;
      setWorkload(newWorkload);

      const cap = CAPACITY[instanceRef.current] ?? instanceRef.current * 14638;
      const cpu = Math.min(100, (newWorkload / cap) * 100);

      setHistory((prev) => [
        ...prev.slice(-40),
        { t: tRef.current, qps: Math.min(newWorkload, cap), instances: instanceRef.current, cpu },
      ]);

      if (newWorkload >= 135000) {
        if (tickRef.current) clearInterval(tickRef.current);
        setRunning(false);
      }
    }, 200);
  }, [running]);

  const addInstance = useCallback(() => {
    if (instanceCount >= 5) return;
    const next = instanceCount + 1;
    setInstanceCount(next);
    instanceRef.current = next;
  }, [instanceCount]);

  const reset = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    setRunning(false);
    setWorkload(5000);
    setInstanceCount(1);
    setHistory([]);
    workloadRef.current = 5000;
    instanceRef.current = 1;
    tRef.current = 0;
  }, []);

  useEffect(() => {
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  const actualThroughput = Math.min(workload, capacity);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={startSimulation} disabled={running} className={`btn-mono ${!running ? "active" : ""}`}>
          {running ? "Workload increasing..." : "Start Simulation"}
        </button>
        <button onClick={addInstance} disabled={instanceCount >= 5 || !running} className={`btn-mono ${running && needsMoreInstances ? "active" : ""}`}
          style={running && needsMoreInstances ? { borderColor: "#ef4444", animation: "pulse 1s infinite" } : {}}
        >
          + Add Instance
        </button>
        <button onClick={reset} className="btn-mono">Reset</button>
        <div className="flex-1" />
        <span className="font-mono text-xs text-muted-foreground">
          Demand: <span className="text-foreground">{workload.toLocaleString()}</span> qps
        </span>
      </div>

      {/* Instance CPU gauges */}
      <div className={`grid gap-3 mb-4`} style={{ gridTemplateColumns: `repeat(${Math.max(instanceCount, 1)}, 1fr)` }}>
        {Array.from({ length: instanceCount }, (_, i) => {
          const instCpu = Math.min(100, cpuPerInstance);
          const instColor = INST_COLORS[i];
          return (
            <div key={i} className="bg-black/40 border border-border rounded-lg p-3 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs" style={{ color: instColor }}>Instance {i + 1}</span>
                <span className="font-mono text-xs font-bold" style={{ color: instCpu > 90 ? "#ef4444" : instCpu > 70 ? "#fbbf24" : "#4ade80" }}>
                  {Math.round(instCpu)}%
                </span>
              </div>
              <div className="h-3 bg-black/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${instCpu}%`,
                    background: instCpu > 90 ? "#ef4444" : instCpu > 70 ? `linear-gradient(90deg, ${instColor}, #fbbf24)` : instColor,
                  }}
                />
              </div>
              <div className="font-mono text-[10px] text-muted-foreground mt-1">
                CPU Load
              </div>
            </div>
          );
        })}
      </div>

      {/* Throughput & capacity display */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="font-mono text-2xl font-bold" style={{ color: needsMoreInstances ? "#ef4444" : "#38bdf8" }}>
            {actualThroughput.toLocaleString()}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground">Actual Throughput (qps)</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-2xl font-bold text-emerald-400">
            {capacity.toLocaleString()}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground">Max Capacity ({instanceCount} inst)</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-2xl font-bold" style={{ color: needsMoreInstances ? "#ef4444" : atMaxCapacity ? "#fbbf24" : "#4ade80" }}>
            {needsMoreInstances ? "SCALE OUT" : atMaxCapacity ? "AT CAPACITY" : "OK"}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground">
            {needsMoreInstances ? "Add instance to handle load!" : atMaxCapacity ? `${instanceCount} instances handling peak load` : "Headroom available"}
          </div>
        </div>
      </div>

      {/* Mini throughput chart */}
      {history.length > 2 && (
        <div className="bg-black/30 border border-border rounded-lg p-3 mb-4">
          <div className="font-mono text-[10px] text-muted-foreground mb-2">Throughput over time</div>
          <svg viewBox={`0 0 400 80`} className="w-full h-20">
            {/* Capacity line */}
            {(() => {
              let lastCap = CAPACITY[1];
              const segments: { x1: number; x2: number; cap: number }[] = [];
              for (let i = 0; i < history.length; i++) {
                const cap = CAPACITY[history[i].instances] ?? history[i].instances * 14638;
                const x = (i / Math.max(history.length - 1, 1)) * 400;
                if (cap !== lastCap || i === 0) {
                  segments.push({ x1: x, x2: x, cap });
                  lastCap = cap;
                } else {
                  segments[segments.length - 1].x2 = x;
                }
              }
              return segments.map((s, idx) => (
                <line key={idx} x1={s.x1} y1={80 - (s.cap / 140000) * 75} x2={s.x2} y2={80 - (s.cap / 140000) * 75}
                  stroke="#4ade80" strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
              ));
            })()}
            {/* Throughput line */}
            <polyline
              points={history.map((h, i) => {
                const x = (i / Math.max(history.length - 1, 1)) * 400;
                const y = 80 - (h.qps / 140000) * 75;
                return `${x},${y}`;
              }).join(" ")}
              fill="none" stroke="#38bdf8" strokeWidth="2"
            />
            {/* Demand line */}
            <polyline
              points={history.map((h, i) => {
                const demand = 5000 + h.t * 800;
                const x = (i / Math.max(history.length - 1, 1)) * 400;
                const y = 80 - (Math.min(demand, 140000) / 140000) * 75;
                return `${x},${y}`;
              }).join(" ")}
              fill="none" stroke="#f87171" strokeWidth="1" strokeDasharray="4 2" opacity="0.6"
            />
          </svg>
          <div className="flex justify-between font-mono text-[10px] text-muted-foreground mt-1">
            <div className="flex gap-3">
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-sky-400" /> Throughput</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-red-400 opacity-60" style={{ borderTop: "1px dashed" }} /> Demand</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-emerald-400 opacity-50" style={{ borderTop: "1px dashed" }} /> Capacity</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-black/30 border border-border rounded-lg p-3 font-mono text-xs text-muted-foreground">
        <strong>Dataset:</strong> GloVe-25 — 1.2M rows, VECTOR(25, FLOAT32). ~99% of query time is CPU.{" "}
        As demand grows, <span className="text-emerald-400">add instances</span> to scale linearly. Watch the CPU drop and capacity jump with each new instance.
      </div>
    </div>
  );
}

// ============================================================
// SUB-WIDGET 4: Zero-Downtime Recovery
// ============================================================
function RecoveryPanel() {
  const [phase, setPhase] = useState<"running" | "failure" | "reconfig" | "recovered">("running");
  const [failedInst, setFailedInst] = useState(-1);
  const [elapsed, setElapsed] = useState(0);
  const [mode, setMode] = useState<"26ai" | "19c">("26ai");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recoveryTime = mode === "26ai" ? 3.1 : 18.5; // seconds (simulated)

  const simulateFailure = useCallback(() => {
    const inst = 1; // Kill instance 2
    setFailedInst(inst);
    setPhase("failure");
    setElapsed(0);

    // Start reconfig after brief pause
    setTimeout(() => {
      setPhase("reconfig");
      const start = Date.now();
      timerRef.current = setInterval(() => {
        const e = (Date.now() - start) / 1000;
        setElapsed(e);
        if (e >= recoveryTime) {
          setPhase("recovered");
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }, 50);
    }, 500);
  }, [recoveryTime]);

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("running");
    setFailedInst(-1);
    setElapsed(0);
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const instData = [
    { label: "Inst 1", color: "#38bdf8" },
    { label: "Inst 2", color: "#4ade80" },
    { label: "Inst 3", color: "#fbbf24" },
    { label: "Inst 4", color: "#f472b6" },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={() => { setMode("26ai"); reset(); }} className={`btn-mono ${mode === "26ai" ? "active" : ""}`}>
          RAC 26ai
        </button>
        <button onClick={() => { setMode("19c"); reset(); }} className={`btn-mono ${mode === "19c" ? "active" : ""}`}>
          RAC 19c
        </button>
        <div className="flex-1" />
        <button
          onClick={phase === "running" ? simulateFailure : reset}
          className="btn-mono active"
        >
          {phase === "running" ? "Simulate Instance Crash" : "Reset"}
        </button>
      </div>

      {/* Instance status boxes */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {instData.map((inst, i) => {
          const isFailed = failedInst === i && phase !== "running";
          const isRecovered = failedInst === i && phase === "recovered";
          return (
            <div
              key={i}
              className="border rounded-lg p-3 text-center transition-all duration-300"
              style={{
                borderColor: isFailed && !isRecovered ? "#ef4444" : inst.color,
                background: isFailed && !isRecovered ? "rgba(239,68,68,0.08)" : "rgba(0,0,0,0.3)",
                opacity: isFailed && !isRecovered ? 0.5 : 1,
              }}
            >
              <div className="font-mono text-sm font-bold" style={{ color: isFailed && !isRecovered ? "#ef4444" : inst.color }}>
                {inst.label}
              </div>
              <div className="font-mono text-[10px] mt-1" style={{
                color: isFailed && !isRecovered
                  ? "#ef4444"
                  : isRecovered ? "#4ade80" : "#4ade80"
              }}>
                {isFailed && !isRecovered
                  ? phase === "reconfig" ? "RECOVERING..." : "CRASHED"
                  : isRecovered ? "RECOVERED" : "RUNNING"}
              </div>
              {/* Activity bar */}
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: isFailed && !isRecovered ? "0%" : "100%",
                    background: inst.color,
                    opacity: 0.6,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline */}
      {phase !== "running" && (
        <div className="bg-black/30 border border-border rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs text-muted-foreground">Recovery Timeline</span>
            <span className="font-mono text-sm font-bold" style={{ color: phase === "recovered" ? "#4ade80" : "#fbbf24" }}>
              {Math.min(elapsed, recoveryTime).toFixed(1)}s / {recoveryTime}s
            </span>
          </div>
          <div className="h-4 bg-black/40 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${Math.min((elapsed / recoveryTime) * 100, 100)}%`,
                background: phase === "recovered"
                  ? "linear-gradient(90deg, #4ade80, #22d3ee)"
                  : "linear-gradient(90deg, #fbbf24, #f97316)",
              }}
            />
          </div>
          <div className="flex justify-between mt-2 font-mono text-[10px] text-muted-foreground">
            <span>Instance crash detected</span>
            <span>{phase === "reconfig" ? "Reconfiguring DLM..." : "Work resumed on clean blocks"}</span>
          </div>
          {phase === "recovered" && (
            <div className="mt-3 text-center font-mono text-xs">
              <span className="text-emerald-400">
                Brownout: {recoveryTime.toFixed(1)}s
                {mode === "26ai" && " — 6x faster than 19c"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Comparison */}
      <div className="grid grid-cols-2 gap-4 font-mono text-xs">
        <div className={`border rounded-lg p-3 ${mode === "26ai" ? "border-emerald-500/50 bg-emerald-500/5" : "border-border"}`}>
          <div className="text-emerald-400 font-bold mb-1">RAC 26ai</div>
          <div className="text-muted-foreground">Fast Start Reconfiguration</div>
          <div className="text-lg font-bold text-emerald-400 mt-1">~3s brownout</div>
          <div className="text-muted-foreground text-[10px]">Work resumes 6x faster, recovery in 3/4 time</div>
        </div>
        <div className={`border rounded-lg p-3 ${mode === "19c" ? "border-amber-500/50 bg-amber-500/5" : "border-border"}`}>
          <div className="text-amber-400 font-bold mb-1">RAC 19c</div>
          <div className="text-muted-foreground">Standard Reconfiguration</div>
          <div className="text-lg font-bold text-amber-400 mt-1">~18s brownout</div>
          <div className="text-muted-foreground text-[10px]">Longer DLM reconfig before work can resume</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN RAC WIDGET
// ============================================================
export function RacWidget() {
  const [tab, setTab] = useState<RacTab>("architecture");

  const tabs: { key: RacTab; label: string }[] = [
    { key: "architecture", label: "Cluster Architecture" },
    { key: "rebalance", label: "Smart Rebalancing" },
    { key: "scalability", label: "Linear Scalability" },
    { key: "recovery", label: "Zero-Downtime Recovery" },
  ];

  return (
    <div className="widget-container bg-card border border-border rounded-xl p-6 my-8 overflow-hidden">
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-mono">
        Interactive &middot; Oracle RAC (Real Application Clusters)
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`btn-mono ${tab === t.key ? "active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "architecture" && <ArchitecturePanel />}
      {tab === "rebalance" && <RebalancePanel />}
      {tab === "scalability" && <ScalabilityPanel />}
      {tab === "recovery" && <RecoveryPanel />}
    </div>
  );
}
