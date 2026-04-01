"use client";

import { useState, useEffect, useCallback } from "react";

type Status = "success" | "warning" | "error";

interface TimelineEntry {
  time: string;
  user: "A" | "B" | "SYS";
  action: string;
  status: Status;
  detail: string;
  anomaly?: string;
}

interface Scenario {
  name: string;
  shortName: string;
  oracleEntries: TimelineEntry[];
  genericEntries: TimelineEntry[];
  anomalyCount: number;
}

const scenarios: Scenario[] = [
  {
    name: "Phantom Read",
    shortName: "Phantom",
    anomalyCount: 1,
    oracleEntries: [
      { time: "T0", user: "A", action: "BEGIN TRANSACTION", status: "success", detail: "Serializable isolation" },
      { time: "T1", user: "A", action: "INSERT vector [0.5, 0.3, 0.8] for product_123", status: "success", detail: "Row locked, indexed" },
      { time: "T2", user: "A", action: "COMMIT", status: "success", detail: "Vector visible to all readers" },
      { time: "T3", user: "B", action: "SELECT k=3 nearest to [0.5, 0.3, 0.7]", status: "success", detail: "Read-committed snapshot" },
      { time: "T4", user: "B", action: "Result: product_123 in top-3", status: "success", detail: "Consistent read includes committed data" },
      { time: "T5", user: "SYS", action: "No anomalies detected", status: "success", detail: "ACID guarantees consistent reads" },
    ],
    genericEntries: [
      { time: "T0", user: "A", action: "INSERT vector [0.5, 0.3, 0.8] for product_123", status: "success", detail: "Write accepted" },
      { time: "T1", user: "SYS", action: "Index rebuild queued...", status: "warning", detail: "Eventual consistency delay", anomaly: "Index not yet updated" },
      { time: "T2", user: "B", action: "SELECT k=3 nearest to [0.5, 0.3, 0.7]", status: "warning", detail: "Query hits stale index", anomaly: "Stale index read" },
      { time: "T3", user: "B", action: "Result: product_123 MISSING from top-3", status: "error", detail: "New vector invisible to query", anomaly: "Phantom read: committed data not visible" },
      { time: "T4", user: "SYS", action: "Index rebuild completes (200ms later)", status: "warning", detail: "Data now visible" },
      { time: "T5", user: "SYS", action: "1 anomaly: stale read window", status: "error", detail: "Query returned incomplete results" },
    ],
  },
  {
    name: "Dirty Read",
    shortName: "Dirty",
    anomalyCount: 2,
    oracleEntries: [
      { time: "T0", user: "A", action: "BEGIN TRANSACTION", status: "success", detail: "Read-committed isolation" },
      { time: "T1", user: "A", action: "UPDATE doc_42 vector: [0.1, 0.2] -> [0.9, 0.8]", status: "success", detail: "Row locked, uncommitted" },
      { time: "T2", user: "B", action: "SELECT vector for doc_42", status: "success", detail: "Reads last committed value" },
      { time: "T3", user: "B", action: "Result: [0.1, 0.2] (old value)", status: "success", detail: "Dirty read prevented by MVCC" },
      { time: "T4", user: "A", action: "ROLLBACK", status: "success", detail: "Update discarded cleanly" },
      { time: "T5", user: "SYS", action: "No anomalies detected", status: "success", detail: "User B never saw uncommitted data" },
    ],
    genericEntries: [
      { time: "T0", user: "A", action: "UPDATE doc_42 vector: [0.1, 0.2] -> [0.9, 0.8]", status: "success", detail: "Write-in-progress" },
      { time: "T1", user: "SYS", action: "Vector updated in memory (uncommitted)", status: "warning", detail: "No isolation boundary", anomaly: "No transaction isolation" },
      { time: "T2", user: "B", action: "SELECT vector for doc_42", status: "error", detail: "Reads in-flight value", anomaly: "Dirty read: uncommitted data exposed" },
      { time: "T3", user: "B", action: "Result: [0.9, 0.8] (UNCOMMITTED)", status: "error", detail: "User B acts on phantom data", anomaly: "Downstream decisions based on dirty data" },
      { time: "T4", user: "A", action: "Operation fails, partial rollback", status: "warning", detail: "Original value restored" },
      { time: "T5", user: "SYS", action: "2 anomalies: dirty reads exposed", status: "error", detail: "User B consumed data that was never committed" },
    ],
  },
  {
    name: "Lost Update",
    shortName: "Lost Upd",
    anomalyCount: 1,
    oracleEntries: [
      { time: "T0", user: "A", action: "BEGIN TRANSACTION", status: "success", detail: "Serializable isolation" },
      { time: "T1", user: "A", action: "UPDATE item_7 vector to [0.3, 0.7]", status: "success", detail: "Row lock acquired" },
      { time: "T2", user: "B", action: "UPDATE item_7 vector to [0.6, 0.2]", status: "success", detail: "Waits for row lock release" },
      { time: "T3", user: "A", action: "COMMIT", status: "success", detail: "Lock released, [0.3, 0.7] persisted" },
      { time: "T4", user: "B", action: "Lock acquired, applies [0.6, 0.2]", status: "success", detail: "Serialized: no data lost" },
      { time: "T5", user: "SYS", action: "Final value: [0.6, 0.2] — deterministic", status: "success", detail: "Both updates serialized correctly" },
    ],
    genericEntries: [
      { time: "T0", user: "A", action: "UPDATE item_7 vector to [0.3, 0.7]", status: "success", detail: "No locking" },
      { time: "T1", user: "B", action: "UPDATE item_7 vector to [0.6, 0.2]", status: "success", detail: "Concurrent write, no coordination" },
      { time: "T2", user: "SYS", action: "Race condition: both writes in flight", status: "warning", detail: "No serialization", anomaly: "Concurrent uncoordinated writes" },
      { time: "T3", user: "SYS", action: "Last-write-wins (non-deterministic)", status: "error", detail: "Depends on network timing", anomaly: "Lost update: one write silently discarded" },
      { time: "T4", user: "SYS", action: "Final value: undefined — could be either", status: "warning", detail: "No audit trail of conflict" },
      { time: "T5", user: "SYS", action: "1 anomaly: silent data loss", status: "error", detail: "User A's update vanished without error" },
    ],
  },
  {
    name: "Partial Batch",
    shortName: "Partial",
    anomalyCount: 2,
    oracleEntries: [
      { time: "T0", user: "A", action: "BEGIN TRANSACTION", status: "success", detail: "Atomic batch" },
      { time: "T1", user: "A", action: "INSERT vectors 1/5, 2/5 ... OK", status: "success", detail: "All writes in same transaction" },
      { time: "T2", user: "A", action: "INSERT vector 3/5 ... FAILURE", status: "warning", detail: "Constraint violation detected" },
      { time: "T3", user: "SYS", action: "ROLLBACK entire transaction", status: "success", detail: "All 5 vectors reverted atomically" },
      { time: "T4", user: "SYS", action: "Database state: unchanged", status: "success", detail: "Zero partial data persisted" },
      { time: "T5", user: "SYS", action: "No anomalies — atomicity preserved", status: "success", detail: "Clean slate for retry" },
    ],
    genericEntries: [
      { time: "T0", user: "A", action: "INSERT batch of 5 vectors", status: "success", detail: "No transaction boundary" },
      { time: "T1", user: "A", action: "Vector 1/5, 2/5 persisted", status: "success", detail: "Written individually" },
      { time: "T2", user: "A", action: "Vector 3/5 ... FAILURE", status: "error", detail: "Write error mid-batch", anomaly: "No atomic rollback available" },
      { time: "T3", user: "SYS", action: "Vectors 4/5, 5/5 skipped", status: "error", detail: "Remaining batch abandoned", anomaly: "Partial write: 2 of 5 persisted" },
      { time: "T4", user: "SYS", action: "Database state: INCONSISTENT", status: "warning", detail: "2 orphaned vectors in index" },
      { time: "T5", user: "SYS", action: "2 anomalies: partial batch, orphaned data", status: "error", detail: "Manual cleanup required" },
    ],
  },
];

const userColors: Record<string, string> = {
  A: "#60a5fa",
  B: "#c084fc",
  SYS: "#94a3b8",
};

const statusIcons: Record<Status, { symbol: string; color: string }> = {
  success: { symbol: "\u2713", color: "#4ade80" },
  warning: { symbol: "\u26A0", color: "#facc15" },
  error: { symbol: "\u2717", color: "#f87171" },
};

export function AcidRaceWidget() {
  const [scenario, setScenario] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [hoveredAnomaly, setHoveredAnomaly] = useState<string | null>(null);

  const current = scenarios[scenario];
  const maxSteps = Math.max(current.oracleEntries.length, current.genericEntries.length);

  const reset = useCallback(() => {
    setIsRunning(false);
    setStep(0);
    setHoveredAnomaly(null);
  }, []);

  const runScenario = useCallback(() => {
    if (isRunning) return;
    setStep(0);
    setIsRunning(true);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning) return;
    if (step >= maxSteps) {
      setIsRunning(false);
      return;
    }
    const timer = setTimeout(() => {
      setStep((s) => s + 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [isRunning, step, maxSteps]);

  useEffect(() => {
    reset();
  }, [scenario, reset]);

  const visibleAnomalyCount = current.genericEntries
    .slice(0, step)
    .filter((e) => e.anomaly)
    .length;

  const renderTimeline = (
    entries: TimelineEntry[],
    side: "oracle" | "generic"
  ) => {
    const visibleEntries = entries.slice(0, step);
    return (
      <div className="flex flex-col gap-1.5 min-h-[280px]">
        {visibleEntries.map((entry, i) => {
          const iconInfo = statusIcons[entry.status];
          const userColor = userColors[entry.user];
          const hasAnomaly = side === "generic" && entry.anomaly;
          return (
            <div
              key={`${side}-${i}`}
              className="relative flex items-start gap-2 px-3 py-2 rounded-lg transition-all duration-200"
              style={{
                background: hasAnomaly
                  ? "rgba(248,113,113,0.08)"
                  : entry.status === "warning"
                  ? "rgba(250,204,21,0.05)"
                  : "rgba(255,255,255,0.02)",
                border: hasAnomaly
                  ? "1px solid rgba(248,113,113,0.2)"
                  : "1px solid transparent",
                animation: "fadeSlideIn 0.25s ease-out",
              }}
              onMouseEnter={() => hasAnomaly && setHoveredAnomaly(`${side}-${i}`)}
              onMouseLeave={() => setHoveredAnomaly(null)}
            >
              <span
                className="font-mono text-xs mt-0.5 shrink-0 w-6 text-center"
                style={{ color: "rgba(228,228,231,0.4)" }}
              >
                {entry.time}
              </span>
              <span
                className="font-mono text-xs font-bold mt-0.5 shrink-0 w-8 text-center rounded"
                style={{
                  color: userColor,
                  background: `${userColor}15`,
                  padding: "1px 4px",
                }}
              >
                {entry.user === "SYS" ? "SYS" : entry.user}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-xs leading-relaxed" style={{ color: "#e4e4e7" }}>
                  {entry.action}
                </div>
                <div className="font-mono text-xs" style={{ color: "rgba(228,228,231,0.4)" }}>
                  {entry.detail}
                </div>
              </div>
              <span
                className="font-mono text-sm mt-0.5 shrink-0"
                style={{ color: iconInfo.color }}
              >
                {iconInfo.symbol}
              </span>
              {hasAnomaly && hoveredAnomaly === `${side}-${i}` && (
                <div
                  className="absolute z-10 left-4 -bottom-1 translate-y-full font-mono text-xs px-3 py-2 rounded-lg shadow-lg max-w-[280px]"
                  style={{
                    background: "#1c1c1f",
                    border: "1px solid rgba(248,113,113,0.3)",
                    color: "#f87171",
                  }}
                >
                  {entry.anomaly}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="widget-container bg-card border border-border rounded-xl p-6 my-8 overflow-hidden">
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-mono">
        Interactive &middot; ACID vs Eventually Consistent
      </div>

      {/* Scenario selector */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {scenarios.map((s, i) => (
          <button
            key={s.shortName}
            onClick={() => setScenario(i)}
            className={`btn-mono ${scenario === i ? "active" : ""}`}
          >
            {s.shortName}
          </button>
        ))}
      </div>

      {/* Scenario title and concurrent ops label */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-mono text-base" style={{ color: "#f472b6" }}>
          Scenario: {current.name}
        </h3>
        <span className="font-mono text-xs" style={{ color: "rgba(228,228,231,0.4)" }}>
          Concurrent Operations: 2 users
        </span>
      </div>

      {/* Split-screen columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Oracle side */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span
              className="font-mono text-xs font-bold px-2.5 py-1 rounded"
              style={{
                background: "rgba(74,222,128,0.12)",
                color: "#4ade80",
                border: "1px solid rgba(74,222,128,0.25)",
              }}
            >
              Oracle Database
            </span>
            <span className="font-mono text-xs" style={{ color: "rgba(228,228,231,0.35)" }}>
              ACID Transactions
            </span>
          </div>
          <div
            className="rounded-lg p-3"
            style={{
              background: "rgba(74,222,128,0.03)",
              border: "1px solid rgba(74,222,128,0.08)",
              minHeight: "280px",
            }}
          >
            {renderTimeline(current.oracleEntries, "oracle")}
          </div>
        </div>

        {/* Generic side */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span
              className="font-mono text-xs font-bold px-2.5 py-1 rounded"
              style={{
                background: "rgba(244,114,182,0.12)",
                color: "#f472b6",
                border: "1px solid rgba(244,114,182,0.25)",
              }}
            >
              Generic Vector DB
            </span>
            <span className="font-mono text-xs" style={{ color: "rgba(228,228,231,0.35)" }}>
              Eventually Consistent
            </span>
          </div>
          <div
            className="rounded-lg p-3"
            style={{
              background: "rgba(248,113,113,0.03)",
              border: "1px solid rgba(248,113,113,0.08)",
              minHeight: "280px",
            }}
          >
            {renderTimeline(current.genericEntries, "generic")}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mt-5">
        <button
          onClick={runScenario}
          disabled={isRunning}
          className="btn-mono active"
          style={{
            opacity: isRunning ? 0.5 : 1,
            cursor: isRunning ? "not-allowed" : "pointer",
          }}
        >
          {isRunning ? "Running..." : "Run Scenario"}
        </button>
        <button onClick={reset} className="btn-mono">
          Reset
        </button>
        <div className="flex-1" />
        {/* Progress indicator */}
        <span className="font-mono text-xs" style={{ color: "rgba(228,228,231,0.4)" }}>
          Step {Math.min(step, maxSteps)}/{maxSteps}
        </span>
      </div>

      {/* Summary bar */}
      <div
        className="mt-4 px-4 py-3 rounded-lg font-mono text-sm flex items-center justify-between"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span>
          <span style={{ color: "#4ade80" }}>Oracle: 0 anomalies</span>
          <span style={{ color: "rgba(228,228,231,0.3)" }}> | </span>
          <span>
            Generic:{" "}
            <span style={{ color: visibleAnomalyCount > 0 ? "#f87171" : "#4ade80" }}>
              {visibleAnomalyCount} anomal{visibleAnomalyCount === 1 ? "y" : "ies"}
            </span>{" "}
            detected
          </span>
        </span>
        {step >= maxSteps && visibleAnomalyCount > 0 && (
          <span className="text-xs" style={{ color: "#f472b6" }}>
            ACID prevents all {current.anomalyCount} anomal{current.anomalyCount === 1 ? "y" : "ies"}
          </span>
        )}
      </div>
    </div>
  );
}
