"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ============== JSON DUALITY WIDGET ==============
function JsonDualityWidget() {
  const initialData = [
    { id: 1, name: "Alice", role: "Engineer" },
    { id: 2, name: "Bob", role: "Designer" },
    { id: 3, name: "Carol", role: "Manager" },
  ];

  const [data, setData] = useState(initialData);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);

  const handleEdit = (index: number, source: "rel" | "json", e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setEditingIndex(index);
    setEditValue(data[index].name);
  };

  const handleSave = () => {
    if (editingIndex !== null) {
      setData((prev) => {
        const newData = [...prev];
        newData[editingIndex] = { ...newData[editingIndex], name: editValue };
        return newData;
      });
      setHighlightedRow(editingIndex);
      setTimeout(() => setHighlightedRow(null), 800);
    }
    setEditingIndex(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") setEditingIndex(null);
  };

  const resetData = () => setData(initialData);

  return (
    <div className="widget-container bg-card border border-border rounded-xl p-6 my-8 overflow-hidden">
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-mono">Interactive · JSON Duality View</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border rounded-lg overflow-hidden">
        {/* Relational Table */}
        <div className="bg-card p-4 min-h-[200px]">
          <div className="flex items-center gap-2 mb-3 text-sm">
            <span className="text-orange-500">⊕</span>
            <span className="text-orange-500 font-mono text-xs uppercase tracking-wider">Relational Table</span>
          </div>
          <div className="grid grid-cols-[60px_1fr_80px] gap-2 text-xs font-mono mb-1 pb-2 border-b border-border">
            <span className="text-muted-foreground">ID</span>
            <span className="text-muted-foreground">NAME</span>
            <span className="text-muted-foreground">ROLE</span>
          </div>
          {data.map((row, idx) => (
            <div
              key={row.id}
              className={`grid grid-cols-[60px_1fr_80px] gap-2 py-1 px-2 rounded text-sm font-mono transition-colors ${
                highlightedRow === idx ? "pulse-highlight" : "hover:bg-white/5"
              }`}
            >
              <span className="text-muted-foreground">{row.id}</span>
              <button
                type="button"
                onClick={() => handleEdit(idx, "rel")}
                className="text-left text-yellow-400 hover:text-cyan-400 cursor-pointer"
              >
                {editingIndex === idx ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="bg-transparent border-b border-cyan-400 outline-none w-full"
                    autoFocus
                  />
                ) : (
                  row.name
                )}
              </button>
              <span className="text-muted-foreground truncate">{row.role}</span>
            </div>
          ))}
        </div>

        {/* JSON Document */}
        <div className="bg-card p-4 min-h-[200px]">
          <div className="flex items-center gap-2 mb-3 text-sm">
            <span className="text-cyan-400">{}</span>
            <span className="text-cyan-400 font-mono text-xs uppercase tracking-wider">JSON Document</span>
          </div>
          <pre className="font-mono text-sm leading-relaxed">
            <span className="json-bracket">[</span>
            {data.map((row, idx) => (
              <span key={row.id}>
                {"\n  "}
                <span className="json-bracket">{"{"}</span>
                {"\n    "}
                <span className="json-key">"id"</span>: <span className="json-number">{row.id}</span>,
                {"\n    "}
                <span className="json-key">"name"</span>:{" "}
                <button
                  type="button"
                  onClick={() => handleEdit(idx, "json")}
                  className="json-string cursor-pointer hover:json-highlight px-1"
                >
                  {editingIndex === idx ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleSave}
                      onKeyDown={handleKeyDown}
                      className="bg-transparent border-b border-cyan-400 outline-none w-20"
                      autoFocus
                    />
                  ) : (
                    `"${row.name}"`
                  )}
                </button>
                ,{"\n    "}
                <span className="json-key">"role"</span>: <span className="json-string">"{row.role}"</span>
                {"\n  "}
                <span className="json-bracket">{"}"}</span>
                {idx < data.length - 1 && <span className="json-bracket">,</span>}
              </span>
            ))}
            {"\n"}
            <span className="json-bracket">]</span>
          </pre>
        </div>
      </div>

      <div className="mt-4 text-center">
        <button onClick={resetData} className="btn-mono active">Reset Data</button>
      </div>
    </div>
  );
}

// ============== CASCADE WIDGET ==============
const departments = {
  1: { id: 1, name: "Engineering", head: "Dave", budget: 500000 },
  2: { id: 2, name: "Marketing", head: "Eve", budget: 300000 },
  3: { id: 3, name: "Sales", head: "Frank", budget: 450000 },
};

function CascadeWidget() {
  const [deptId, setDeptId] = useState(2);
  const [highlighted, setHighlighted] = useState(false);

  useEffect(() => {
    setHighlighted(true);
    const timer = setTimeout(() => setHighlighted(false), 800);
    return () => clearTimeout(timer);
  }, [deptId]);

  const dept = departments[deptId as keyof typeof departments];

  return (
    <div className="widget-container bg-card border border-border rounded-xl p-6 my-8 overflow-hidden">
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-mono">Interactive · Cascading Update Propagation</div>

      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <label className="font-mono text-sm text-muted-foreground whitespace-nowrap">Alice's dept_id:</label>
        <input
          type="range"
          min="1"
          max="3"
          value={deptId}
          onChange={(e) => setDeptId(Number(e.target.value))}
          className="flex-1 max-w-xs"
        />
        <span className="font-mono text-cyan-400 min-w-[24px] text-center">{deptId}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border rounded-lg overflow-hidden">
        {/* Relational Table */}
        <div className="bg-card p-4">
          <div className="flex items-center gap-2 mb-3 text-sm">
            <span className="text-orange-500">⊕</span>
            <span className="text-orange-500 font-mono text-xs uppercase tracking-wider">employees</span>
          </div>
          <div className="grid grid-cols-[60px_1fr_80px] gap-2 text-xs font-mono mb-1 pb-2 border-b border-border">
            <span className="text-muted-foreground">ID</span>
            <span className="text-muted-foreground">NAME</span>
            <span className="text-muted-foreground">DEPT_ID</span>
          </div>
          <div className={`grid grid-cols-[60px_1fr_80px] gap-2 py-1 px-2 rounded text-sm font-mono ${highlighted ? "pulse-highlight" : ""}`}>
            <span className="text-muted-foreground">101</span>
            <span className="text-yellow-400">Alice</span>
            <span className="text-cyan-400 font-semibold">{deptId}</span>
          </div>
          <div className="grid grid-cols-[60px_1fr_80px] gap-2 py-1 px-2 rounded text-sm font-mono hover:bg-white/5">
            <span className="text-muted-foreground">102</span>
            <span className="text-muted-foreground">Bob</span>
            <span className="text-muted-foreground">1</span>
          </div>
        </div>

        {/* JSON Document */}
        <div className="bg-card p-4">
          <div className="flex items-center gap-2 mb-3 text-sm">
            <span className="text-cyan-400">{}</span>
            <span className="text-cyan-400 font-mono text-xs uppercase tracking-wider">employee_dv</span>
          </div>
          <pre className="font-mono text-sm leading-relaxed">
            <span className="json-bracket">{"{"}</span>
            {"\n  "}
            <span className="json-key">"_id"</span>: <span className="json-number">101</span>,
            {"\n  "}
            <span className="json-key">"name"</span>: <span className="json-string">"Alice"</span>,
            {"\n  "}
            <span className="json-key">"department"</span>: <span className="json-bracket">{"{"}</span>
            {"\n    "}
            <span className="json-key">"id"</span>: <span className="json-number json-highlight">{dept.id}</span>,
            {"\n    "}
            <span className="json-key">"name"</span>: <span className="json-string" style={{ background: "rgba(74,222,128,0.12)", padding: "0 .2em", borderRadius: "2px" }}>"{dept.name}"</span>,
            {"\n    "}
            <span className="json-key">"head"</span>: <span className="json-string">"{dept.head}"</span>,
            {"\n    "}
            <span className="json-key">"budget"</span>: <span className="json-number">{dept.budget.toLocaleString()}</span>
            {"\n  "}
            <span className="json-bracket">{"}"}</span>
            {"\n"}
            <span className="json-bracket">{"}"}</span>
          </pre>
        </div>
      </div>
    </div>
  );
}

// ============== PROPERTY GRAPH WIDGET ==============
type NodeType = "person" | "movie" | "review";

interface GraphNode {
  id: string;
  label: string;
  sublabel?: string;
  type: NodeType;
  x: number;
  y: number;
  props: Record<string, string | number>;
}

interface GraphEdge {
  from: string;
  to: string;
  label: string;
}

const graphNodes: GraphNode[] = [
  { id: "keanu", label: "Keanu", sublabel: "Reeves", type: "person", x: 100, y: 190, props: { born: 1964, nationality: "Canadian" } },
  { id: "carrie", label: "Carrie-Anne", sublabel: "Moss", type: "person", x: 100, y: 80, props: { born: 1967, nationality: "American" } },
  { id: "lana", label: "Lana", sublabel: "Wachowski", type: "person", x: 100, y: 300, props: { born: 1965, nationality: "American" } },
  { id: "matrix", label: "The", sublabel: "Matrix", type: "movie", x: 340, y: 120, props: { year: 1999, genre: "Sci-Fi", rating: 8.7 } },
  { id: "john", label: "John", sublabel: "Wick", type: "movie", x: 340, y: 280, props: { year: 2014, genre: "Action", rating: 7.4 } },
  { id: "rev1", label: "Review", sublabel: "#1", type: "review", x: 540, y: 80, props: { rating: 5, user: "Alice" } },
  { id: "rev2", label: "Review", sublabel: "#2", type: "review", x: 540, y: 200, props: { rating: 4, user: "Bob" } },
  { id: "rev3", label: "Review", sublabel: "#3", type: "review", x: 540, y: 320, props: { rating: 5, user: "Carol" } },
];

const graphEdges: GraphEdge[] = [
  { from: "keanu", to: "matrix", label: "ACTED_IN" },
  { from: "carrie", to: "matrix", label: "ACTED_IN" },
  { from: "lana", to: "matrix", label: "DIRECTED" },
  { from: "keanu", to: "john", label: "ACTED_IN" },
  { from: "rev1", to: "matrix", label: "REVIEWS" },
  { from: "rev2", to: "matrix", label: "REVIEWS" },
  { from: "rev3", to: "john", label: "REVIEWS" },
];

function PropertyGraphWidget() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "person" | "movie">("all");
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left + 10,
      y: e.clientY - rect.top + 10,
    });
  }, []);

  const filteredNodes = graphNodes.filter((n) => {
    if (filter === "all") return true;
    if (filter === "person") return n.type === "person";
    if (filter === "movie") return n.type === "movie";
    return true;
  });

  const visibleNodeIds = new Set(filteredNodes.map((n) => n.id));

  const getNodeColor = (type: NodeType) => {
    switch (type) {
      case "person": return "#4ade80";
      case "movie": return "#f43f5e";
      case "review": return "#a78bfa";
    }
  };

  const isNodeActive = (nodeId: string) => {
    const isHovered = hoveredNode === nodeId;
    const isSelected = selectedNode === nodeId;
    return isHovered || isSelected;
  };

  const isEdgeActive = (edge: GraphEdge) => {
    if (!selectedNode && !hoveredNode) return false;
    return edge.from === selectedNode || edge.to === selectedNode ||
           edge.from === hoveredNode || edge.to === hoveredNode;
  };

  const activeNodeId = hoveredNode || selectedNode;
  const connectionCount = activeNodeId
    ? graphEdges.filter((e) => e.from === activeNodeId || e.to === activeNodeId).length
    : 0;

  const activeNode = activeNodeId
    ? graphNodes.find((n) => n.id === activeNodeId)
    : null;

  return (
    <div className="widget-container bg-card border border-border rounded-xl p-6 my-8 overflow-hidden">
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-mono">Interactive · Property Graph Visualization</div>

      <div
        className="relative w-full min-h-[380px]"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredNode(null)}
      >
        <svg viewBox="0 0 680 380" className="w-full h-[380px]">
          {/* Grid lines */}
          {Array.from({ length: 17 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={i * 40}
              y1="0"
              x2={i * 40}
              y2="380"
              stroke="rgba(255,255,255,0.02)"
              strokeWidth="0.5"
            />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1="0"
              y1={i * 40}
              x2="680"
              y2={i * 40}
              stroke="rgba(255,255,255,0.02)"
              strokeWidth="0.5"
            />
          ))}

          {/* Edges */}
          {graphEdges.map((edge, idx) => {
            const fromNode = graphNodes.find((n) => n.id === edge.from);
            const toNode = graphNodes.find((n) => n.id === edge.to);
            if (!fromNode || !toNode) return null;
            if (!visibleNodeIds.has(edge.from) || !visibleNodeIds.has(edge.to)) return null;

            const isActive = isEdgeActive(edge);
            const midX = (fromNode.x + toNode.x) / 2;
            const midY = (fromNode.y + toNode.y) / 2;

            return (
              <g key={idx}>
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={isActive ? getNodeColor(fromNode.type) : "rgba(255,255,255,0.12)"}
                  strokeWidth={isActive ? 2.5 : 1.2}
                  strokeDasharray={isActive ? "6 3" : "none"}
                  style={{ transition: "all 0.2s" }}
                />
                <text
                  x={midX}
                  y={midY - 8}
                  textAnchor="middle"
                  fontSize="8"
                  fill={isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)"}
                  style={{ transition: "fill 0.2s" }}
                >
                  {edge.label}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {filteredNodes.map((node) => {
            const isActive = isNodeActive(node.id);
            const color = getNodeColor(node.type);
            return (
              <g
                key={node.id}
                className="graph-node cursor-pointer"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                style={{ opacity: selectedNode && !isActive ? 0.3 : 1 }}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.type === "movie" ? 30 : 26}
                  fill="rgba(13,13,15,0.8)"
                  stroke={color}
                  strokeWidth={node.type === "movie" || isActive ? 3 : 1.8}
                  filter={isActive ? `url(#glow-${node.type})` : undefined}
                />
                <text
                  x={node.x}
                  y={node.y - 3}
                  textAnchor="middle"
                  fontSize="9"
                  fill={node.type === "movie" ? "#fff" : "#e4e4e7"}
                  fontWeight={node.type === "movie" ? 600 : 400}
                >
                  {node.label}
                </text>
                <text
                  x={node.x}
                  y={node.y + 11}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#e4e4e7"
                >
                  {node.sublabel}
                </text>
              </g>
            );
          })}

          {/* Filters */}
          <defs>
            <filter id="glow-person">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#4ade80" floodOpacity="0.5" />
            </filter>
            <filter id="glow-movie">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f43f5e" floodOpacity="0.5" />
            </filter>
            <filter id="glow-review">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#a78bfa" floodOpacity="0.5" />
            </filter>
          </defs>
        </svg>

        {/* Tooltip */}
        {activeNode && (
          <div
            className="absolute bg-black/90 border border-border rounded-lg p-3 text-sm pointer-events-none z-10 max-w-[250px]"
            style={{ left: tooltipPos.x, top: tooltipPos.y, opacity: 1 }}
          >
            <div className="text-xs uppercase tracking-wider font-mono mb-1" style={{ color: getNodeColor(activeNode.type) }}>
              {activeNode.type}
            </div>
            <div className="font-semibold mb-2">{activeNode.label} {activeNode.sublabel}</div>
            {Object.entries(activeNode.props).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4">
                <span className="text-muted-foreground">{key}:</span>
                <span>{value}</span>
              </div>
            ))}
            <div className="mt-2 text-muted-foreground text-xs">{connectionCount} connections</div>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-4 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`btn-mono ${filter === "all" ? "active" : ""}`}
        >
          Show All
        </button>
        <button
          onClick={() => setFilter("person")}
          className={`btn-mono ${filter === "person" ? "active" : ""}`}
        >
          People Only
        </button>
        <button
          onClick={() => setFilter("movie")}
          className={`btn-mono ${filter === "movie" ? "active" : ""}`}
        >
          Movies Only
        </button>
      </div>
    </div>
  );
}

// ============== VECTOR SEARCH WIDGET ==============
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

function VectorSearchWidget() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [k, setK] = useState(3);
  const [rotation, setRotation] = useState(25);
  const [metric, setMetric] = useState<DistanceMetric>("euclidean");
  const [query, setQuery] = useState({ x: 0.5, y: 0.5, z: 0.5 });
  const [isDragging, setIsDragging] = useState(false);

  const project = useCallback((x: number, y: number, z: number, width: number, height: number) => {
    const angle = (rotation * Math.PI) / 180;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const rx = x * cosA - z * sinA;
    const rz = x * sinA + z * cosA;

    const perspective = 1 + rz * 0.5;
    const screenX = (rx - 0.5) * width * perspective + width / 2;
    const screenY = ((y - 0.5) * cosA * 0.3 + 0.5) * height;

    return { x: screenX, y: screenY, z: rz, scale: perspective };
  }, [rotation]);

  const calculateDistance = useCallback((p1: DataPoint, p2: { x: number; y: number; z: number }) => {
    switch (metric) {
      case "euclidean":
        return Math.sqrt(
          Math.pow(p1.x - p2.x, 2) +
          Math.pow(p1.y - p2.y, 2) +
          Math.pow(p1.z - p2.z, 2)
        );
      case "cosine": {
        const dot = p1.x * p2.x + p1.y * p2.y + p1.z * p2.z;
        const mag1 = Math.sqrt(p1.x ** 2 + p1.y ** 2 + p1.z ** 2);
        const mag2 = Math.sqrt(p2.x ** 2 + p2.y ** 2 + p2.z ** 2);
        return 1 - dot / (mag1 * mag2);
      }
      case "dot": {
        return -(p1.x * p2.x + p1.y * p2.y + p1.z * p2.z);
      }
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

    // Draw background gradient
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
    gradient.addColorStop(0, "rgba(167,139,250,0.05)");
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Sort points by z for proper depth rendering
    const projectedPoints = dataPoints.map((p) => ({
      ...p,
      ...project(p.x, p.y, p.z, width, height),
    }));

    projectedPoints.sort((a, b) => a.z - b.z);

    // Calculate nearest neighbors
    const distances = dataPoints.map((p) => ({
      id: p.id,
      label: p.label,
      distance: calculateDistance(p, query),
    }));
    distances.sort((a, b) => a.distance - b.distance);
    const nearest = distances.slice(0, k);
    const nearestIds = new Set(nearest.map((n) => n.id));

    // Draw connection lines to nearest neighbors
    const queryProjected = project(query.x, query.y, query.z, width, height);
    projectedPoints.forEach((p) => {
      if (nearestIds.has(p.id)) {
        ctx.beginPath();
        ctx.moveTo(queryProjected.x, queryProjected.y);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = "rgba(167,139,250,0.3)";
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Distance label
        const midX = (queryProjected.x + p.x) / 2;
        const midY = (queryProjected.y + p.y) / 2;
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "10px JetBrains Mono";
        const dist = distances.find((d) => d.id === p.id);
        if (dist) {
          ctx.fillText(dist.distance.toFixed(3), midX + 5, midY);
        }
      }
    });

    // Draw data points
    projectedPoints.forEach((p) => {
      const isNearest = nearestIds.has(p.id);
      const radius = isNearest ? 8 * p.scale : 5 * p.scale;

      // Draw sphere
      const sphereGradient = ctx.createRadialGradient(p.x - radius / 3, p.y - radius / 3, 0, p.x, p.y, radius);
      if (isNearest) {
        sphereGradient.addColorStop(0, "#facc15");
        sphereGradient.addColorStop(1, "#f97316");
      } else {
        sphereGradient.addColorStop(0, "#4ade80");
        sphereGradient.addColorStop(1, "#22d3ee");
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = sphereGradient;
      ctx.fill();

      // Draw label
      if (p.scale > 0.7) {
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "10px JetBrains Mono";
        ctx.fillText(p.label, p.x + 10, p.y + 3);
      }
    });

    // Draw query point (pink)
    const qRadius = 12 * queryProjected.scale;
    const queryGradient = ctx.createRadialGradient(
      queryProjected.x - qRadius / 3,
      queryProjected.y - qRadius / 3,
      0,
      queryProjected.x,
      queryProjected.y,
      qRadius
    );
    queryGradient.addColorStop(0, "#f472b6");
    queryGradient.addColorStop(1, "#a78bfa");

    ctx.beginPath();
    ctx.arc(queryProjected.x, queryProjected.y, qRadius, 0, Math.PI * 2);
    ctx.fillStyle = queryGradient;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Query label
    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px JetBrains Mono";
    ctx.fillText("QUERY", queryProjected.x + 15, queryProjected.y + 3);
  }, [query, k, rotation, metric, project, calculateDistance]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Clamp to reasonable range
    setQuery({
      x: Math.max(0.1, Math.min(0.9, x)),
      y: Math.max(0.1, Math.min(0.9, y)),
      z: 0.5,
    });
  };

  const handleMetricChange = (newMetric: DistanceMetric) => {
    setMetric(newMetric);
  };

  return (
    <div className="widget-container bg-card border border-border rounded-xl p-6 my-8 overflow-hidden">
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-mono">Interactive · Similarity Search in 3D Space</div>

      <div className="flex items-center gap-4 mb-3 flex-wrap">
        <label className="font-mono text-sm text-muted-foreground">k nearest:</label>
        <input
          type="range"
          min="1"
          max="8"
          value={k}
          onChange={(e) => setK(Number(e.target.value))}
          className="w-28"
        />
        <span className="font-mono text-purple-400">{k}</span>
        <div className="flex-1"></div>
        <label className="font-mono text-sm text-muted-foreground">Rotate:</label>
        <input
          type="range"
          min="0"
          max="360"
          value={rotation}
          onChange={(e) => setRotation(Number(e.target.value))}
          className="w-28"
        />
      </div>

      <div
        className="relative w-full h-[420px] rounded-lg overflow-hidden"
        style={{ background: "radial-gradient(ellipse at center,rgba(167,139,250,0.05),transparent 70%)" }}
      >
        <canvas
          ref={canvasRef}
          width={1360}
          height={840}
          className="w-full h-full cursor-crosshair"
          onClick={handleCanvasClick}
        />
      </div>

      <div className="mt-4 font-mono text-sm text-muted-foreground">
        <span className="text-muted-foreground">Top {k} nearest ({metric}):</span>{" "}
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
        <button
          onClick={() => handleMetricChange("euclidean")}
          className={`btn-mono ${metric === "euclidean" ? "active" : ""}`}
        >
          Euclidean
        </button>
        <button
          onClick={() => handleMetricChange("cosine")}
          className={`btn-mono ${metric === "cosine" ? "active" : ""}`}
        >
          Cosine
        </button>
        <button
          onClick={() => handleMetricChange("dot")}
          className={`btn-mono ${metric === "dot" ? "active" : ""}`}
        >
          Dot Product
        </button>
      </div>
    </div>
  );
}

// ============== MAIN PAGE COMPONENT ==============
export default function Home() {
  const [testClick, setTestClick] = useState(false);

  return (
    <main>
      {/* Test button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          type="button"
          onClick={() => setTestClick(!testClick)}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-orange-600 transition-colors"
        >
          {testClick ? "JS WORKS! Clicked!" : "Test JS"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/85 backdrop-blur-xl border-b border-border px-6 py-3 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 font-bold text-lg text-foreground no-underline">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center font-extrabold text-white text-sm">
            O
          </div>
          <span>/ blog</span>
        </a>
        <div className="flex gap-6">
          <a href="#duality" className="text-muted-foreground no-underline text-sm font-medium hover:text-foreground transition-colors">
            JSON Duality
          </a>
          <a href="#graphs" className="text-muted-foreground no-underline text-sm font-medium hover:text-foreground transition-colors">
            Property Graphs
          </a>
          <a href="#vectors" className="text-muted-foreground no-underline text-sm font-medium hover:text-foreground transition-colors">
            Vector Search
          </a>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden py-16 px-6 hero-gradient">
        <div className="hero-glow" />
        <div className="max-w-3xl mx-auto relative">
          <div className="flex items-center gap-3 mb-8 text-sm">
            <span className="text-muted-foreground">MAR 31, 2026</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">Interactive Guide</span>
            <span className="text-muted-foreground">·</span>
            <span className="bg-purple-500/15 text-purple-300 px-2 py-0.5 rounded text-xs font-semibold uppercase">
              AI Database
            </span>
          </div>
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight mb-4">
            Oracle AI Database<br />from the ground up
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            Oracle Database 23ai converges <span className="text-relational">relational</span>,{" "}
            <span className="text-json">JSON</span>, <span className="text-graph">graph</span>, and{" "}
            <span className="text-vector">vector</span> data into a single engine. But what does that actually <em>mean</em>? Let&apos;s explore each capability interactively.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 pb-24">
        {/* Table of Contents */}
        <div className="bg-card border border-border rounded-xl p-6 my-8">
          <h4 className="font-semibold mb-3">In this post, you are going to learn:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><a href="#duality" className="text-muted-foreground no-underline hover:text-cyan-400">How JSON Duality Views unify relational tables and JSON documents</a></li>
            <li><a href="#cascade" className="text-muted-foreground no-underline hover:text-cyan-400">How cascading updates propagate across dual views in real time</a></li>
            <li><a href="#graphs" className="text-muted-foreground no-underline hover:text-cyan-400">What property graphs are and how they model relationships</a></li>
            <li><a href="#vectors" className="text-muted-foreground no-underline hover:text-cyan-400">How similarity search works, simplified to 3D space</a></li>
          </ul>
        </div>

        {/* JSON Duality Section */}
        <section id="duality">
          <h2 className="text-3xl font-bold leading-tight mt-14 mb-4">What are JSON Duality Views?</h2>
          <p className="text-muted-foreground mb-4">
            Relational databases store data in <span className="text-relational">tables</span> — rows and columns with strict schemas. Document databases store data as flexible <span className="text-json">JSON documents</span>. Developers have been forced to choose one or the other, or glue them together with complex ORM layers.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>JSON Duality Views</strong> solve this. They give you <em>both representations simultaneously</em> from the same underlying data. Think of it like looking at a sculpture from two angles — same object, different views.
          </p>
          <p className="text-muted-foreground mb-4">
            Below is a live example. On the left, data lives in a <span className="text-relational">relational table</span>. On the right, the same data is exposed as a <span className="text-json">JSON document</span>. <strong>Click any name</strong> in either view to edit it, and watch the other side update instantly.
          </p>
          <JsonDualityWidget />
        </section>

        {/* Cascading Updates Section */}
        <section id="cascade">
          <h2 className="text-3xl font-bold leading-tight mt-14 mb-4">How cascading updates propagate</h2>
          <p className="text-muted-foreground mb-4">
            The real magic happens when data has <em>relationships</em>. In a duality view, updating a <span className="text-keyword">foreign key</span> in the relational side automatically restructures the JSON document. And editing a nested JSON object cascades back to the correct table rows.
          </p>
          <p className="text-muted-foreground mb-4">
            Play with the slider below. It controls the <span className="text-relational">department_id</span> of employee "Alice". Watch how the JSON document restructures itself — the <span className="text-json">department</span> nested object changes, and the <span className="text-relational">relational row</span> updates simultaneously.
          </p>
          <CascadeWidget />
          <p className="text-muted-foreground mb-4">
            Notice how when you change the <code className="bg-white/5 px-1 rounded text-sm">dept_id</code> from <code className="bg-white/5 px-1 rounded text-sm">1</code> to <code className="bg-white/5 px-1 rounded text-sm">2</code>, the nested JSON object transforms from <span className="text-json">"Engineering"</span> to <span className="text-json">"Marketing"</span>. The database resolves the foreign key relationship and produces the correct document shape — no application code needed.
          </p>
        </section>

        {/* Property Graphs Section */}
        <section id="graphs">
          <h2 className="text-3xl font-bold leading-tight mt-14 mb-4">What are Property Graphs?</h2>
          <p className="text-muted-foreground mb-4">
            Some data is inherently about <em>connections</em>. Social networks, supply chains, fraud rings — these are best understood as <span className="text-graph">graphs</span> of entities linked by relationships.
          </p>
          <p className="text-muted-foreground mb-4">
            A <strong>property graph</strong> consists of <span className="text-graph">nodes</span> (entities) and <span className="text-graph">edges</span> (relationships). Both can carry <span className="text-keyword">properties</span> — key-value pairs. Oracle Database 23ai lets you define property graphs on your relational tables, querying them with the SQL/PGQ standard.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>Hover</strong> over any node to see its properties and highlight connections. <strong>Click</strong> to lock selection.
          </p>
          <PropertyGraphWidget />
          <p className="text-muted-foreground mb-4">
            Each <span className="text-graph">green node</span> is a Person, each <span className="text-destructive">red node</span> is a Movie, and each <span className="text-vector">purple node</span> is a Review. Edges encode relationships like <code className="bg-white/5 px-1 rounded text-sm">ACTED_IN</code>, <code className="bg-white/5 px-1 rounded text-sm">DIRECTED</code>, and <code className="bg-white/5 px-1 rounded text-sm">WROTE_REVIEW</code>. With SQL/PGQ you can query paths like <em>"Find all actors within 2 hops of a given director."</em>
          </p>
        </section>

        {/* Vector Search Section */}
        <section id="vectors">
          <h2 className="text-3xl font-bold leading-tight mt-14 mb-4">How does Similarity Search work?</h2>
          <p className="text-muted-foreground mb-4">
            Modern AI models convert text, images, and audio into <span className="text-vector">vectors</span> — arrays of numbers that capture <em>semantic meaning</em>. Similar things end up close together in vector space. Oracle Database 23ai stores these vectors and finds closest matches via <strong>similarity search</strong>.
          </p>
          <p className="text-muted-foreground mb-4">
            Imagine a simplified 3D space where each point is a document. <strong>Click anywhere</strong> in the space to move the <span className="text-purple-400 font-bold">pink query point</span> and watch nearest neighbors update in real time. Use the <strong>k slider</strong> to change how many neighbors to find.
          </p>
          <VectorSearchWidget />
          <p className="text-muted-foreground mb-4">
            Each colored sphere represents a document embedded into 3D space. Oracle&apos;s vector index rapidly identifies the <code className="bg-white/5 px-1 rounded text-sm">k</code> nearest neighbors. In production, vectors might have <strong>hundreds or thousands</strong> of dimensions — but the principle is identical.
          </p>
          <p className="text-muted-foreground mb-4">
            Oracle supports multiple distance metrics: <span className="text-vector">Euclidean</span> (straight-line), <span className="text-vector">Cosine</span> (angular similarity), and <span className="text-vector">Dot Product</span> (direction + magnitude). Different use cases favor different metrics.
          </p>
        </section>

        {/* Conclusion */}
        <section>
          <h2 className="text-3xl font-bold leading-tight mt-14 mb-4">The convergence advantage</h2>
          <p className="text-muted-foreground mb-4">
            What makes Oracle Database 23ai unique is that <span className="text-relational">relational</span>, <span className="text-json">JSON</span>, <span className="text-graph">graph</span>, and <span className="text-vector">vector</span> operations all happen in the <strong>same engine, on the same data</strong>. You can run a graph traversal, filter by a JSON attribute, perform a vector similarity search, and join with relational tables — all in a single SQL query.
          </p>
          <p className="text-muted-foreground mb-4">
            This isn&apos;t just convenient — it&apos;s a fundamental architectural advantage. When your AI application needs to combine semantic search with structured filters and relationship traversals, Oracle 23ai handles it natively, with full ACID transactions across all data models.
          </p>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 text-center">
        <p className="text-muted-foreground text-sm">
          Built as an interactive exploration of Oracle Database 23ai capabilities.
        </p>
        <p className="text-muted-foreground text-sm mt-2">
          Inspired by the visual style of educational technical blogs.
        </p>
      </footer>
    </main>
  );
}