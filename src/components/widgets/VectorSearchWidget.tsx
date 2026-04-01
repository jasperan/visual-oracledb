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

export function VectorSearchWidget() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [k, setK] = useState(3);
  const [rotation, setRotation] = useState(25);
  const [metric, setMetric] = useState<DistanceMetric>("euclidean");
  const [query, setQuery] = useState({ x: 0.5, y: 0.5, z: 0.5 });

  const project = useCallback((x: number, y: number, z: number, width: number, height: number) => {
    const angle = (rotation * Math.PI) / 180;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const rx = x * cosA - z * sinA;
    const rz = x * sinA + z * cosA;

    const perspective = 1 + rz * 0.3;
    const screenX = (rx - 0.5) * width * 0.7 * perspective + width / 2;
    const screenY = (y - 0.5) * height * -0.7 * perspective + height / 2;

    return { screenX, screenY, depth: rz, scale: perspective };
  }, [rotation]);

  const calculateDistance = useCallback((p1: DataPoint, p2: { x: number; y: number; z: number }) => {
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
  }, [metric]);

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

    // Project all points — use separate screenX/screenY to avoid overwriting original coords
    const projectedPoints = dataPoints.map((p) => {
      const proj = project(p.x, p.y, p.z, width, height);
      return { ...p, screenX: proj.screenX, screenY: proj.screenY, depth: proj.depth, scale: proj.scale };
    });
    projectedPoints.sort((a, b) => a.depth - b.depth);

    // Calculate nearest neighbors using original coordinates
    const distances = dataPoints.map((p) => ({
      id: p.id, label: p.label, distance: calculateDistance(p, query),
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
        ctx.font = "10px JetBrains Mono";
        const dist = distances.find((d) => d.id === p.id);
        if (dist) ctx.fillText(dist.distance.toFixed(3), midX + 5, midY - 3);
      }
    });

    // Draw data points
    projectedPoints.forEach((p) => {
      const isNearest = nearestIds.has(p.id);
      const radius = isNearest ? 8 * p.scale : 5 * p.scale;

      const sphereGradient = ctx.createRadialGradient(
        p.screenX - radius / 3, p.screenY - radius / 3, 0, p.screenX, p.screenY, radius
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

      if (p.scale > 0.7) {
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "10px JetBrains Mono";
        ctx.fillText(p.label, p.screenX + 10, p.screenY + 3);
      }
    });

    // Draw query point
    const qRadius = 12 * qProj.scale;
    const queryGradient = ctx.createRadialGradient(
      qProj.screenX - qRadius / 3, qProj.screenY - qRadius / 3, 0,
      qProj.screenX, qProj.screenY, qRadius
    );
    queryGradient.addColorStop(0, "#f472b6");
    queryGradient.addColorStop(1, "#a78bfa");

    ctx.beginPath();
    ctx.arc(qProj.screenX, qProj.screenY, qRadius, 0, Math.PI * 2);
    ctx.fillStyle = queryGradient;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px JetBrains Mono";
    ctx.fillText("QUERY", qProj.screenX + 15, qProj.screenY + 3);
  }, [query, k, rotation, metric, project, calculateDistance]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    // Convert click to canvas pixel coordinates
    const targetScreenX = (e.clientX - rect.left) / rect.width * canvas.width;
    const targetScreenY = (e.clientY - rect.top) / rect.height * canvas.height;
    const w = canvas.width;
    const h = canvas.height;
    const z = 0.5;

    // Inverse-project: find (x, y) such that project(x, y, z) ≈ (targetScreenX, targetScreenY)
    // Use Newton's method with a few iterations
    const angle = (rotation * Math.PI) / 180;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // Solve for x from screenX equation:
    // screenX = (x*cosA - z*sinA - 0.5) * w * 0.7 * (1 + (x*sinA + z*cosA)*0.3) + w/2
    // This is quadratic in x — iterate to solve
    let xGuess = 0.5;
    for (let i = 0; i < 10; i++) {
      const rx = xGuess * cosA - z * sinA;
      const rz = xGuess * sinA + z * cosA;
      const persp = 1 + rz * 0.3;
      const sx = (rx - 0.5) * w * 0.7 * persp + w / 2;
      const errorX = sx - targetScreenX;
      // Numerical derivative
      const dx = 0.001;
      const rx2 = (xGuess + dx) * cosA - z * sinA;
      const rz2 = (xGuess + dx) * sinA + z * cosA;
      const persp2 = 1 + rz2 * 0.3;
      const sx2 = (rx2 - 0.5) * w * 0.7 * persp2 + w / 2;
      const dSxDx = (sx2 - sx) / dx;
      if (Math.abs(dSxDx) > 0.001) xGuess -= errorX / dSxDx;
    }

    // Solve for y from screenY equation (simpler — y doesn't affect perspective when x is known):
    const rz = xGuess * sinA + z * cosA;
    const persp = 1 + rz * 0.3;
    const yGuess = (targetScreenY - h / 2) / (h * -0.7 * persp) + 0.5;

    setQuery({
      x: Math.max(0.05, Math.min(0.95, xGuess)),
      y: Math.max(0.05, Math.min(0.95, yGuess)),
      z,
    });
  };

  return (
    <div className="widget-container bg-card border border-border rounded-xl p-6 my-8 overflow-hidden">
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-mono">Interactive · Similarity Search in 3D Space</div>

      <div className="flex items-center gap-4 mb-3 flex-wrap">
        <label className="font-mono text-sm text-muted-foreground">k nearest:</label>
        <input type="range" min="1" max="8" value={k} onChange={(e) => setK(Number(e.target.value))} className="w-28" />
        <span className="font-mono text-purple-400">{k}</span>
        <div className="flex-1" />
        <label className="font-mono text-sm text-muted-foreground">Rotate:</label>
        <input type="range" min="0" max="360" value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className="w-28" />
      </div>

      <div className="relative w-full h-[420px] rounded-lg overflow-hidden"
        style={{ background: "radial-gradient(ellipse at center,rgba(167,139,250,0.05),transparent 70%)" }}>
        <canvas ref={canvasRef} width={1360} height={840} className="w-full h-full cursor-crosshair" onClick={handleCanvasClick} />
      </div>

      <div className="mt-4 font-mono text-sm text-muted-foreground">
        <span>Top {k} nearest ({metric}):</span>{" "}
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
        <button onClick={() => setMetric("euclidean")} className={`btn-mono ${metric === "euclidean" ? "active" : ""}`}>Euclidean</button>
        <button onClick={() => setMetric("cosine")} className={`btn-mono ${metric === "cosine" ? "active" : ""}`}>Cosine</button>
        <button onClick={() => setMetric("dot")} className={`btn-mono ${metric === "dot" ? "active" : ""}`}>Dot Product</button>
      </div>
    </div>
  );
}
