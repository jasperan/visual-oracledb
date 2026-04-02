"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface DataPoint {
  id: string;
  x: number;
  y: number;
  z: number;
  label: string;
}

const dataPoints: DataPoint[] = [
  { id: "p1", x: 0.2, y: 0.3, z: 0.8, label: "cat.jpg" },
  { id: "p2", x: 0.8, y: 0.7, z: 0.2, label: "dog.jpg" },
  { id: "p3", x: 0.3, y: 0.8, z: 0.1, label: "kitten.png" },
  { id: "p4", x: 0.7, y: 0.2, z: 0.9, label: "garden.jpg" },
  { id: "p5", x: 0.5, y: 0.5, z: 0.5, label: "house.png" },
  { id: "p6", x: 0.1, y: 0.9, z: 0.3, label: "forest.jpg" },
  { id: "p7", x: 0.9, y: 0.1, z: 0.6, label: "beach.jpg" },
  { id: "p8", x: 0.4, y: 0.4, z: 0.7, label: "mountain.jpg" },
  { id: "p9", x: 0.6, y: 0.6, z: 0.4, label: "sunset.jpg" },
  { id: "p10", x: 0.3, y: 0.2, z: 0.9, label: "flowers.jpg" },
  { id: "p11", x: 0.8, y: 0.8, z: 0.3, label: "ocean.jpg" },
  { id: "p12", x: 0.2, y: 0.7, z: 0.5, label: "sky.jpg" },
];

type DistanceMetric = "euclidean" | "cosine" | "dot";

const CANVAS_W = 1360;
const CANVAS_H = 840;
const CAM_DIST = 3.5;
const FOV = 600;

export function VectorSearchWidget() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [k, setK] = useState(3);
  const [metric, setMetric] = useState<DistanceMetric>("euclidean");
  const [query, setQuery] = useState({ x: 0.5, y: 0.5, z: 0.5 });

  // Camera state: azimuth (horizontal angle), elevation (vertical angle), zoom
  const [azimuth, setAzimuth] = useState(0.6);
  const [elevation, setElevation] = useState(0.4);
  const [zoom, setZoom] = useState(1.0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  // Interaction state refs (avoid re-renders during drag)
  const dragStateRef = useRef<{
    type: "orbit" | "pan" | "query" | null;
    startX: number;
    startY: number;
    startAzimuth: number;
    startElevation: number;
    startPanX: number;
    startPanY: number;
  }>({ type: null, startX: 0, startY: 0, startAzimuth: 0, startElevation: 0, startPanX: 0, startPanY: 0 });

  // Project 3D point to 2D screen using proper perspective camera
  const project = useCallback(
    (x: number, y: number, z: number, width: number, height: number) => {
      // Center data around origin (data is 0-1, shift to -0.5 to 0.5)
      const cx = x - 0.5;
      const cy = y - 0.5;
      const cz = z - 0.5;

      // Camera position on sphere looking at origin
      const cosAz = Math.cos(azimuth);
      const sinAz = Math.sin(azimuth);
      const cosEl = Math.cos(elevation);
      const sinEl = Math.sin(elevation);

      // Camera basis vectors (right, up, forward)
      const fwdX = -cosEl * sinAz;
      const fwdY = -sinEl;
      const fwdZ = -cosEl * cosAz;
      const rightX = cosAz;
      const rightY = 0;
      const rightZ = -sinAz;
      const upX = sinEl * sinAz;
      const upY = -cosEl;
      const upZ = sinEl * cosAz;

      // Camera position
      const camX = -fwdX * CAM_DIST * zoom;
      const camY = -fwdY * CAM_DIST * zoom;
      const camZ = -fwdZ * CAM_DIST * zoom;

      // Vector from camera to point
      const dx = cx - camX;
      const dy = cy - camY;
      const dz = cz - camZ;

      // Project onto camera basis
      const viewX = dx * rightX + dy * rightY + dz * rightZ;
      const viewY = dx * upX + dy * upY + dz * upZ;
      const viewZ = dx * fwdX + dy * fwdY + dz * fwdZ;

      // Perspective divide
      const scale = viewZ > 0.01 ? FOV / viewZ : FOV / 0.01;
      const screenX = viewX * scale + width / 2 + panX;
      const screenY = -viewY * scale + height / 2 + panY;

      return { screenX, screenY, depth: viewZ, scale: Math.min(scale / FOV, 2) };
    },
    [azimuth, elevation, zoom, panX, panY]
  );

  // Inverse project: given screen coords, find the 3D point on the plane closest to current query's depth
  const inverseProject = useCallback(
    (screenX: number, screenY: number, width: number, height: number, refZ: number) => {
      const cosAz = Math.cos(azimuth);
      const sinAz = Math.sin(azimuth);
      const cosEl = Math.cos(elevation);
      const sinEl = Math.sin(elevation);

      const fwdX = -cosEl * sinAz;
      const fwdY = -sinEl;
      const fwdZ = -cosEl * cosAz;
      const rightX = cosAz;
      const rightY = 0;
      const rightZ = -sinAz;
      const upX = sinEl * sinAz;
      const upY = -cosEl;
      const upZ = sinEl * cosAz;

      const camX = -fwdX * CAM_DIST * zoom;
      const camY = -fwdY * CAM_DIST * zoom;
      const camZ = -fwdZ * CAM_DIST * zoom;

      // We want to find a 3D point at a given view-depth
      // Use the reference depth from the current query point
      const qcx = refZ - 0.5;
      const refViewZ = (qcx - camX) * fwdX + (0 - camY) * fwdY + (0 - camZ) * fwdZ;
      const targetViewZ = Math.max(refViewZ, 0.5);

      const scale = FOV / targetViewZ;
      const viewX = (screenX - width / 2 - panX) / scale;
      const viewY = -(screenY - height / 2 - panY) / scale;

      // Reconstruct world position: cam + viewZ*fwd + viewX*right + viewY*up
      const wx = camX + targetViewZ * fwdX + viewX * rightX + viewY * upX;
      const wy = camY + targetViewZ * fwdY + viewX * rightY + viewY * upY;
      const wz = camZ + targetViewZ * fwdZ + viewX * rightZ + viewY * upZ;

      return {
        x: Math.max(0.02, Math.min(0.98, wx + 0.5)),
        y: Math.max(0.02, Math.min(0.98, wy + 0.5)),
        z: Math.max(0.02, Math.min(0.98, wz + 0.5)),
      };
    },
    [azimuth, elevation, zoom, panX, panY]
  );

  const calculateDistance = useCallback(
    (p1: DataPoint, p2: { x: number; y: number; z: number }) => {
      switch (metric) {
        case "euclidean":
          return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 + (p1.z - p2.z) ** 2);
        case "cosine": {
          const dot = p1.x * p2.x + p1.y * p2.y + p1.z * p2.z;
          const mag1 = Math.sqrt(p1.x ** 2 + p1.y ** 2 + p1.z ** 2);
          const mag2 = Math.sqrt(p2.x ** 2 + p2.y ** 2 + p2.z ** 2);
          return 1 - dot / (mag1 * mag2);
        }
        case "dot":
          return -(p1.x * p2.x + p1.y * p2.y + p1.z * p2.z);
        default:
          return 0;
      }
    },
    [metric]
  );

  // Check if screen point is near the projected query
  const isNearQuery = useCallback(
    (sx: number, sy: number, width: number, height: number) => {
      const qProj = project(query.x, query.y, query.z, width, height);
      const dx = sx - qProj.screenX;
      const dy = sy - qProj.screenY;
      return dx * dx + dy * dy < 900; // 30px radius
    },
    [project, query]
  );

  // Draw the scene
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Background gradient
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
    gradient.addColorStop(0, "rgba(167,139,250,0.05)");
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw 3D axes
    const axisLength = 1.0;
    const axisOrigin = { x: 0, y: 0, z: 0 };
    const axes = [
      { end: { x: axisLength, y: 0, z: 0 }, color: "#ef4444", label: "X" },
      { end: { x: 0, y: axisLength, z: 0 }, color: "#22c55e", label: "Y" },
      { end: { x: 0, y: 0, z: axisLength }, color: "#3b82f6", label: "Z" },
    ];

    const oProj = project(axisOrigin.x, axisOrigin.y, axisOrigin.z, width, height);

    for (const axis of axes) {
      const eProj = project(axis.end.x, axis.end.y, axis.end.z, width, height);

      // Axis line
      ctx.beginPath();
      ctx.moveTo(oProj.screenX, oProj.screenY);
      ctx.lineTo(eProj.screenX, eProj.screenY);
      ctx.strokeStyle = axis.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Axis label
      ctx.fillStyle = axis.color;
      ctx.font = "bold 24px JetBrains Mono";
      ctx.fillText(axis.label, eProj.screenX + 8, eProj.screenY - 8);

      // Tick marks along axis at 0.25 intervals
      for (let t = 0.25; t <= axisLength; t += 0.25) {
        const tx = axisOrigin.x + (axis.end.x - axisOrigin.x) * t;
        const ty = axisOrigin.y + (axis.end.y - axisOrigin.y) * t;
        const tz = axisOrigin.z + (axis.end.z - axisOrigin.z) * t;
        const tProj = project(tx, ty, tz, width, height);
        ctx.beginPath();
        ctx.arc(tProj.screenX, tProj.screenY, 2, 0, Math.PI * 2);
        ctx.fillStyle = axis.color;
        ctx.globalAlpha = 0.4;
        ctx.fill();
        ctx.globalAlpha = 1;

        if (t === 0.5 || t === 1.0) {
          ctx.fillStyle = "rgba(255,255,255,0.4)";
          ctx.font = "16px JetBrains Mono";
          ctx.fillText(t.toFixed(1), tProj.screenX + 6, tProj.screenY + 4);
        }
      }
    }

    // Draw light grid on the XZ plane (y=0)
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = "#a78bfa";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const t = i * 0.25;
      const p1 = project(t, 0, 0, width, height);
      const p2 = project(t, 0, 1, width, height);
      ctx.beginPath();
      ctx.moveTo(p1.screenX, p1.screenY);
      ctx.lineTo(p2.screenX, p2.screenY);
      ctx.stroke();

      const p3 = project(0, 0, t, width, height);
      const p4 = project(1, 0, t, width, height);
      ctx.beginPath();
      ctx.moveTo(p3.screenX, p3.screenY);
      ctx.lineTo(p4.screenX, p4.screenY);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Project all points
    const projectedPoints = dataPoints.map((p) => {
      const proj = project(p.x, p.y, p.z, width, height);
      return { ...p, screenX: proj.screenX, screenY: proj.screenY, depth: proj.depth, scale: proj.scale };
    });
    projectedPoints.sort((a, b) => a.depth - b.depth);

    // Calculate nearest neighbors using original coordinates
    const distances = dataPoints.map((p) => ({
      id: p.id,
      label: p.label,
      distance: calculateDistance(p, query),
    }));
    distances.sort((a, b) => a.distance - b.distance);
    const nearest = distances.slice(0, k);
    const nearestIds = new Set(nearest.map((n) => n.id));

    // Draw connection lines
    const qProj = project(query.x, query.y, query.z, width, height);
    projectedPoints.forEach((p) => {
      if (nearestIds.has(p.id)) {
        ctx.beginPath();
        ctx.moveTo(qProj.screenX, qProj.screenY);
        ctx.lineTo(p.screenX, p.screenY);
        ctx.strokeStyle = "rgba(167,139,250,0.4)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineWidth = 1;

        // Distance label
        const midX = (qProj.screenX + p.screenX) / 2;
        const midY = (qProj.screenY + p.screenY) / 2;
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.font = "18px JetBrains Mono";
        const dist = distances.find((d) => d.id === p.id);
        if (dist) ctx.fillText(dist.distance.toFixed(3), midX + 5, midY - 3);
      }
    });

    // Draw data points
    projectedPoints.forEach((p) => {
      const isNearest = nearestIds.has(p.id);
      const baseRadius = isNearest ? 14 : 9;
      const radius = baseRadius * Math.max(0.4, Math.min(1.5, p.scale));

      const sphereGradient = ctx.createRadialGradient(
        p.screenX - radius / 3,
        p.screenY - radius / 3,
        0,
        p.screenX,
        p.screenY,
        radius
      );
      if (isNearest) {
        sphereGradient.addColorStop(0, "#facc15");
        sphereGradient.addColorStop(1, "#f97316");
      } else {
        sphereGradient.addColorStop(0, "#4ade80");
        sphereGradient.addColorStop(1, "#22d3ee");
      }

      ctx.beginPath();
      ctx.arc(p.screenX, p.screenY, radius, 0, Math.PI * 2);
      ctx.fillStyle = sphereGradient;
      ctx.fill();

      // Always show labels (with depth-based alpha)
      const alpha = Math.max(0.3, Math.min(1, p.scale));
      ctx.fillStyle = `rgba(255,255,255,${alpha * 0.8})`;
      ctx.font = `${Math.round(16 * Math.max(0.7, Math.min(1.2, p.scale)))}px JetBrains Mono`;
      ctx.fillText(p.label, p.screenX + radius + 4, p.screenY + 4);
    });

    // Draw query point
    const qRadius = 20 * Math.max(0.5, Math.min(1.5, qProj.scale));
    const queryGradient = ctx.createRadialGradient(
      qProj.screenX - qRadius / 3,
      qProj.screenY - qRadius / 3,
      0,
      qProj.screenX,
      qProj.screenY,
      qRadius
    );
    queryGradient.addColorStop(0, "#f472b6");
    queryGradient.addColorStop(1, "#a78bfa");

    // Outer glow for query
    const glowGradient = ctx.createRadialGradient(
      qProj.screenX, qProj.screenY, qRadius,
      qProj.screenX, qProj.screenY, qRadius * 2.5
    );
    glowGradient.addColorStop(0, "rgba(244,114,182,0.25)");
    glowGradient.addColorStop(1, "rgba(244,114,182,0)");
    ctx.beginPath();
    ctx.arc(qProj.screenX, qProj.screenY, qRadius * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = glowGradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(qProj.screenX, qProj.screenY, qRadius, 0, Math.PI * 2);
    ctx.fillStyle = queryGradient;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px JetBrains Mono";
    ctx.fillText("QUERY", qProj.screenX + qRadius + 6, qProj.screenY + 5);

    // Coordinate readout for query
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "14px JetBrains Mono";
    ctx.fillText(
      `(${query.x.toFixed(2)}, ${query.y.toFixed(2)}, ${query.z.toFixed(2)})`,
      qProj.screenX + qRadius + 6,
      qProj.screenY + 22
    );
  }, [query, k, azimuth, elevation, zoom, panX, panY, metric, project, calculateDistance]);

  // Mouse handlers for orbit/pan/query-drag
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const sx = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const sy = ((e.clientY - rect.top) / rect.height) * canvas.height;

      if (isNearQuery(sx, sy, canvas.width, canvas.height)) {
        // Start dragging the query point
        dragStateRef.current = {
          type: "query",
          startX: e.clientX,
          startY: e.clientY,
          startAzimuth: azimuth,
          startElevation: elevation,
          startPanX: panX,
          startPanY: panY,
        };
      } else if (e.shiftKey || e.button === 2) {
        // Pan
        dragStateRef.current = {
          type: "pan",
          startX: e.clientX,
          startY: e.clientY,
          startAzimuth: azimuth,
          startElevation: elevation,
          startPanX: panX,
          startPanY: panY,
        };
      } else {
        // Orbit
        dragStateRef.current = {
          type: "orbit",
          startX: e.clientX,
          startY: e.clientY,
          startAzimuth: azimuth,
          startElevation: elevation,
          startPanX: panX,
          startPanY: panY,
        };
      }
    },
    [azimuth, elevation, panX, panY, isNearQuery]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const state = dragStateRef.current;
      if (!state.type) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;

      if (state.type === "orbit") {
        setAzimuth(state.startAzimuth + dx * 0.005);
        setElevation(Math.max(-1.2, Math.min(1.2, state.startElevation + dy * 0.005)));
      } else if (state.type === "pan") {
        const scale = canvas.width / canvas.getBoundingClientRect().width;
        setPanX(state.startPanX + dx * scale);
        setPanY(state.startPanY + dy * scale);
      } else if (state.type === "query") {
        const rect = canvas.getBoundingClientRect();
        const sx = ((e.clientX - rect.left) / rect.width) * canvas.width;
        const sy = ((e.clientY - rect.top) / rect.height) * canvas.height;
        const newQ = inverseProject(sx, sy, canvas.width, canvas.height, query.z);
        setQuery(newQ);
      }
    },
    [query.z, inverseProject]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const state = dragStateRef.current;
      // If orbit and barely moved, treat as click-to-place query
      if (state.type === "orbit") {
        const dx = e.clientX - state.startX;
        const dy = e.clientY - state.startY;
        if (dx * dx + dy * dy < 16) {
          const canvas = canvasRef.current;
          if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const sx = ((e.clientX - rect.left) / rect.width) * canvas.width;
            const sy = ((e.clientY - rect.top) / rect.height) * canvas.height;
            const newQ = inverseProject(sx, sy, canvas.width, canvas.height, 0.5);
            setQuery(newQ);
          }
        }
      }
      dragStateRef.current = { ...dragStateRef.current, type: null };
    },
    [inverseProject]
  );

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setZoom((prev) => Math.max(0.4, Math.min(3.0, prev + e.deltaY * 0.001)));
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="widget-container bg-card border border-border rounded-xl p-6 my-8 overflow-hidden">
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-mono">
        Interactive &middot; Similarity Search in 3D Space
      </div>

      <div className="flex items-center gap-4 mb-3 flex-wrap">
        <label className="font-mono text-sm text-muted-foreground">k nearest:</label>
        <input type="range" min="1" max="8" value={k} onChange={(e) => setK(Number(e.target.value))} className="w-28" />
        <span className="font-mono text-purple-400">{k}</span>
        <div className="flex-1" />
        <span className="font-mono text-xs text-muted-foreground">
          Drag: orbit &middot; Shift+Drag: pan &middot; Scroll: zoom &middot; Drag query to move
        </span>
      </div>

      <div
        className="relative w-full h-[420px] rounded-lg overflow-hidden"
        style={{ background: "radial-gradient(ellipse at center,rgba(167,139,250,0.05),transparent 70%)" }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onContextMenu={handleContextMenu}
        />
      </div>

      <div className="mt-4 font-mono text-sm text-muted-foreground">
        <span>
          Top {k} nearest ({metric}):
        </span>{" "}
        {dataPoints
          .map((p) => ({ ...p, distance: calculateDistance(p, query) }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, k)
          .map((p, i) => (
            <span key={p.id}>
              <span style={{ color: i === 0 ? "#facc15" : "#4ade80" }}>{p.label}</span>
              <span className="text-muted-foreground"> ({p.distance.toFixed(3)})</span>
              {i < k - 1 && <span className="text-muted-foreground">, </span>}
            </span>
          ))}
      </div>

      <div className="flex gap-2 mt-4 flex-wrap">
        <button onClick={() => setMetric("euclidean")} className={`btn-mono ${metric === "euclidean" ? "active" : ""}`}>
          Euclidean
        </button>
        <button onClick={() => setMetric("cosine")} className={`btn-mono ${metric === "cosine" ? "active" : ""}`}>
          Cosine
        </button>
        <button onClick={() => setMetric("dot")} className={`btn-mono ${metric === "dot" ? "active" : ""}`}>
          Dot Product
        </button>
        <div className="flex-1" />
        <button
          onClick={() => {
            setAzimuth(0.6);
            setElevation(0.4);
            setZoom(1.0);
            setPanX(0);
            setPanY(0);
          }}
          className="btn-mono"
        >
          Reset View
        </button>
      </div>
    </div>
  );
}
