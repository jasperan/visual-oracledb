"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Mode = "indb" | "traditional";

interface DataRow {
  label: string;
  features: [number, number, number, number];
  prediction: string;
}

const dataRows: DataRow[] = [
  { label: "Row A", features: [0.82, 0.14, 0.67, 0.31], prediction: "A" },
  { label: "Row B", features: [0.25, 0.91, 0.43, 0.78], prediction: "B" },
  { label: "Row C", features: [0.56, 0.38, 0.19, 0.95], prediction: "C" },
  { label: "Row D", features: [0.73, 0.62, 0.84, 0.11], prediction: "A" },
  { label: "Row E", features: [0.41, 0.87, 0.53, 0.66], prediction: "B" },
];

// Neural network layout constants
const SVG_W = 720;
const SVG_H = 340;

const LAYERS = [4, 6, 6, 3];
const LAYER_LABELS = [
  ["f1", "f2", "f3", "f4"],
  [],
  [],
  ["A", "B", "C"],
];

function layerX(layerIdx: number): number {
  // Position layers within the network area
  const networkLeft = 240;
  const networkWidth = 300;
  return networkLeft + (layerIdx / (LAYERS.length - 1)) * networkWidth;
}

function nodeY(layerIdx: number, nodeIdx: number): number {
  const count = LAYERS[layerIdx];
  const totalHeight = (count - 1) * 36;
  const startY = SVG_H / 2 - totalHeight / 2;
  return startY + nodeIdx * 36;
}

export function OnnxInDbWidget() {
  const [mode, setMode] = useState<Mode>("indb");
  const [activeRowIndex, setActiveRowIndex] = useState(-1);
  const [activeLayer, setActiveLayer] = useState(-1);
  const [processedRows, setProcessedRows] = useState(0);
  const [latency, setLatency] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [predictions, setPredictions] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latencyRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (latencyRef.current) clearInterval(latencyRef.current);
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const reset = useCallback(() => {
    cleanup();
    setActiveRowIndex(-1);
    setActiveLayer(-1);
    setProcessedRows(0);
    setLatency(0);
    setIsProcessing(false);
    setPredictions([]);
  }, [cleanup]);

  const processRows = useCallback(() => {
    if (isProcessing) return;
    reset();
    setIsProcessing(true);

    const layerAnimDelay = 200;
    const totalLayers = LAYERS.length;

    // Realistic latency model:
    // In-DB: ~2ms inference per row (no network hop)
    // Traditional: ~8ms serialization + ~45ms network RTT + ~2ms inference + ~45ms return + ~8ms deserialization = ~108ms per row
    const perRowLatencyMs = mode === "indb" ? 2 : 108;
    let simulatedLatency = 0;

    // Start latency counter that ticks at realistic rate
    const startTime = Date.now();
    const latencyInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      // Map real animation time to simulated latency
      const progress = Math.min(elapsed / (dataRows.length * (mode === "indb" ? 600 : 1200)), 1);
      simulatedLatency = Math.round(progress * dataRows.length * perRowLatencyMs);
      setLatency(simulatedLatency);
    }, 30);
    latencyRef.current = latencyInterval;

    let totalDelay = 0;

    for (let rowIdx = 0; rowIdx < dataRows.length; rowIdx++) {
      const rowStartDelay = totalDelay;

      // Activate the row
      timerRef.current = setTimeout(() => {
        setActiveRowIndex(rowIdx);
        setActiveLayer(-1);
      }, rowStartDelay);

      // Cascade through layers
      for (let layerIdx = 0; layerIdx < totalLayers; layerIdx++) {
        const layerDelay = rowStartDelay + 100 + layerIdx * layerAnimDelay;
        setTimeout(() => {
          setActiveLayer(layerIdx);
        }, layerDelay);
      }

      // Complete this row
      const rowEndDelay = rowStartDelay + 100 + totalLayers * layerAnimDelay + 100;
      setTimeout(() => {
        setActiveLayer(-1);
        setProcessedRows((prev) => prev + 1);
        setPredictions((prev) => [...prev, dataRows[rowIdx].prediction]);
      }, rowEndDelay);

      // Extra delay for traditional mode (simulated network round-trip)
      totalDelay = rowEndDelay + (mode === "indb" ? 100 : 600);
    }

    // End processing
    setTimeout(() => {
      setActiveRowIndex(-1);
      setActiveLayer(-1);
      setIsProcessing(false);
      clearInterval(latencyInterval);
      setLatency(dataRows.length * perRowLatencyMs);
    }, totalDelay + 200);
  }, [isProcessing, mode, reset]);

  // DB boundary rectangle
  const dbLeft = 20;
  const dbTop = 20;
  const dbWidth = SVG_W - 40;
  const dbHeight = SVG_H - 40;

  // For traditional mode, network shifts outside
  const networkOffsetX = mode === "traditional" ? 300 : 0;

  return (
    <div className="widget-container bg-card border border-border rounded-xl p-6 my-8 overflow-hidden">
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-mono">
        Interactive &middot; In-Database ML Inference
      </div>

      {/* Mode buttons */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={() => { setMode("indb"); reset(); }}
          className={`btn-mono ${mode === "indb" ? "active" : ""}`}
        >
          In-Database
        </button>
        <button
          onClick={() => { setMode("traditional"); reset(); }}
          className={`btn-mono ${mode === "traditional" ? "active" : ""}`}
        >
          Traditional
        </button>
        <div className="flex-1" />
        <button
          onClick={processRows}
          disabled={isProcessing}
          className="btn-mono active"
          style={{ opacity: isProcessing ? 0.5 : 1 }}
        >
          {isProcessing ? "Processing..." : "Process Rows"}
        </button>
        <button onClick={reset} className="btn-mono">
          Reset
        </button>
      </div>

      {/* SVG visualization */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${SVG_W + (mode === "traditional" ? 320 : 0)} ${SVG_H}`}
          className="w-full"
          style={{ minWidth: 600, maxHeight: 400 }}
        >
          <defs>
            <radialGradient id="nodeGlowGreen">
              <stop offset="0%" stopColor="#34d399" stopOpacity="1" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.2" />
            </radialGradient>
            <radialGradient id="nodeDefault">
              <stop offset="0%" stopColor="#52525b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3f3f46" stopOpacity="0.4" />
            </radialGradient>
            <filter id="glowFilter">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Database Boundary */}
          <rect
            x={dbLeft}
            y={dbTop}
            width={mode === "traditional" ? 200 : dbWidth}
            height={dbHeight}
            rx={12}
            fill="none"
            stroke="#34d399"
            strokeWidth={2}
            strokeDasharray="8 4"
            opacity={0.5}
          />
          <text
            x={mode === "traditional" ? 110 : SVG_W / 2}
            y={dbTop + 18}
            textAnchor="middle"
            fill="#34d399"
            fontSize={11}
            fontFamily="JetBrains Mono, monospace"
            opacity={0.7}
          >
            Database Boundary
          </text>

          {/* Traditional mode: External API box */}
          {mode === "traditional" && (
            <>
              <rect
                x={SVG_W + 20}
                y={60}
                width={260}
                height={SVG_H - 120}
                rx={12}
                fill="none"
                stroke="#fbbf24"
                strokeWidth={2}
                strokeDasharray="6 3"
                opacity={0.5}
              />
              <text
                x={SVG_W + 150}
                y={90}
                textAnchor="middle"
                fill="#fbbf24"
                fontSize={11}
                fontFamily="JetBrains Mono, monospace"
                opacity={0.8}
              >
                External ML API
              </text>

              {/* Data Export arrow */}
              <line
                x1={200}
                y1={SVG_H / 2 - 20}
                x2={SVG_W + 20}
                y2={SVG_H / 2 - 20}
                stroke="#ef4444"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                opacity={0.6}
                markerEnd="url(#arrowRed)"
              />
              <text
                x={(200 + SVG_W + 20) / 2}
                y={SVG_H / 2 - 30}
                textAnchor="middle"
                fill="#ef4444"
                fontSize={10}
                fontFamily="JetBrains Mono, monospace"
                opacity={0.8}
              >
                Data Export
              </text>

              {/* Results Import arrow */}
              <line
                x1={SVG_W + 20}
                y1={SVG_H / 2 + 20}
                x2={200}
                y2={SVG_H / 2 + 20}
                stroke="#ef4444"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                opacity={0.6}
                markerEnd="url(#arrowRed)"
              />
              <text
                x={(200 + SVG_W + 20) / 2}
                y={SVG_H / 2 + 36}
                textAnchor="middle"
                fill="#ef4444"
                fontSize={10}
                fontFamily="JetBrains Mono, monospace"
                opacity={0.8}
              >
                Results Import
              </text>

              {/* Arrow marker */}
              <defs>
                <marker
                  id="arrowRed"
                  viewBox="0 0 10 10"
                  refX="10"
                  refY="5"
                  markerWidth={8}
                  markerHeight={8}
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" opacity={0.6} />
                </marker>
              </defs>
            </>
          )}

          {/* Mini data table on the left */}
          <g>
            <text
              x={40}
              y={dbTop + 44}
              fill="#a1a1aa"
              fontSize={9}
              fontFamily="JetBrains Mono, monospace"
            >
              DATA TABLE
            </text>
            {/* Header */}
            <text x={40} y={dbTop + 62} fill="#71717a" fontSize={8} fontFamily="JetBrains Mono, monospace">
              f1    f2    f3    f4
            </text>
            {/* Rows */}
            {dataRows.map((row, idx) => {
              const rowY = dbTop + 78 + idx * 22;
              const isActive = activeRowIndex === idx;
              const isProcessed = idx < processedRows;
              return (
                <g key={row.label}>
                  {isActive && (
                    <rect
                      x={34}
                      y={rowY - 11}
                      width={155}
                      height={17}
                      rx={3}
                      fill="#34d399"
                      opacity={0.15}
                    />
                  )}
                  <text
                    x={40}
                    y={rowY}
                    fill={isActive ? "#34d399" : isProcessed ? "#52525b" : "#a1a1aa"}
                    fontSize={9}
                    fontFamily="JetBrains Mono, monospace"
                    style={{ transition: "fill 0.2s" }}
                  >
                    {row.features.map((f) => f.toFixed(2)).join("  ")}
                  </text>
                  {/* Row label */}
                  <text
                    x={178}
                    y={rowY}
                    fill={isActive ? "#34d399" : "#52525b"}
                    fontSize={8}
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {row.label}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Flow arrow from table to network */}
          {activeRowIndex >= 0 && mode === "indb" && (
            <line
              x1={195}
              y1={SVG_H / 2}
              x2={layerX(0) - 15}
              y2={SVG_H / 2}
              stroke="#34d399"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              opacity={0.6}
            >
              <animate
                attributeName="stroke-dashoffset"
                from="20"
                to="0"
                dur="0.5s"
                repeatCount="indefinite"
              />
            </line>
          )}

          {/* Neural Network */}
          <g transform={mode === "traditional" ? `translate(${networkOffsetX}, 0)` : ""}>
            {/* Connection lines */}
            {LAYERS.map((count, li) => {
              if (li === 0) return null;
              const prevCount = LAYERS[li - 1];
              const lines: React.ReactElement[] = [];
              for (let pi = 0; pi < prevCount; pi++) {
                for (let ci = 0; ci < count; ci++) {
                  const x1 = layerX(li - 1);
                  const y1 = nodeY(li - 1, pi);
                  const x2 = layerX(li);
                  const y2 = nodeY(li, ci);
                  const isActive =
                    activeLayer >= li - 1 &&
                    activeLayer >= 0 &&
                    activeRowIndex >= 0;
                  lines.push(
                    <line
                      key={`${li}-${pi}-${ci}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isActive ? "#34d399" : "#3f3f46"}
                      strokeWidth={isActive ? 1.2 : 0.5}
                      opacity={isActive ? 0.5 : 0.2}
                      style={{ transition: "stroke 0.2s, opacity 0.2s" }}
                    />
                  );
                }
              }
              return <g key={`layer-lines-${li}`}>{lines}</g>;
            })}

            {/* Nodes */}
            {LAYERS.map((count, li) =>
              Array.from({ length: count }, (_, ni) => {
                const cx = layerX(li);
                const cy = nodeY(li, ni);
                const isActive = activeLayer >= li && activeRowIndex >= 0;
                const label = LAYER_LABELS[li]?.[ni];
                return (
                  <g key={`node-${li}-${ni}`}>
                    {isActive && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={14}
                        fill="url(#nodeGlowGreen)"
                        opacity={0.4}
                        filter="url(#glowFilter)"
                      />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={8}
                      fill={isActive ? "#34d399" : "#3f3f46"}
                      stroke={isActive ? "#34d399" : "#52525b"}
                      strokeWidth={1.5}
                      style={{ transition: "fill 0.15s, stroke 0.15s" }}
                    />
                    {/* Input labels (left of first layer) */}
                    {li === 0 && label && (
                      <text
                        x={cx - 16}
                        y={cy + 4}
                        textAnchor="end"
                        fill="#a1a1aa"
                        fontSize={9}
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {label}
                      </text>
                    )}
                    {/* Output labels (right of last layer) */}
                    {li === LAYERS.length - 1 && label && (
                      <text
                        x={cx + 16}
                        y={cy + 4}
                        textAnchor="start"
                        fill="#a1a1aa"
                        fontSize={9}
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {label}
                      </text>
                    )}
                  </g>
                );
              })
            )}

            {/* Layer labels */}
            {["Input", "Hidden 1", "Hidden 2", "Output"].map((name, li) => (
              <text
                key={name}
                x={layerX(li)}
                y={SVG_H - 16}
                textAnchor="middle"
                fill="#71717a"
                fontSize={9}
                fontFamily="JetBrains Mono, monospace"
              >
                {name}
              </text>
            ))}
          </g>

          {/* Predictions column (right side) */}
          {predictions.length > 0 && (
            <g>
              <text
                x={mode === "traditional" ? SVG_W + networkOffsetX - 40 : SVG_W - 80}
                y={dbTop + 44}
                fill="#a1a1aa"
                fontSize={9}
                fontFamily="JetBrains Mono, monospace"
              >
                PREDICTIONS
              </text>
              {predictions.map((pred, idx) => (
                <text
                  key={idx}
                  x={mode === "traditional" ? SVG_W + networkOffsetX - 40 : SVG_W - 80}
                  y={dbTop + 64 + idx * 20}
                  fill="#34d399"
                  fontSize={11}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {dataRows[idx].label} → Class {pred}
                </text>
              ))}
            </g>
          )}
        </svg>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between mt-4 flex-wrap gap-4">
        <div className="flex items-center gap-4 font-mono text-sm">
          <span className="text-muted-foreground">
            Processed: <span className="text-emerald-400">{processedRows}</span>/{dataRows.length}
          </span>
          <span className="text-muted-foreground">
            Latency: <span className={mode === "indb" ? "text-emerald-400" : "text-amber-400"}>{latency}ms</span>
            {processedRows > 0 && (
              <span className="text-muted-foreground ml-1 text-xs">
                ({mode === "indb" ? "2ms/row inference" : "8ms ser + 45ms RTT + 2ms inf + 45ms RTT + 8ms deser"})
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          {mode === "indb" ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className="text-emerald-400">Data never leaves the database</span>
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span className="text-amber-400">Data exposed during transit</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
