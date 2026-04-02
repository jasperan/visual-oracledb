"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface HnswPoint {
  id: number;
  x: number;
  y: number;
  maxLayer: number;
  neighbors: Map<number, Set<number>>;
}

interface HnswEdge {
  from: number;
  to: number;
  layer: number;
}

interface SearchStepInfo {
  nodeId: number;
  layer: number;
  comparedWith: number | null;
  distCurrent: number;
  distNeighbor: number | null;
  improved: boolean;
}

const CANVAS_W = 600;
const CANVAS_H = 400;
const M = 2;

const PREDEFINED_POINTS: { x: number; y: number }[] = [
  { x: 80, y: 320 }, { x: 520, y: 60 }, { x: 300, y: 200 }, { x: 150, y: 80 },
  { x: 460, y: 300 }, { x: 200, y: 260 }, { x: 400, y: 120 }, { x: 100, y: 180 },
  { x: 540, y: 220 }, { x: 350, y: 340 }, { x: 250, y: 50 }, { x: 480, y: 180 },
  { x: 60, y: 350 }, { x: 320, y: 100 }, { x: 420, y: 260 },
];

const PREDEFINED_LAYERS = [0, 0, 1, 0, 0, 2, 0, 1, 0, 0, 1, 0, 0, 0, 1];

const LAYER_COLORS = [
  "rgba(56,189,248,0.3)",
  "rgba(251,191,36,0.5)",
  "rgba(244,114,182,0.7)",
];

const LAYER_SOLID_COLORS = ["#38bdf8", "#fbbf24", "#f472b6"];

const LAYER_WIDTHS = [1, 2, 3];

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

export function HnswIndexWidget() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const dprSetRef = useRef(false);

  const [points, setPoints] = useState<HnswPoint[]>([]);
  const [edges, setEdges] = useState<HnswEdge[]>([]);
  const [addedCount, setAddedCount] = useState(0);
  const [queryPoint, setQueryPoint] = useState<{ x: number; y: number } | null>(null);
  const [searchPath, setSearchPath] = useState<SearchStepInfo[]>([]);
  const [searchStep, setSearchStep] = useState(-1);
  const [activeLayerFilter, setActiveLayerFilter] = useState(-1);
  const [hnswComparisons, setHnswComparisons] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [stepMode, setStepMode] = useState(false);
  const [animTick, setAnimTick] = useState(0);
  const [currentSearchLayer, setCurrentSearchLayer] = useState(-1);
  const [placingQuery, setPlacingQuery] = useState(false);

  // Store points ref for search
  const pointsRef = useRef<HnswPoint[]>([]);
  pointsRef.current = points;

  const addSinglePoint = useCallback(() => {
    if (addedCount >= PREDEFINED_POINTS.length) return;
    const idx = addedCount;
    const { x, y } = PREDEFINED_POINTS[idx];
    const maxLayer = PREDEFINED_LAYERS[idx];

    const newPoint: HnswPoint = {
      id: idx, x, y, maxLayer,
      neighbors: new Map(),
    };

    for (let l = 0; l <= maxLayer; l++) {
      newPoint.neighbors.set(l, new Set());
    }

    setPoints((prev) => {
      const updated = [...prev, newPoint];
      const newEdges: HnswEdge[] = [];

      for (let layer = 0; layer <= maxLayer; layer++) {
        const candidates = prev.filter((p) => p.maxLayer >= layer);
        if (candidates.length === 0) continue;

        const sorted = candidates
          .map((p) => ({ p, d: dist(x, y, p.x, p.y) }))
          .sort((a, b) => a.d - b.d)
          .slice(0, M);

        for (const { p } of sorted) {
          newPoint.neighbors.get(layer)!.add(p.id);
          const existingPoint = updated.find((up) => up.id === p.id);
          if (existingPoint) {
            if (!existingPoint.neighbors.has(layer)) {
              existingPoint.neighbors.set(layer, new Set());
            }
            existingPoint.neighbors.get(layer)!.add(idx);
          }
          newEdges.push({ from: idx, to: p.id, layer });
        }
      }

      setEdges((prevEdges) => [...prevEdges, ...newEdges]);
      return updated;
    });

    setAddedCount(idx + 1);
    resetSearch();
  }, [addedCount]);

  const addAllPoints = useCallback(() => {
    if (addedCount >= PREDEFINED_POINTS.length) return;

    const allPoints: HnswPoint[] = [];
    const allEdges: HnswEdge[] = [];

    for (let idx = 0; idx < PREDEFINED_POINTS.length; idx++) {
      const { x, y } = PREDEFINED_POINTS[idx];
      const maxLayer = PREDEFINED_LAYERS[idx];

      const newPoint: HnswPoint = {
        id: idx, x, y, maxLayer,
        neighbors: new Map(),
      };

      for (let l = 0; l <= maxLayer; l++) {
        newPoint.neighbors.set(l, new Set());
      }

      for (let layer = 0; layer <= maxLayer; layer++) {
        const candidates = allPoints.filter((p) => p.maxLayer >= layer);
        if (candidates.length === 0) continue;

        const sorted = candidates
          .map((p) => ({ p, d: dist(x, y, p.x, p.y) }))
          .sort((a, b) => a.d - b.d)
          .slice(0, M);

        for (const { p } of sorted) {
          newPoint.neighbors.get(layer)!.add(p.id);
          if (!p.neighbors.has(layer)) p.neighbors.set(layer, new Set());
          p.neighbors.get(layer)!.add(idx);
          allEdges.push({ from: idx, to: p.id, layer });
        }
      }

      allPoints.push(newPoint);
    }

    setPoints(allPoints);
    setEdges(allEdges);
    setAddedCount(PREDEFINED_POINTS.length);
    resetSearch();
  }, [addedCount]);

  const resetSearch = useCallback(() => {
    setQueryPoint(null);
    setSearchPath([]);
    setSearchStep(-1);
    setHnswComparisons(0);
    setIsSearching(false);
    setStepMode(false);
    setCurrentSearchLayer(-1);
    setPlacingQuery(false);
  }, []);

  // Perform search and record every step
  const performSearch = useCallback((qx: number, qy: number, pts: HnswPoint[]): { path: SearchStepInfo[]; comparisons: number } => {
    let entryPoint = pts[0];
    for (const p of pts) {
      if (p.maxLayer > entryPoint.maxLayer) entryPoint = p;
    }

    const path: SearchStepInfo[] = [];
    let current = entryPoint;
    let comparisons = 0;
    const maxLayerInGraph = Math.max(...pts.map((p) => p.maxLayer));

    path.push({
      nodeId: current.id,
      layer: maxLayerInGraph,
      comparedWith: null,
      distCurrent: dist(current.x, current.y, qx, qy),
      distNeighbor: null,
      improved: false,
    });

    for (let layer = maxLayerInGraph; layer >= 0; layer--) {
      let improved = true;
      while (improved) {
        improved = false;
        const currentDist = dist(current.x, current.y, qx, qy);
        const neighbors = current.neighbors.get(layer);
        if (!neighbors) break;

        for (const nid of neighbors) {
          comparisons++;
          const neighbor = pts.find((p) => p.id === nid);
          if (!neighbor) continue;

          const nDist = dist(neighbor.x, neighbor.y, qx, qy);
          const didImprove = nDist < currentDist;

          path.push({
            nodeId: current.id,
            layer,
            comparedWith: nid,
            distCurrent: currentDist,
            distNeighbor: nDist,
            improved: didImprove,
          });

          if (didImprove) {
            current = neighbor;
            path.push({
              nodeId: current.id,
              layer,
              comparedWith: null,
              distCurrent: nDist,
              distNeighbor: null,
              improved: false,
            });
            improved = true;
            break;
          }
        }
      }

      // Record layer descent
      if (layer > 0) {
        path.push({
          nodeId: current.id,
          layer: layer - 1,
          comparedWith: null,
          distCurrent: dist(current.x, current.y, qx, qy),
          distNeighbor: null,
          improved: false,
        });
      }
    }

    return { path, comparisons };
  }, []);

  const startSearch = useCallback((qx?: number, qy?: number) => {
    if (points.length < 5 || isSearching) return;

    const finalQx = qx ?? 80 + Math.random() * 440;
    const finalQy = qy ?? 50 + Math.random() * 300;
    setQueryPoint({ x: finalQx, y: finalQy });

    const { path, comparisons } = performSearch(finalQx, finalQy, points);
    setSearchPath(path);
    setHnswComparisons(comparisons);
    setSearchStep(0);
    setIsSearching(true);
    setCurrentSearchLayer(path[0]?.layer ?? -1);
  }, [points, isSearching, performSearch]);

  const startStepSearch = useCallback((qx?: number, qy?: number) => {
    if (points.length < 5 || isSearching) return;

    const finalQx = qx ?? 80 + Math.random() * 440;
    const finalQy = qy ?? 50 + Math.random() * 300;
    setQueryPoint({ x: finalQx, y: finalQy });

    const { path, comparisons } = performSearch(finalQx, finalQy, points);
    setSearchPath(path);
    setHnswComparisons(comparisons);
    setSearchStep(0);
    setStepMode(true);
    setIsSearching(true);
    setCurrentSearchLayer(path[0]?.layer ?? -1);
  }, [points, isSearching, performSearch]);

  const advanceStep = useCallback(() => {
    if (!stepMode || searchStep >= searchPath.length - 1) {
      setIsSearching(false);
      setStepMode(false);
      return;
    }
    const next = searchStep + 1;
    setSearchStep(next);
    if (searchPath[next]) {
      setCurrentSearchLayer(searchPath[next].layer);
    }
  }, [stepMode, searchStep, searchPath]);

  // Handle click on canvas to place query
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!placingQuery) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = 2;
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_H;

    setPlacingQuery(false);
    if (stepMode || e.shiftKey) {
      startStepSearch(x, y);
    } else {
      startSearch(x, y);
    }
  }, [placingQuery, stepMode, startSearch, startStepSearch]);

  // Auto-animate search (non-step mode)
  useEffect(() => {
    if (stepMode || searchStep < 0 || searchStep >= searchPath.length) {
      if (searchStep >= searchPath.length && searchPath.length > 0) {
        setIsSearching(false);
      }
      return;
    }

    const timer = setTimeout(() => {
      const next = searchStep + 1;
      setSearchStep(next);
      if (searchPath[next]) {
        setCurrentSearchLayer(searchPath[next].layer);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchStep, searchPath.length, stepMode]);

  // DPR setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dprSetRef.current) return;
    const dpr = 2;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
    dprSetRef.current = true;
  }, []);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#0d0d0f";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
    }

    // Determine visible step info
    const visibleSteps = searchStep >= 0 ? searchPath.slice(0, searchStep + 1) : [];
    const visitedNodeIds = new Set(visibleSteps.map((s) => s.nodeId));
    const currentStepInfo = visibleSteps.length > 0 ? visibleSteps[visibleSteps.length - 1] : null;
    const activeNodeId = currentStepInfo?.nodeId ?? -1;
    const comparedNodeId = currentStepInfo?.comparedWith ?? -1;

    // Draw edges (dim non-active layers during search)
    for (const edge of edges) {
      if (activeLayerFilter !== -1 && edge.layer !== activeLayerFilter) continue;

      const fromPt = points.find((p) => p.id === edge.from);
      const toPt = points.find((p) => p.id === edge.to);
      if (!fromPt || !toPt) continue;

      const dimmed = isSearching && currentSearchLayer >= 0 && edge.layer !== currentSearchLayer;
      ctx.beginPath();
      ctx.moveTo(fromPt.x, fromPt.y);
      ctx.lineTo(toPt.x, toPt.y);
      ctx.strokeStyle = dimmed ? "rgba(255,255,255,0.04)" : LAYER_COLORS[edge.layer];
      ctx.lineWidth = dimmed ? 0.5 : LAYER_WIDTHS[edge.layer];
      ctx.stroke();
    }

    // Draw search path with layer colors
    if (queryPoint && visibleSteps.length > 1) {
      ctx.lineWidth = 2.5;
      for (let i = 1; i < visibleSteps.length; i++) {
        const prev = visibleSteps[i - 1];
        const curr = visibleSteps[i];
        if (prev.nodeId === curr.nodeId && prev.comparedWith === null && curr.comparedWith === null) continue;

        const fromPt = points.find((p) => p.id === prev.nodeId);
        const toPt = curr.comparedWith !== null
          ? points.find((p) => p.id === curr.comparedWith)
          : points.find((p) => p.id === curr.nodeId);

        if (!fromPt || !toPt || fromPt === toPt) continue;

        const layerColor = LAYER_SOLID_COLORS[curr.layer] ?? "#4ade80";
        ctx.beginPath();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = curr.improved ? "rgba(74,222,128,0.9)" : layerColor;
        ctx.globalAlpha = curr.improved ? 1 : 0.5;
        ctx.moveTo(fromPt.x, fromPt.y);
        ctx.lineTo(toPt.x, toPt.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }
    }

    // Draw points
    for (const p of points) {
      if (activeLayerFilter !== -1 && p.maxLayer < activeLayerFilter) continue;

      const isVisited = visitedNodeIds.has(p.id);
      const isActive = p.id === activeNodeId;
      const isCompared = p.id === comparedNodeId;
      const dimmedDuringSearch = isSearching && currentSearchLayer >= 0 && p.maxLayer < currentSearchLayer;

      // Layer rings
      if (p.maxLayer >= 2 && !dimmedDuringSearch) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(244,114,182,0.7)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      if (p.maxLayer >= 1 && !dimmedDuringSearch) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(251,191,36,0.6)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Active search node: pulsing glow
      if (isActive && isSearching) {
        const glowRadius = 18 + Math.sin(Date.now() / 100) * 4;
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
        glow.addColorStop(0, "rgba(74,222,128,0.5)");
        glow.addColorStop(1, "rgba(74,222,128,0)");
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      // Compared node: orange glow
      if (isCompared && isSearching) {
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 16);
        glow.addColorStop(0, "rgba(251,146,60,0.5)");
        glow.addColorStop(1, "rgba(251,146,60,0)");
        ctx.beginPath();
        ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      // Visited ring
      if (isVisited && !isActive) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(74,222,128,0.6)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Core
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? "#4ade80" : isCompared ? "#fb923c" : isVisited ? "#86efac" : dimmedDuringSearch ? "#27272a" : "#38bdf8";
      ctx.fill();

      // Label
      if (!dimmedDuringSearch) {
        ctx.fillStyle = "rgba(228,228,231,0.8)";
        ctx.font = "10px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(String(p.id), p.x, p.y - 14);
      }
    }

    // Draw query point
    if (queryPoint) {
      const qGlow = ctx.createRadialGradient(queryPoint.x, queryPoint.y, 0, queryPoint.x, queryPoint.y, 20);
      qGlow.addColorStop(0, "rgba(251,146,60,0.4)");
      qGlow.addColorStop(1, "rgba(251,146,60,0)");
      ctx.beginPath();
      ctx.arc(queryPoint.x, queryPoint.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = qGlow;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(queryPoint.x, queryPoint.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = "#fb923c";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText("Q", queryPoint.x, queryPoint.y + 4);
    }

    // "Click to place query" prompt
    if (placingQuery) {
      ctx.fillStyle = "rgba(251,146,60,0.8)";
      ctx.font = "bold 14px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText("Click anywhere to place query", CANVAS_W / 2, 30);
    }

    // Layer indicator during search
    if (isSearching && currentSearchLayer >= 0) {
      const layerLabel = `Searching Layer ${currentSearchLayer}`;
      ctx.fillStyle = LAYER_SOLID_COLORS[currentSearchLayer] ?? "#fff";
      ctx.font = "bold 12px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(layerLabel, 12, 24);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    animTick;
  }, [points, edges, queryPoint, searchPath, searchStep, activeLayerFilter, isSearching, animTick, currentSearchLayer, placingQuery]);

  // Pulse animation
  useEffect(() => {
    if (!isSearching || searchStep <= 0 || searchStep > searchPath.length) return;

    let running = true;
    const tick = () => {
      if (!running) return;
      setAnimTick((t) => t + 1);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isSearching, searchStep, searchPath.length]);

  const bruteForceComparisons = points.length;
  const currentStep = searchStep >= 0 && searchStep < searchPath.length ? searchPath[searchStep] : null;

  return (
    <div className="widget-container bg-card border border-border rounded-xl p-6 my-8 overflow-hidden">
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-mono">
        Interactive &middot; HNSW Index Construction
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={addSinglePoint}
          disabled={addedCount >= PREDEFINED_POINTS.length || isSearching}
          className={`btn-mono ${addedCount < PREDEFINED_POINTS.length && !isSearching ? "active" : ""}`}
        >
          Add Point
        </button>
        <button
          onClick={addAllPoints}
          disabled={addedCount >= PREDEFINED_POINTS.length || isSearching}
          className="btn-mono"
        >
          Add All
        </button>
        {addedCount >= 5 && (
          <>
            <button
              onClick={() => {
                if (placingQuery) {
                  setPlacingQuery(false);
                } else {
                  resetSearch();
                  setPlacingQuery(true);
                }
              }}
              disabled={isSearching}
              className={`btn-mono ${placingQuery ? "active" : ""}`}
            >
              {placingQuery ? "Cancel" : "Place Query"}
            </button>
            <button
              onClick={() => startSearch()}
              disabled={isSearching}
              className={`btn-mono ${!isSearching ? "active" : ""}`}
            >
              Random Search
            </button>
            <button
              onClick={() => {
                if (stepMode && isSearching) {
                  advanceStep();
                } else {
                  resetSearch();
                  setStepMode(true);
                  setPlacingQuery(true);
                }
              }}
              disabled={!stepMode && isSearching}
              className={`btn-mono ${stepMode ? "active" : ""}`}
            >
              {stepMode && isSearching ? "Next Step" : "Step Mode"}
            </button>
          </>
        )}
        <div className="flex-1" />
        <div className="flex gap-1">
          {([
            { label: "All Layers", value: -1 },
            { label: "Layer 0", value: 0 },
            { label: "Layer 1", value: 1 },
            { label: "Layer 2", value: 2 },
          ] as const).map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setActiveLayerFilter(value)}
              className={`btn-mono ${activeLayerFilter === value ? "active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div
        className="relative w-full rounded-lg overflow-hidden"
        style={{
          maxWidth: CANVAS_W,
          aspectRatio: `${CANVAS_W}/${CANVAS_H}`,
          background: "#0d0d0f",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: CANVAS_W, height: CANVAS_H, cursor: placingQuery ? "crosshair" : "default" }}
          className="block"
          onClick={handleCanvasClick}
        />
      </div>

      {/* Step info panel */}
      {stepMode && currentStep && (
        <div className="mt-3 bg-black/40 border border-border rounded-lg p-3 font-mono text-xs">
          <div className="flex gap-4 flex-wrap">
            <span>
              Current: <span className="text-emerald-400">Node {currentStep.nodeId}</span>
            </span>
            <span>
              Layer: <span style={{ color: LAYER_SOLID_COLORS[currentStep.layer] }}>L{currentStep.layer}</span>
            </span>
            {currentStep.comparedWith !== null && (
              <>
                <span>
                  Comparing: <span className="text-orange-400">Node {currentStep.comparedWith}</span>
                </span>
                <span>
                  d(current,Q)={currentStep.distCurrent.toFixed(1)} vs d(neighbor,Q)={currentStep.distNeighbor?.toFixed(1)}
                </span>
                <span style={{ color: currentStep.improved ? "#4ade80" : "#f87171" }}>
                  {currentStep.improved ? "Closer! Moving." : "Not closer."}
                </span>
              </>
            )}
            {currentStep.comparedWith === null && (
              <span className="text-muted-foreground">
                d(Q)={currentStep.distCurrent.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mt-4 font-mono text-sm text-muted-foreground flex gap-4 flex-wrap">
        <span>Points: <span style={{ color: "#38bdf8" }}>{points.length}</span></span>
        <span className="text-border">|</span>
        <span>HNSW comparisons: <span style={{ color: "#4ade80" }}>{hnswComparisons}</span></span>
        <span className="text-border">|</span>
        <span>Brute force: <span style={{ color: "#f87171" }}>{bruteForceComparisons}</span></span>
      </div>

      {/* Legend */}
      <div className="mt-3 font-mono text-xs text-muted-foreground flex gap-4 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5 rounded" style={{ background: "rgba(56,189,248,0.6)" }} />
          Layer 0 (all points)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5 rounded" style={{ background: "rgba(251,191,36,0.7)" }} />
          Layer 1 (shortcuts)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5 rounded" style={{ background: "rgba(244,114,182,0.8)" }} />
          Layer 2 (express)
        </span>
      </div>
    </div>
  );
}
