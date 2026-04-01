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

const CANVAS_W = 600;
const CANVAS_H = 400;
const M = 2; // max connections per layer

const PREDEFINED_POINTS: { x: number; y: number }[] = [
  { x: 80, y: 320 },
  { x: 520, y: 60 },
  { x: 300, y: 200 },
  { x: 150, y: 80 },
  { x: 460, y: 300 },
  { x: 200, y: 260 },
  { x: 400, y: 120 },
  { x: 100, y: 180 },
  { x: 540, y: 220 },
  { x: 350, y: 340 },
  { x: 250, y: 50 },
  { x: 480, y: 180 },
  { x: 60, y: 350 },
  { x: 320, y: 100 },
  { x: 420, y: 260 },
];

// Deterministic max layers using geometric distribution: ~60% L0, ~30% L0+1, ~10% L0+1+2
const PREDEFINED_LAYERS = [0, 0, 1, 0, 0, 2, 0, 1, 0, 0, 1, 0, 0, 0, 1];

const LAYER_COLORS = [
  "rgba(56,189,248,0.3)",  // Layer 0 - sky blue, thin
  "rgba(251,191,36,0.5)",  // Layer 1 - amber, medium
  "rgba(244,114,182,0.7)", // Layer 2 - pink, thick
];

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
  const [searchPath, setSearchPath] = useState<number[]>([]);
  const [searchStep, setSearchStep] = useState(-1);
  const [activeLayer, setActiveLayer] = useState(-1);
  const [hnswComparisons, setHnswComparisons] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [animTick, setAnimTick] = useState(0);

  const addSinglePoint = useCallback(() => {
    if (addedCount >= PREDEFINED_POINTS.length) return;

    const idx = addedCount;
    const { x, y } = PREDEFINED_POINTS[idx];
    const maxLayer = PREDEFINED_LAYERS[idx];

    const newPoint: HnswPoint = {
      id: idx,
      x,
      y,
      maxLayer,
      neighbors: new Map(),
    };

    // Initialize neighbor sets for each layer
    for (let l = 0; l <= maxLayer; l++) {
      newPoint.neighbors.set(l, new Set());
    }

    setPoints((prev) => {
      const updated = [...prev, newPoint];
      const newEdges: HnswEdge[] = [];

      // Connect to M nearest neighbors in each layer the new point participates in
      for (let layer = 0; layer <= maxLayer; layer++) {
        // Find existing points that participate in this layer
        const candidates = prev.filter((p) => p.maxLayer >= layer);
        if (candidates.length === 0) continue;

        // Sort by distance, pick M nearest
        const sorted = candidates
          .map((p) => ({ p, d: dist(x, y, p.x, p.y) }))
          .sort((a, b) => a.d - b.d)
          .slice(0, M);

        for (const { p } of sorted) {
          // Add bidirectional edges
          newPoint.neighbors.get(layer)!.add(p.id);

          // Update existing point's neighbors
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
    // Reset search state when adding points
    setQueryPoint(null);
    setSearchPath([]);
    setSearchStep(-1);
    setHnswComparisons(0);
    setIsSearching(false);
  }, [addedCount]);

  const addAllPoints = useCallback(() => {
    const remaining = PREDEFINED_POINTS.length - addedCount;
    if (remaining <= 0) return;

    // Build all points at once
    const allPoints: HnswPoint[] = [];
    const allEdges: HnswEdge[] = [];

    for (let idx = 0; idx < PREDEFINED_POINTS.length; idx++) {
      const { x, y } = PREDEFINED_POINTS[idx];
      const maxLayer = PREDEFINED_LAYERS[idx];

      const newPoint: HnswPoint = {
        id: idx,
        x,
        y,
        maxLayer,
        neighbors: new Map(),
      };

      for (let l = 0; l <= maxLayer; l++) {
        newPoint.neighbors.set(l, new Set());
      }

      // Connect to existing points
      for (let layer = 0; layer <= maxLayer; layer++) {
        const candidates = allPoints.filter((p) => p.maxLayer >= layer);
        if (candidates.length === 0) continue;

        const sorted = candidates
          .map((p) => ({ p, d: dist(x, y, p.x, p.y) }))
          .sort((a, b) => a.d - b.d)
          .slice(0, M);

        for (const { p } of sorted) {
          newPoint.neighbors.get(layer)!.add(p.id);

          if (!p.neighbors.has(layer)) {
            p.neighbors.set(layer, new Set());
          }
          p.neighbors.get(layer)!.add(idx);

          allEdges.push({ from: idx, to: p.id, layer });
        }
      }

      allPoints.push(newPoint);
    }

    setPoints(allPoints);
    setEdges(allEdges);
    setAddedCount(PREDEFINED_POINTS.length);
    setQueryPoint(null);
    setSearchPath([]);
    setSearchStep(-1);
    setHnswComparisons(0);
    setIsSearching(false);
  }, [addedCount]);

  const startSearch = useCallback(() => {
    if (points.length < 5 || isSearching) return;

    // Place query at a random position
    const qx = 80 + Math.random() * 440;
    const qy = 50 + Math.random() * 300;
    setQueryPoint({ x: qx, y: qy });

    // Perform HNSW greedy search
    // Find the entry point: highest-layer point
    let entryPoint = points[0];
    for (const p of points) {
      if (p.maxLayer > entryPoint.maxLayer) {
        entryPoint = p;
      }
    }

    const path: number[] = [entryPoint.id];
    let current = entryPoint;
    let comparisons = 0;
    const maxLayerInGraph = Math.max(...points.map((p) => p.maxLayer));

    // Traverse from top layer down to layer 0
    for (let layer = maxLayerInGraph; layer >= 0; layer--) {
      let improved = true;
      while (improved) {
        improved = false;
        const currentDist = dist(current.x, current.y, qx, qy);
        const neighbors = current.neighbors.get(layer);
        if (!neighbors) break;

        for (const nid of neighbors) {
          comparisons++;
          const neighbor = points.find((p) => p.id === nid);
          if (!neighbor) continue;

          const nDist = dist(neighbor.x, neighbor.y, qx, qy);
          if (nDist < currentDist) {
            current = neighbor;
            if (!path.includes(current.id)) {
              path.push(current.id);
            }
            improved = true;
            break; // greedy: take first improvement
          }
        }
      }
    }

    setSearchPath(path);
    setHnswComparisons(comparisons);
    setSearchStep(0);
    setIsSearching(true);
  }, [points, isSearching]);

  // Animate the search path
  useEffect(() => {
    if (searchStep < 0 || searchStep >= searchPath.length) {
      if (searchStep >= searchPath.length && searchPath.length > 0) {
        setIsSearching(false);
      }
      return;
    }

    const timer = setTimeout(() => {
      setSearchStep((prev) => prev + 1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchStep, searchPath.length]);

  // Set canvas DPR once
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

    // Dark background
    ctx.fillStyle = "#0d0d0f";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Subtle grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_H);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
      ctx.stroke();
    }

    // Draw edges
    for (const edge of edges) {
      if (activeLayer !== -1 && edge.layer !== activeLayer) continue;

      const fromPt = points.find((p) => p.id === edge.from);
      const toPt = points.find((p) => p.id === edge.to);
      if (!fromPt || !toPt) continue;

      ctx.beginPath();
      ctx.moveTo(fromPt.x, fromPt.y);
      ctx.lineTo(toPt.x, toPt.y);
      ctx.strokeStyle = LAYER_COLORS[edge.layer];
      ctx.lineWidth = LAYER_WIDTHS[edge.layer];
      ctx.stroke();
    }

    // Draw search path (animated dashed green line)
    if (queryPoint && searchPath.length > 0 && searchStep > 0) {
      const visiblePath = searchPath.slice(0, searchStep);
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = "rgba(74,222,128,0.8)";
      ctx.lineWidth = 2;

      for (let i = 0; i < visiblePath.length; i++) {
        const pt = points.find((p) => p.id === visiblePath[i]);
        if (!pt) continue;

        if (i === 0) {
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
        } else {
          ctx.lineTo(pt.x, pt.y);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw points
    for (const p of points) {
      if (activeLayer !== -1 && p.maxLayer < activeLayer) continue;

      const isVisited =
        searchStep > 0 && searchPath.slice(0, searchStep).includes(p.id);
      const isActive =
        searchStep > 0 &&
        searchStep <= searchPath.length &&
        searchPath[searchStep - 1] === p.id;

      // Layer 2 outer ring (pink)
      if (p.maxLayer >= 2) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(244,114,182,0.7)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Layer 1 ring (amber)
      if (p.maxLayer >= 1) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(251,191,36,0.6)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Active search node: pulsing green glow
      if (isActive) {
        const glowRadius = 18 + Math.sin(Date.now() / 100) * 4;
        const glow = ctx.createRadialGradient(
          p.x,
          p.y,
          0,
          p.x,
          p.y,
          glowRadius
        );
        glow.addColorStop(0, "rgba(74,222,128,0.5)");
        glow.addColorStop(1, "rgba(74,222,128,0)");
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      // Visited node green ring
      if (isVisited && !isActive) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(74,222,128,0.6)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Core circle
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = isActive
        ? "#4ade80"
        : isVisited
        ? "#86efac"
        : "#38bdf8";
      ctx.fill();

      // Index label
      ctx.fillStyle = "rgba(228,228,231,0.8)";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(String(p.id), p.x, p.y - 14);
    }

    // Draw query point
    if (queryPoint) {
      // Orange glow
      const qGlow = ctx.createRadialGradient(
        queryPoint.x,
        queryPoint.y,
        0,
        queryPoint.x,
        queryPoint.y,
        20
      );
      qGlow.addColorStop(0, "rgba(251,146,60,0.4)");
      qGlow.addColorStop(1, "rgba(251,146,60,0)");
      ctx.beginPath();
      ctx.arc(queryPoint.x, queryPoint.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = qGlow;
      ctx.fill();

      // Orange circle
      ctx.beginPath();
      ctx.arc(queryPoint.x, queryPoint.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = "#fb923c";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText("Q", queryPoint.x, queryPoint.y + 4);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    animTick; // read to trigger redraws during pulse animation
  }, [
    points,
    edges,
    queryPoint,
    searchPath,
    searchStep,
    activeLayer,
    isSearching,
    animTick,
  ]);

  // Drive pulse animation via requestAnimationFrame during active search
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
          className={`btn-mono ${addedCount < PREDEFINED_POINTS.length && !isSearching ? "" : ""}`}
        >
          Add All
        </button>
        {addedCount >= 5 && (
          <button
            onClick={startSearch}
            disabled={isSearching}
            className={`btn-mono ${!isSearching ? "active" : ""}`}
          >
            Search
          </button>
        )}
        <div className="flex-1" />
        <div className="flex gap-1">
          {(
            [
              { label: "All Layers", value: -1 },
              { label: "Layer 0", value: 0 },
              { label: "Layer 1", value: 1 },
              { label: "Layer 2", value: 2 },
            ] as const
          ).map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setActiveLayer(value)}
              className={`btn-mono ${activeLayer === value ? "active" : ""}`}
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
          style={{ width: CANVAS_W, height: CANVAS_H }}
          className="block"
        />
      </div>

      {/* Stats */}
      <div className="mt-4 font-mono text-sm text-muted-foreground flex gap-4 flex-wrap">
        <span>
          Points:{" "}
          <span style={{ color: "#38bdf8" }}>{points.length}</span>
        </span>
        <span className="text-border">|</span>
        <span>
          HNSW comparisons:{" "}
          <span style={{ color: "#4ade80" }}>{hnswComparisons}</span>
        </span>
        <span className="text-border">|</span>
        <span>
          Brute force:{" "}
          <span style={{ color: "#f87171" }}>{bruteForceComparisons}</span>
        </span>
      </div>

      {/* Layer legend */}
      <div className="mt-3 font-mono text-xs text-muted-foreground flex gap-4 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-4 h-0.5 rounded"
            style={{ background: "rgba(56,189,248,0.6)" }}
          />
          Layer 0 (all points)
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-4 h-0.5 rounded"
            style={{ background: "rgba(251,191,36,0.7)" }}
          />
          Layer 1 (shortcuts)
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-4 h-0.5 rounded"
            style={{ background: "rgba(244,114,182,0.8)" }}
          />
          Layer 2 (express)
        </span>
      </div>
    </div>
  );
}
