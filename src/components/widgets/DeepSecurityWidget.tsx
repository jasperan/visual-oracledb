"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type SecurityLabel = "public" | "internal" | "confidential" | "restricted";
type UserRole = "analyst" | "manager" | "executive";

interface SecureVector {
  id: string;
  label: string;
  x: number;
  y: number;
  category: string;
  securityLabel: SecurityLabel;
}

const SECURITY_COLORS: Record<SecurityLabel, string> = {
  public: "#4ade80",
  internal: "#38bdf8",
  confidential: "#fbbf24",
  restricted: "#ef4444",
};

const SECURITY_ORDER: SecurityLabel[] = ["public", "internal", "confidential", "restricted"];

const ROLE_ACCESS: Record<UserRole, SecurityLabel[]> = {
  analyst: ["public"],
  manager: ["public", "internal", "confidential"],
  executive: ["public", "internal", "confidential", "restricted"],
};

const ROLE_LABELS: Record<UserRole, string> = {
  analyst: "Junior Analyst",
  manager: "Department Manager",
  executive: "Executive / CISO",
};

const vectors: SecureVector[] = [
  { id: "v1", label: "Q3 Revenue Report", x: 120, y: 80, category: "Finance", securityLabel: "public" },
  { id: "v2", label: "Customer Feedback", x: 280, y: 120, category: "Support", securityLabel: "public" },
  { id: "v3", label: "Product Roadmap", x: 420, y: 90, category: "Strategy", securityLabel: "internal" },
  { id: "v4", label: "Employee Reviews", x: 180, y: 220, category: "HR", securityLabel: "confidential" },
  { id: "v5", label: "Salary Database", x: 350, y: 260, category: "HR", securityLabel: "restricted" },
  { id: "v6", label: "API Docs", x: 80, y: 300, category: "Engineering", securityLabel: "public" },
  { id: "v7", label: "Security Audit", x: 480, y: 200, category: "Security", securityLabel: "restricted" },
  { id: "v8", label: "Board Strategy", x: 300, y: 340, category: "Strategy", securityLabel: "restricted" },
  { id: "v9", label: "Team Handbook", x: 500, y: 320, category: "HR", securityLabel: "internal" },
  { id: "v10", label: "Market Analysis", x: 150, y: 160, category: "Strategy", securityLabel: "internal" },
  { id: "v11", label: "Patent Filing", x: 440, y: 340, category: "Legal", securityLabel: "confidential" },
  { id: "v12", label: "Vendor Contract", x: 220, y: 350, category: "Legal", securityLabel: "confidential" },
];

const CANVAS_W = 580;
const CANVAS_H = 400;

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

export function DeepSecurityWidget() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dprSetRef = useRef(false);
  const [role, setRole] = useState<UserRole>("analyst");
  const [queryPoint, setQueryPoint] = useState<{ x: number; y: number } | null>(null);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [blockedCount, setBlockedCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStep, setSearchStep] = useState(-1);
  const [animTick, setAnimTick] = useState(0);
  const animRef = useRef<number>(0);

  const accessibleLabels = ROLE_ACCESS[role];

  const visibleVectors = vectors.filter((v) => accessibleLabels.includes(v.securityLabel));
  const hiddenVectors = vectors.filter((v) => !accessibleLabels.includes(v.securityLabel));

  const performSearch = useCallback((qx: number, qy: number) => {
    // Find k=3 nearest among ALL vectors, but only return accessible ones
    const k = 3;
    const allSorted = [...vectors].sort((a, b) => dist(a.x, a.y, qx, qy) - dist(b.x, b.y, qx, qy));
    const topK = allSorted.slice(0, k + hiddenVectors.length); // get enough to fill k visible

    const accessible: string[] = [];
    let blocked = 0;
    for (const v of topK) {
      if (accessible.length >= k) break;
      if (accessibleLabels.includes(v.securityLabel)) {
        accessible.push(v.id);
      } else {
        blocked++;
      }
    }

    setSearchResults(accessible);
    setBlockedCount(blocked);
    setSearchStep(0);
    setIsSearching(true);
  }, [accessibleLabels, hiddenVectors.length]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_H;

    setQueryPoint({ x, y });
    performSearch(x, y);
  }, [performSearch]);

  // Animate search results
  useEffect(() => {
    if (searchStep < 0 || searchStep >= searchResults.length) {
      if (searchStep >= searchResults.length && searchResults.length > 0) {
        setIsSearching(false);
      }
      return;
    }
    const timer = setTimeout(() => setSearchStep((s) => s + 1), 300);
    return () => clearTimeout(timer);
  }, [searchStep, searchResults.length]);

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

  // Pulse animation
  useEffect(() => {
    if (!isSearching) return;
    let running = true;
    const tick = () => {
      if (!running) return;
      setAnimTick((t) => t + 1);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [isSearching]);

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

    const visibleResults = searchStep >= 0 ? searchResults.slice(0, searchStep + 1) : [];
    const resultSet = new Set(visibleResults);

    // Draw connection lines from query to results
    if (queryPoint) {
      for (const vid of visibleResults) {
        const v = vectors.find((vec) => vec.id === vid);
        if (!v) continue;
        ctx.beginPath();
        ctx.moveTo(queryPoint.x, queryPoint.y);
        ctx.lineTo(v.x, v.y);
        ctx.strokeStyle = "rgba(167,139,250,0.5)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Distance label
        const d = dist(queryPoint.x, queryPoint.y, v.x, v.y);
        const mx = (queryPoint.x + v.x) / 2;
        const my = (queryPoint.y + v.y) / 2;
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "10px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(d.toFixed(0), mx, my - 5);
      }
    }

    // Draw hidden vectors (dimmed, with lock icon)
    for (const v of hiddenVectors) {
      const color = SECURITY_COLORS[v.securityLabel];

      // Dashed circle
      ctx.beginPath();
      ctx.arc(v.x, v.y, 10, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.15;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // Lock icon (small)
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.25;
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🔒", v.x, v.y + 4);
      ctx.globalAlpha = 1;
    }

    // Draw visible vectors
    for (const v of visibleVectors) {
      const color = SECURITY_COLORS[v.securityLabel];
      const isResult = resultSet.has(v.id);

      // Glow for results
      if (isResult) {
        const glowR = 20 + Math.sin(Date.now() / 150) * 3;
        const glow = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, glowR);
        glow.addColorStop(0, "rgba(167,139,250,0.4)");
        glow.addColorStop(1, "rgba(167,139,250,0)");
        ctx.beginPath();
        ctx.arc(v.x, v.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      // Node
      const radius = isResult ? 10 : 7;
      const grad = ctx.createRadialGradient(v.x - 2, v.y - 2, 0, v.x, v.y, radius);
      grad.addColorStop(0, color);
      grad.addColorStop(1, color + "88");
      ctx.beginPath();
      ctx.arc(v.x, v.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      if (isResult) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = isResult ? "#fff" : "rgba(228,228,231,0.7)";
      ctx.font = `${isResult ? "bold " : ""}10px 'JetBrains Mono', monospace`;
      ctx.textAlign = "left";
      ctx.fillText(v.label, v.x + 14, v.y + 3);

      // Security badge
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.5;
      ctx.font = "8px 'JetBrains Mono', monospace";
      ctx.fillText(v.securityLabel.toUpperCase(), v.x + 14, v.y + 14);
      ctx.globalAlpha = 1;
    }

    // Query point
    if (queryPoint) {
      const qGlow = ctx.createRadialGradient(queryPoint.x, queryPoint.y, 0, queryPoint.x, queryPoint.y, 20);
      qGlow.addColorStop(0, "rgba(244,114,182,0.4)");
      qGlow.addColorStop(1, "rgba(244,114,182,0)");
      ctx.beginPath();
      ctx.arc(queryPoint.x, queryPoint.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = qGlow;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(queryPoint.x, queryPoint.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = "#f472b6";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText("Q", queryPoint.x, queryPoint.y + 4);
    }

    // "Click to search" prompt if no query
    if (!queryPoint) {
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "14px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText("Click anywhere to run a similarity search", CANVAS_W / 2, CANVAS_H / 2);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    animTick;
  }, [visibleVectors, hiddenVectors, queryPoint, searchResults, searchStep, isSearching, animTick]);

  return (
    <div className="widget-container bg-card border border-border rounded-xl p-6 my-8 overflow-hidden">
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-mono">
        Interactive &middot; Deep Data Security + Vector Search
      </div>

      {/* Role selector */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="font-mono text-sm text-muted-foreground">Logged in as:</span>
        {(Object.keys(ROLE_ACCESS) as UserRole[]).map((r) => (
          <button
            key={r}
            onClick={() => {
              setRole(r);
              setQueryPoint(null);
              setSearchResults([]);
              setBlockedCount(0);
              setSearchStep(-1);
              setIsSearching(false);
            }}
            className={`btn-mono ${role === r ? "active" : ""}`}
          >
            {ROLE_LABELS[r]}
          </button>
        ))}
      </div>

      {/* Access level indicator */}
      <div className="flex items-center gap-3 mb-4 font-mono text-xs">
        <span className="text-muted-foreground">Can access:</span>
        {SECURITY_ORDER.map((label) => {
          const hasAccess = accessibleLabels.includes(label);
          return (
            <span key={label} className="flex items-center gap-1" style={{ opacity: hasAccess ? 1 : 0.25 }}>
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: SECURITY_COLORS[label] }} />
              <span style={{ color: hasAccess ? SECURITY_COLORS[label] : "#52525b" }}>{label}</span>
              {!hasAccess && <span className="text-[10px]">🔒</span>}
            </span>
          );
        })}
        <span className="text-muted-foreground ml-2">
          ({visibleVectors.length}/{vectors.length} vectors visible)
        </span>
      </div>

      {/* Canvas */}
      <div
        className="relative w-full rounded-lg overflow-hidden"
        style={{ maxWidth: CANVAS_W, aspectRatio: `${CANVAS_W}/${CANVAS_H}`, background: "#0d0d0f" }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: CANVAS_W, height: CANVAS_H, cursor: "crosshair" }}
          className="block"
          onClick={handleCanvasClick}
        />
      </div>

      {/* Search results */}
      {queryPoint && searchResults.length > 0 && (
        <div className="mt-4 bg-black/40 border border-border rounded-lg p-3 font-mono text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-muted-foreground">
              Top 3 nearest (with security filter):
            </span>
            {searchResults.map((vid, i) => {
              const v = vectors.find((vec) => vec.id === vid);
              if (!v) return null;
              return (
                <span key={vid} className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: SECURITY_COLORS[v.securityLabel] }} />
                  <span style={{ color: i === 0 ? "#facc15" : "#e4e4e7" }}>{v.label}</span>
                </span>
              );
            })}
          </div>
          {blockedCount > 0 && (
            <div className="mt-2 text-amber-400">
              {blockedCount} closer vector{blockedCount > 1 ? "s" : ""} filtered out by security policy — data exists but is invisible to this user.
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="mt-4 font-mono text-sm text-muted-foreground flex gap-4 flex-wrap">
        <span>Total vectors: <span className="text-foreground">{vectors.length}</span></span>
        <span className="text-border">|</span>
        <span>Visible: <span style={{ color: "#4ade80" }}>{visibleVectors.length}</span></span>
        <span className="text-border">|</span>
        <span>Secured: <span style={{ color: "#ef4444" }}>{hiddenVectors.length}</span></span>
      </div>

      {/* Legend */}
      <div className="mt-3 font-mono text-xs text-muted-foreground flex gap-4 flex-wrap">
        {SECURITY_ORDER.map((label) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: SECURITY_COLORS[label] }} />
            {label}
          </span>
        ))}
        <span className="text-border">|</span>
        <span>🔒 = filtered by row-level security</span>
      </div>
    </div>
  );
}
