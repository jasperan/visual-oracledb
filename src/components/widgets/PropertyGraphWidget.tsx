"use client";

import { useState, useCallback } from "react";

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

export function PropertyGraphWidget() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "person" | "movie">("all");
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: e.clientX - rect.left + 10, y: e.clientY - rect.top + 10 });
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

  const isNodeActive = (nodeId: string) => hoveredNode === nodeId || selectedNode === nodeId;

  const isEdgeActive = (edge: GraphEdge) => {
    if (!selectedNode && !hoveredNode) return false;
    return edge.from === selectedNode || edge.to === selectedNode ||
           edge.from === hoveredNode || edge.to === hoveredNode;
  };

  const activeNodeId = hoveredNode || selectedNode;
  const connectionCount = activeNodeId
    ? graphEdges.filter((e) => e.from === activeNodeId || e.to === activeNodeId).length
    : 0;
  const activeNode = activeNodeId ? graphNodes.find((n) => n.id === activeNodeId) : null;

  return (
    <div className="widget-container bg-card border border-border rounded-xl p-6 my-8 overflow-hidden">
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-mono">Interactive · Property Graph Visualization</div>

      <div className="relative w-full min-h-[380px]" onMouseMove={handleMouseMove} onMouseLeave={() => setHoveredNode(null)}>
        <svg viewBox="0 0 680 380" className="w-full h-[380px]">
          {Array.from({ length: 17 }).map((_, i) => (
            <line key={`v-${i}`} x1={i * 40} y1="0" x2={i * 40} y2="380" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <line key={`h-${i}`} x1="0" y1={i * 40} x2="680" y2={i * 40} stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
          ))}

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
                <line x1={fromNode.x} y1={fromNode.y} x2={toNode.x} y2={toNode.y}
                  stroke={isActive ? getNodeColor(fromNode.type) : "rgba(255,255,255,0.12)"}
                  strokeWidth={isActive ? 2.5 : 1.2} strokeDasharray={isActive ? "6 3" : "none"}
                  style={{ transition: "all 0.2s" }} />
                <text x={midX} y={midY - 8} textAnchor="middle" fontSize="8"
                  fill={isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)"}
                  style={{ transition: "fill 0.2s" }}>{edge.label}</text>
              </g>
            );
          })}

          {filteredNodes.map((node) => {
            const isActive = isNodeActive(node.id);
            const color = getNodeColor(node.type);
            return (
              <g key={node.id} className="graph-node cursor-pointer"
                onMouseEnter={() => setHoveredNode(node.id)} onMouseLeave={() => setHoveredNode(null)}
                onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                style={{ opacity: selectedNode && !isActive ? 0.3 : 1 }}>
                <circle cx={node.x} cy={node.y} r={node.type === "movie" ? 30 : 26}
                  fill="rgba(13,13,15,0.8)" stroke={color}
                  strokeWidth={node.type === "movie" || isActive ? 3 : 1.8}
                  filter={isActive ? `url(#glow-${node.type})` : undefined} />
                <text x={node.x} y={node.y - 3} textAnchor="middle" fontSize="9"
                  fill={node.type === "movie" ? "#fff" : "#e4e4e7"}
                  fontWeight={node.type === "movie" ? 600 : 400}>{node.label}</text>
                <text x={node.x} y={node.y + 11} textAnchor="middle" fontSize="9" fill="#e4e4e7">{node.sublabel}</text>
              </g>
            );
          })}

          <defs>
            <filter id="glow-person"><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#4ade80" floodOpacity="0.5" /></filter>
            <filter id="glow-movie"><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f43f5e" floodOpacity="0.5" /></filter>
            <filter id="glow-review"><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#a78bfa" floodOpacity="0.5" /></filter>
          </defs>
        </svg>

        {activeNode && (
          <div className="absolute bg-black/90 border border-border rounded-lg p-3 text-sm pointer-events-none z-10 max-w-[250px]"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}>
            <div className="text-xs uppercase tracking-wider font-mono mb-1" style={{ color: getNodeColor(activeNode.type) }}>{activeNode.type}</div>
            <div className="font-semibold mb-2">{activeNode.label} {activeNode.sublabel}</div>
            {Object.entries(activeNode.props).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4">
                <span className="text-muted-foreground">{key}:</span><span>{value}</span>
              </div>
            ))}
            <div className="mt-2 text-muted-foreground text-xs">{connectionCount} connections</div>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-4 flex-wrap">
        <button onClick={() => setFilter("all")} className={`btn-mono ${filter === "all" ? "active" : ""}`}>Show All</button>
        <button onClick={() => setFilter("person")} className={`btn-mono ${filter === "person" ? "active" : ""}`}>People Only</button>
        <button onClick={() => setFilter("movie")} className={`btn-mono ${filter === "movie" ? "active" : ""}`}>Movies Only</button>
      </div>
    </div>
  );
}
