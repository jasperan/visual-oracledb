"use client";

import { useState, useCallback, useEffect, useRef } from "react";

type NodeType = "person" | "movie" | "review" | "award" | "studio";

interface GraphNode {
  id: string;
  label: string;
  sublabel?: string;
  type: NodeType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  props: Record<string, string | number>;
}

interface GraphEdge {
  from: string;
  to: string;
  label: string;
}

const initialNodes: Omit<GraphNode, "vx" | "vy">[] = [
  { id: "keanu", label: "Keanu", sublabel: "Reeves", type: "person", x: 80, y: 180, props: { born: 1964, nationality: "Canadian" } },
  { id: "carrie", label: "Carrie-Anne", sublabel: "Moss", type: "person", x: 80, y: 80, props: { born: 1967, nationality: "American" } },
  { id: "lana", label: "Lana", sublabel: "Wachowski", type: "person", x: 80, y: 290, props: { born: 1965, nationality: "American" } },
  { id: "laurence", label: "Laurence", sublabel: "Fishburne", type: "person", x: 80, y: 380, props: { born: 1961, nationality: "American" } },
  { id: "matrix", label: "The", sublabel: "Matrix", type: "movie", x: 310, y: 130, props: { year: 1999, genre: "Sci-Fi", rating: 8.7 } },
  { id: "john", label: "John", sublabel: "Wick", type: "movie", x: 310, y: 300, props: { year: 2014, genre: "Action", rating: 7.4 } },
  { id: "matrix2", label: "Matrix", sublabel: "Reloaded", type: "movie", x: 310, y: 430, props: { year: 2003, genre: "Sci-Fi", rating: 7.2 } },
  { id: "rev1", label: "Review", sublabel: "#1", type: "review", x: 540, y: 60, props: { rating: 5, user: "Alice" } },
  { id: "rev2", label: "Review", sublabel: "#2", type: "review", x: 540, y: 180, props: { rating: 4, user: "Bob" } },
  { id: "rev3", label: "Review", sublabel: "#3", type: "review", x: 540, y: 340, props: { rating: 5, user: "Carol" } },
  { id: "oscar", label: "Academy", sublabel: "Award", type: "award", x: 540, y: 460, props: { category: "Visual Effects", year: 2000 } },
  { id: "warner", label: "Warner", sublabel: "Bros.", type: "studio", x: 310, y: 30, props: { founded: 1923, hq: "Burbank, CA" } },
];

const graphEdges: GraphEdge[] = [
  { from: "keanu", to: "matrix", label: "ACTED_IN" },
  { from: "carrie", to: "matrix", label: "ACTED_IN" },
  { from: "lana", to: "matrix", label: "DIRECTED" },
  { from: "keanu", to: "john", label: "ACTED_IN" },
  { from: "keanu", to: "matrix2", label: "ACTED_IN" },
  { from: "carrie", to: "matrix2", label: "ACTED_IN" },
  { from: "laurence", to: "matrix", label: "ACTED_IN" },
  { from: "laurence", to: "matrix2", label: "ACTED_IN" },
  { from: "lana", to: "matrix2", label: "DIRECTED" },
  { from: "rev1", to: "matrix", label: "REVIEWS" },
  { from: "rev2", to: "matrix", label: "REVIEWS" },
  { from: "rev3", to: "john", label: "REVIEWS" },
  { from: "matrix", to: "oscar", label: "WON" },
  { from: "warner", to: "matrix", label: "PRODUCED" },
  { from: "warner", to: "matrix2", label: "PRODUCED" },
  { from: "warner", to: "john", label: "PRODUCED" },
];

function getNodeColor(type: NodeType): string {
  switch (type) {
    case "person": return "#4ade80";
    case "movie": return "#f43f5e";
    case "review": return "#a78bfa";
    case "award": return "#facc15";
    case "studio": return "#38bdf8";
  }
}

function getNodeRadius(type: NodeType): number {
  switch (type) {
    case "movie": return 32;
    case "studio": return 28;
    default: return 26;
  }
}

// BFS shortest path
function findShortestPath(from: string, to: string): string[] | null {
  if (from === to) return [from];
  const visited = new Set<string>();
  const queue: { node: string; path: string[] }[] = [{ node: from, path: [from] }];
  visited.add(from);

  while (queue.length > 0) {
    const current = queue.shift()!;
    // Find all neighbors (undirected)
    for (const edge of graphEdges) {
      let neighbor: string | null = null;
      if (edge.from === current.node) neighbor = edge.to;
      else if (edge.to === current.node) neighbor = edge.from;
      if (neighbor && !visited.has(neighbor)) {
        const newPath = [...current.path, neighbor];
        if (neighbor === to) return newPath;
        visited.add(neighbor);
        queue.push({ node: neighbor, path: newPath });
      }
    }
  }
  return null;
}

function buildQueryForNode(node: GraphNode): string {
  const typeName = node.type.charAt(0).toUpperCase() + node.type.slice(1);
  return `SELECT v, e, v2
FROM GRAPH_TABLE ( movie_graph
  MATCH (v IS ${typeName})
        -[e]-> (v2)
  WHERE v.name = '${node.label}${node.sublabel ? " " + node.sublabel : ""}'
  COLUMNS (
    v.name AS source,
    e.label AS relationship,
    v2.name AS target
  )
);`;
}

function buildQueryForPath(path: string[], nodes: GraphNode[]): string {
  const start = nodes.find((n) => n.id === path[0]);
  const end = nodes.find((n) => n.id === path[path.length - 1]);
  if (!start || !end) return "";
  return `SELECT path_id, step, src, rel, dst
FROM GRAPH_TABLE ( movie_graph
  MATCH SHORTEST (a) -[e]->{1,5} (b)
  WHERE a.name = '${start.label}${start.sublabel ? " " + start.sublabel : ""}'
    AND b.name = '${end.label}${end.sublabel ? " " + end.sublabel : ""}'
  COLUMNS (
    a.name AS src,
    e.label AS rel,
    b.name AS dst
  )
);`;
}

type LayoutType = "force" | "circular" | "hierarchical";

function applyCircularLayout(nodes: GraphNode[]): GraphNode[] {
  const cx = 340, cy = 250, r = 180;
  return nodes.map((n, i) => {
    const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
    return { ...n, x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, vx: 0, vy: 0 };
  });
}

function applyHierarchicalLayout(nodes: GraphNode[]): GraphNode[] {
  // Group by type into columns: person → movie → review/award/studio
  const columns: Record<string, string[]> = {
    person: [], movie: [], other: [],
  };
  for (const n of nodes) {
    if (n.type === "person") columns.person.push(n.id);
    else if (n.type === "movie") columns.movie.push(n.id);
    else columns.other.push(n.id);
  }
  const colX = [120, 340, 560];
  return nodes.map((n) => {
    let col = 2;
    let idx = columns.other.indexOf(n.id);
    if (columns.person.includes(n.id)) { col = 0; idx = columns.person.indexOf(n.id); }
    else if (columns.movie.includes(n.id)) { col = 1; idx = columns.movie.indexOf(n.id); }
    const list = col === 0 ? columns.person : col === 1 ? columns.movie : columns.other;
    const totalH = (list.length - 1) * 80;
    const startY = 250 - totalH / 2;
    return { ...n, x: colX[col], y: startY + idx * 80, vx: 0, vy: 0 };
  });
}

export function PropertyGraphWidget() {
  const [nodes, setNodes] = useState<GraphNode[]>(() =>
    initialNodes.map((n) => ({ ...n, vx: 0, vy: 0 }))
  );
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [filter, setFilter] = useState<"all" | "person" | "movie">("all");
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [shortestPath, setShortestPath] = useState<string[] | null>(null);
  const [showQuery, setShowQuery] = useState(true);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [layout, setLayout] = useState<LayoutType>("force");
  const [searchTerm, setSearchTerm] = useState("");
  const [focusedNode, setFocusedNode] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const simTickRef = useRef(0);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const didDrag = useRef(false);

  // Convert mouse event to SVG coordinates
  const mouseToSvg = useCallback((e: React.MouseEvent | MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 680;
    const y = ((e.clientY - rect.top) / rect.height) * 500;
    return { x, y };
  }, []);

  // Ref to track which node is currently being dragged (avoids stale closures in sim)
  const draggedNodeRef = useRef<string | null>(null);

  // Apply layout changes
  const switchLayout = useCallback((newLayout: LayoutType) => {
    setLayout(newLayout);
    if (newLayout === "circular") {
      setNodes((prev) => applyCircularLayout(prev));
      if (simRef.current) clearInterval(simRef.current);
    } else if (newLayout === "hierarchical") {
      setNodes((prev) => applyHierarchicalLayout(prev));
      if (simRef.current) clearInterval(simRef.current);
    } else {
      // Force — reheat the simulation
      simTickRef.current = 0;
    }
  }, []);

  // Focus mode: double-click a node to zoom into its neighborhood
  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    if (focusedNode === nodeId) {
      setFocusedNode(null); // unfocus
    } else {
      setFocusedNode(nodeId);
    }
  }, [focusedNode]);

  // Get focused neighborhood (node + 1-hop neighbors)
  const focusedNeighborIds = focusedNode
    ? new Set([
        focusedNode,
        ...graphEdges
          .filter((e) => e.from === focusedNode || e.to === focusedNode)
          .flatMap((e) => [e.from, e.to]),
      ])
    : null;

  // Force simulation on mount
  useEffect(() => {
    simTickRef.current = 0;
    const SVG_W = 680;
    const SVG_H = 500;

    simRef.current = setInterval(() => {
      simTickRef.current++;
      if (simTickRef.current > 120 && !draggedNodeRef.current) {
        if (simRef.current) clearInterval(simRef.current);
        return;
      }

      setNodes((prev) => {
        const next = prev.map((n) => ({ ...n }));
        const alpha = Math.max(0.01, 0.3 * Math.pow(0.95, simTickRef.current));

        // Repulsion between all pairs
        for (let i = 0; i < next.length; i++) {
          for (let j = i + 1; j < next.length; j++) {
            const dx = next[j].x - next[i].x;
            const dy = next[j].y - next[i].y;
            const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
            const force = (3000 / (dist * dist)) * alpha;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            next[i].vx -= fx;
            next[i].vy -= fy;
            next[j].vx += fx;
            next[j].vy += fy;
          }
        }

        // Attraction along edges
        for (const edge of graphEdges) {
          const fromIdx = next.findIndex((n) => n.id === edge.from);
          const toIdx = next.findIndex((n) => n.id === edge.to);
          if (fromIdx < 0 || toIdx < 0) continue;
          const dx = next[toIdx].x - next[fromIdx].x;
          const dy = next[toIdx].y - next[fromIdx].y;
          const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          const targetDist = 140;
          const force = ((dist - targetDist) * 0.03) * alpha;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          next[fromIdx].vx += fx;
          next[fromIdx].vy += fy;
          next[toIdx].vx -= fx;
          next[toIdx].vy -= fy;
        }

        // Center gravity
        for (const n of next) {
          n.vx += (SVG_W / 2 - n.x) * 0.005 * alpha;
          n.vy += (SVG_H / 2 - n.y) * 0.005 * alpha;
        }

        // Apply velocity with damping — but freeze the dragged node
        for (const n of next) {
          if (n.id === draggedNodeRef.current) {
            n.vx = 0;
            n.vy = 0;
            continue;
          }
          n.vx *= 0.6;
          n.vy *= 0.6;
          n.x = Math.max(40, Math.min(SVG_W - 40, n.x + n.vx));
          n.y = Math.max(40, Math.min(SVG_H - 40, n.y + n.vy));
        }

        return next;
      });
    }, 30);

    return () => {
      if (simRef.current) clearInterval(simRef.current);
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: e.clientX - rect.left + 10, y: e.clientY - rect.top + 10 });

    // Handle node dragging
    if (draggedNodeRef.current) {
      const svgPos = mouseToSvg(e);
      didDrag.current = true;
      setNodes((prev) =>
        prev.map((n) =>
          n.id === draggedNodeRef.current
            ? { ...n, x: Math.max(40, Math.min(640, svgPos.x)), y: Math.max(40, Math.min(460, svgPos.y)), vx: 0, vy: 0 }
            : n
        )
      );
      // Reheat sim so neighbors adjust
      simTickRef.current = Math.min(simTickRef.current, 80);
    }
  }, [mouseToSvg]);

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    draggedNodeRef.current = nodeId;
    setDraggedNode(nodeId);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    didDrag.current = false;

    // Restart sim if it had stopped, so other nodes react to the drag
    if (simTickRef.current > 120) {
      simTickRef.current = 80;
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (draggedNodeRef.current) {
      const wasClick = !didDrag.current;
      const nodeId = draggedNodeRef.current;
      draggedNodeRef.current = null;
      setDraggedNode(null);
      dragStartPos.current = null;

      if (wasClick) {
        // Treat as a click — trigger selection
        setSelectedNodes((prev) => {
          if (prev.length === 0) {
            setShortestPath(null);
            return [nodeId];
          }
          if (prev.length === 1 && prev[0] !== nodeId) {
            const path = findShortestPath(prev[0], nodeId);
            setShortestPath(path);
            return [prev[0], nodeId];
          }
          setShortestPath(null);
          if (prev.includes(nodeId)) return [];
          return [nodeId];
        });
      }
    }
  }, []);

  const filteredNodes = nodes.filter((n) => {
    if (filter === "all") return true;
    if (filter === "person") return n.type === "person";
    if (filter === "movie") return n.type === "movie";
    return true;
  }).filter((n) => {
    // Focus mode: only show the focused node and its neighbors
    if (focusedNeighborIds && !focusedNeighborIds.has(n.id)) return false;
    return true;
  });

  // Search matching
  const searchMatchIds = searchTerm.length >= 2
    ? new Set(nodes.filter((n) => {
        const term = searchTerm.toLowerCase();
        return n.label.toLowerCase().includes(term)
          || (n.sublabel?.toLowerCase().includes(term) ?? false)
          || n.type.toLowerCase().includes(term)
          || Object.values(n.props).some((v) => String(v).toLowerCase().includes(term));
      }).map((n) => n.id))
    : null;

  const visibleNodeIds = new Set(filteredNodes.map((n) => n.id));
  const pathEdgeSet = new Set<string>();
  if (shortestPath && shortestPath.length > 1) {
    for (let i = 0; i < shortestPath.length - 1; i++) {
      pathEdgeSet.add(`${shortestPath[i]}-${shortestPath[i + 1]}`);
      pathEdgeSet.add(`${shortestPath[i + 1]}-${shortestPath[i]}`);
    }
  }

  const isNodeActive = (nodeId: string) =>
    hoveredNode === nodeId || selectedNodes.includes(nodeId) || (shortestPath?.includes(nodeId) ?? false);

  const isEdgeActive = (edge: GraphEdge) => {
    if (pathEdgeSet.has(`${edge.from}-${edge.to}`) || pathEdgeSet.has(`${edge.to}-${edge.from}`)) return true;
    if (selectedNodes.length === 0 && !hoveredNode) return false;
    const activeId = hoveredNode || selectedNodes[0];
    return edge.from === activeId || edge.to === activeId;
  };

  const isEdgeOnPath = (edge: GraphEdge) =>
    pathEdgeSet.has(`${edge.from}-${edge.to}`) || pathEdgeSet.has(`${edge.to}-${edge.from}`);

  const activeNodeId = hoveredNode || selectedNodes[0];
  const connectionCount = activeNodeId
    ? graphEdges.filter((e) => e.from === activeNodeId || e.to === activeNodeId).length
    : 0;
  const activeNode = activeNodeId ? nodes.find((n) => n.id === activeNodeId) : null;

  // Build SQL/PGQ query for display
  let sqlQuery = "";
  if (shortestPath && shortestPath.length > 1) {
    sqlQuery = buildQueryForPath(shortestPath, nodes);
  } else if (selectedNodes.length === 1) {
    const node = nodes.find((n) => n.id === selectedNodes[0]);
    if (node) sqlQuery = buildQueryForNode(node);
  }

  return (
    <div className="widget-container bg-card border border-border rounded-xl p-6 my-8 overflow-hidden">
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-mono">
        Interactive &middot; Property Graph Visualization
      </div>

      <div className="relative w-full min-h-[500px]" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={() => { setHoveredNode(null); handleMouseUp(); }}>
        <svg ref={svgRef} viewBox="0 0 680 500" className="w-full h-[500px]">
          {/* Grid */}
          {Array.from({ length: 17 }).map((_, i) => (
            <line key={`v-${i}`} x1={i * 40} y1="0" x2={i * 40} y2="500" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 13 }).map((_, i) => (
            <line key={`h-${i}`} x1="0" y1={i * 40} x2="680" y2={i * 40} stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
          ))}

          {/* Arrow marker defs */}
          <defs>
            <marker id="arrow-default" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,255,255,0.15)" />
            </marker>
            <marker id="arrow-active" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(74,222,128,0.8)" />
            </marker>
            <marker id="arrow-path" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(250,204,21,0.8)" />
            </marker>
            <filter id="glow-person"><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#4ade80" floodOpacity="0.5" /></filter>
            <filter id="glow-movie"><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f43f5e" floodOpacity="0.5" /></filter>
            <filter id="glow-review"><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#a78bfa" floodOpacity="0.5" /></filter>
            <filter id="glow-award"><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#facc15" floodOpacity="0.5" /></filter>
            <filter id="glow-studio"><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#38bdf8" floodOpacity="0.5" /></filter>
          </defs>

          {/* Edges */}
          {graphEdges.map((edge, idx) => {
            const fromNode = nodes.find((n) => n.id === edge.from);
            const toNode = nodes.find((n) => n.id === edge.to);
            if (!fromNode || !toNode) return null;
            if (!visibleNodeIds.has(edge.from) || !visibleNodeIds.has(edge.to)) return null;

            const active = isEdgeActive(edge);
            const onPath = isEdgeOnPath(edge);
            const color = onPath ? "#facc15" : active ? getNodeColor(fromNode.type) : "rgba(255,255,255,0.12)";
            const midX = (fromNode.x + toNode.x) / 2;
            const midY = (fromNode.y + toNode.y) / 2;

            // Offset the line end so arrowhead doesn't overlap node
            const dx = toNode.x - fromNode.x;
            const dy = toNode.y - fromNode.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const toRadius = getNodeRadius(toNode.type);
            const fromRadius = getNodeRadius(fromNode.type);
            const x1 = fromNode.x + (dx / len) * fromRadius;
            const y1 = fromNode.y + (dy / len) * fromRadius;
            const x2 = toNode.x - (dx / len) * (toRadius + 6);
            const y2 = toNode.y - (dy / len) * (toRadius + 6);

            return (
              <g key={idx}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={color}
                  strokeWidth={onPath ? 3 : active ? 2.5 : 1.2}
                  strokeDasharray={active && !onPath ? "6 3" : "none"}
                  markerEnd={onPath ? "url(#arrow-path)" : active ? "url(#arrow-active)" : "url(#arrow-default)"}
                  style={{ transition: "all 0.2s" }}
                />
                <text
                  x={midX} y={midY - 8}
                  textAnchor="middle" fontSize="8"
                  fill={active || onPath ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)"}
                  style={{ transition: "fill 0.2s" }}
                >
                  {edge.label}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {filteredNodes.map((node) => {
            const active = isNodeActive(node.id);
            const isPathNode = shortestPath?.includes(node.id) ?? false;
            const isSelected = selectedNodes.includes(node.id);
            const color = getNodeColor(node.type);
            const radius = getNodeRadius(node.type);

            return (
              <g
                key={node.id}
                className="graph-node"
                style={{
                  opacity: searchMatchIds && !searchMatchIds.has(node.id)
                    ? 0.15
                    : (selectedNodes.length > 0 || shortestPath) && !active && !isPathNode ? 0.25 : 1,
                  cursor: draggedNode === node.id ? "grabbing" : "grab",
                }}
                onMouseEnter={() => { if (!draggedNodeRef.current) setHoveredNode(node.id); }}
                onMouseLeave={() => { if (!draggedNodeRef.current) setHoveredNode(null); }}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onDoubleClick={() => handleNodeDoubleClick(node.id)}
              >
                {/* Search match ring */}
                {searchMatchIds?.has(node.id) && (
                  <circle cx={node.x} cy={node.y} r={radius + 8} fill="none" stroke="#22d3ee" strokeWidth={2} opacity={0.6}>
                    <animate attributeName="r" values={`${radius + 6};${radius + 10};${radius + 6}`} dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* Selection ring */}
                {isSelected && (
                  <circle cx={node.x} cy={node.y} r={radius + 5} fill="none" stroke="#fff" strokeWidth={2} strokeDasharray="4 2" />
                )}
                <circle
                  cx={node.x} cy={node.y} r={radius}
                  fill="rgba(13,13,15,0.8)" stroke={isPathNode ? "#facc15" : color}
                  strokeWidth={active || isPathNode ? 3 : 1.8}
                  filter={active ? `url(#glow-${node.type})` : undefined}
                />
                {/* Type icon */}
                <text x={node.x} y={node.y - 3} textAnchor="middle" fontSize="9"
                  fill={node.type === "movie" ? "#fff" : "#e4e4e7"}
                  fontWeight={node.type === "movie" ? 600 : 400}>
                  {node.label}
                </text>
                <text x={node.x} y={node.y + 11} textAnchor="middle" fontSize="9" fill="#e4e4e7">
                  {node.sublabel}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {activeNode && (
          <div
            className="absolute bg-black/90 border border-border rounded-lg p-3 text-sm pointer-events-none z-10 max-w-[250px]"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <div className="text-xs uppercase tracking-wider font-mono mb-1" style={{ color: getNodeColor(activeNode.type) }}>
              {activeNode.type}
            </div>
            <div className="font-semibold mb-2">
              {activeNode.label} {activeNode.sublabel}
            </div>
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

      {/* SQL/PGQ Query Panel */}
      {showQuery && sqlQuery && (
        <div className="mt-2 bg-black/50 border border-border rounded-lg p-4 font-mono text-xs overflow-x-auto">
          <div className="text-muted-foreground uppercase tracking-wider mb-2 text-[10px]">
            SQL/PGQ Query{shortestPath ? " (Shortest Path)" : ""}
          </div>
          <pre className="text-emerald-300 whitespace-pre-wrap leading-relaxed">
            {sqlQuery}
          </pre>
        </div>
      )}

      {/* Layout + Search controls */}
      <div className="flex gap-2 mt-4 flex-wrap items-center">
        <span className="font-mono text-xs text-muted-foreground">Layout:</span>
        <button onClick={() => switchLayout("force")} className={`btn-mono ${layout === "force" ? "active" : ""}`}>Force</button>
        <button onClick={() => switchLayout("circular")} className={`btn-mono ${layout === "circular" ? "active" : ""}`}>Circular</button>
        <button onClick={() => switchLayout("hierarchical")} className={`btn-mono ${layout === "hierarchical" ? "active" : ""}`}>Hierarchical</button>
        <div className="flex-1" />
        <input
          type="text"
          placeholder="Search nodes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-black/40 border border-border rounded px-2 py-1 font-mono text-xs text-foreground w-32 outline-none focus:border-cyan-500"
        />
      </div>

      {/* Filter + Actions */}
      <div className="flex gap-2 mt-2 flex-wrap items-center">
        <button onClick={() => setFilter("all")} className={`btn-mono ${filter === "all" ? "active" : ""}`}>Show All</button>
        <button onClick={() => setFilter("person")} className={`btn-mono ${filter === "person" ? "active" : ""}`}>People Only</button>
        <button onClick={() => setFilter("movie")} className={`btn-mono ${filter === "movie" ? "active" : ""}`}>Movies Only</button>
        <div className="flex-1" />
        <button onClick={() => setShowQuery((v) => !v)} className={`btn-mono ${showQuery ? "active" : ""}`}>
          SQL/PGQ
        </button>
        {focusedNode && (
          <button onClick={() => setFocusedNode(null)} className="btn-mono active">
            Exit Focus
          </button>
        )}
        <button
          onClick={() => { setSelectedNodes([]); setShortestPath(null); setFocusedNode(null); setSearchTerm(""); }}
          className="btn-mono"
        >
          Reset
        </button>
      </div>

      {/* Legend + instructions */}
      <div className="mt-3 font-mono text-xs text-muted-foreground flex gap-4 flex-wrap items-center">
        {(["person", "movie", "review", "award", "studio"] as NodeType[]).map((type) => (
          <span key={type} className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: getNodeColor(type) }} />
            {type}
          </span>
        ))}
        <span className="text-border">|</span>
        <span>Click: select. Drag: reposition. Double-click: focus. Click two: shortest path.</span>
      </div>
    </div>
  );
}
