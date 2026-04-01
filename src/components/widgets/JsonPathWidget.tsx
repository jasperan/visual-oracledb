"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

const sampleDoc = {
  store: {
    name: "TechBooks",
    location: { city: "Austin", state: "TX" },
    books: [
      { title: "AI Fundamentals", price: 29.99, category: "AI", inStock: true },
      { title: "Graph Databases", price: 45.0, category: "Database", inStock: true },
      { title: "Vector Search", price: 39.99, category: "AI", inStock: false },
      { title: "SQL Mastery", price: 24.99, category: "Database", inStock: true },
    ],
  },
};

interface Example {
  label: string;
  path: string;
}

const examples: Example[] = [
  { label: "All titles", path: "$.store.books[*].title" },
  { label: "Store name", path: "$.store.name" },
  { label: "All prices", path: "$..price" },
  { label: "First book", path: "$.store.books[0]" },
  { label: "Location", path: "$.store.location" },
];

// ---------- Path parser ----------

interface PathSegment {
  type: "root" | "key" | "index" | "wildcard" | "recursive";
  value?: string | number;
}

function parsePathExpression(expr: string): PathSegment[] | null {
  const segments: PathSegment[] = [];
  let i = 0;
  const s = expr.trim();
  if (s.length === 0) return null;

  if (s[i] !== "$") return null;
  segments.push({ type: "root" });
  i++;

  while (i < s.length) {
    // Recursive descent: ..key
    if (s[i] === "." && s[i + 1] === ".") {
      i += 2;
      let key = "";
      while (i < s.length && s[i] !== "." && s[i] !== "[") {
        key += s[i];
        i++;
      }
      if (key.length === 0) return null;
      segments.push({ type: "recursive", value: key });
      continue;
    }

    // Dot notation: .key
    if (s[i] === ".") {
      i++;
      let key = "";
      while (i < s.length && s[i] !== "." && s[i] !== "[") {
        key += s[i];
        i++;
      }
      if (key.length === 0) return null;
      segments.push({ type: "key", value: key });
      continue;
    }

    // Bracket notation: [n] or [*]
    if (s[i] === "[") {
      i++;
      if (s[i] === "*") {
        segments.push({ type: "wildcard" });
        i++; // skip *
        if (s[i] !== "]") return null;
        i++; // skip ]
        continue;
      }
      let num = "";
      while (i < s.length && s[i] !== "]") {
        num += s[i];
        i++;
      }
      if (s[i] !== "]") return null;
      i++;
      const idx = parseInt(num, 10);
      if (isNaN(idx)) return null;
      segments.push({ type: "index", value: idx });
      continue;
    }

    // Unexpected character
    return null;
  }

  return segments;
}

function evaluatePath(
  segments: PathSegment[],
  doc: unknown
): { matchedPaths: Set<string>; values: { path: string; value: unknown }[] } {
  const matchedPaths = new Set<string>();
  const values: { path: string; value: unknown }[] = [];

  // Walk takes a list of remaining segments and a current position
  function walk(
    segs: PathSegment[],
    current: unknown,
    currentPath: string
  ) {
    if (segs.length === 0) {
      matchedPaths.add(currentPath);
      // Also mark all parent paths up to this node for highlighting
      markParentPaths(currentPath);
      values.push({ path: currentPath, value: current });
      return;
    }

    const [head, ...rest] = segs;

    switch (head.type) {
      case "root":
        walk(rest, current, "$");
        break;

      case "key":
        if (
          current !== null &&
          typeof current === "object" &&
          !Array.isArray(current)
        ) {
          const obj = current as Record<string, unknown>;
          const key = head.value as string;
          if (key in obj) {
            walk(rest, obj[key], `${currentPath}.${key}`);
          }
        }
        break;

      case "index":
        if (Array.isArray(current)) {
          const idx = head.value as number;
          if (idx >= 0 && idx < current.length) {
            walk(rest, current[idx], `${currentPath}[${idx}]`);
          }
        }
        break;

      case "wildcard":
        if (Array.isArray(current)) {
          current.forEach((item, idx) => {
            walk(rest, item, `${currentPath}[${idx}]`);
          });
        }
        break;

      case "recursive": {
        const key = head.value as string;
        // Search recursively for the key
        const descend = (val: unknown, path: string): void => {
          if (val !== null && typeof val === "object") {
            if (Array.isArray(val)) {
              val.forEach((item, idx) => {
                descend(item, `${path}[${idx}]`);
              });
            } else {
              const obj = val as Record<string, unknown>;
              for (const k of Object.keys(obj)) {
                const childPath = `${path}.${k}`;
                if (k === key) {
                  walk(rest, obj[k], childPath);
                }
                descend(obj[k], childPath);
              }
            }
          }
        }
        descend(current, currentPath);
        break;
      }
    }
  }

  function markParentPaths(path: string) {
    // Mark ancestor paths so tree nodes along the path highlight
    let p = path;
    while (p.length > 0) {
      matchedPaths.add(p);
      // Strip last segment
      const dotIdx = p.lastIndexOf(".");
      const bracketIdx = p.lastIndexOf("[");
      const cutIdx = Math.max(dotIdx, bracketIdx);
      if (cutIdx <= 0) break;
      p = p.substring(0, cutIdx);
    }
  }

  walk(segments, doc, "");
  return { matchedPaths, values };
}

// ---------- JSON tree renderer ----------

function JsonTreeNode({
  data,
  path,
  depth,
  matchedPaths,
  leafPaths,
  expandedPaths,
  toggleExpand,
  hasQuery,
}: {
  data: unknown;
  path: string;
  depth: number;
  matchedPaths: Set<string>;
  leafPaths: Set<string>;
  expandedPaths: Set<string>;
  toggleExpand: (p: string) => void;
  hasQuery: boolean;
}) {
  const isMatched = matchedPaths.has(path);
  const isLeafMatch = leafPaths.has(path);
  const dimmed = hasQuery && !isMatched;
  const highlight = hasQuery && isLeafMatch;

  const baseStyle = dimmed ? { opacity: 0.4 } : {};

  if (data === null) {
    return (
      <span style={baseStyle} className={highlight ? "bg-amber-500/15 rounded px-1" : ""} data-path={path}>
        <span className="json-key">null</span>
      </span>
    );
  }

  if (typeof data === "boolean") {
    return (
      <span style={baseStyle} className={highlight ? "bg-amber-500/15 rounded px-1" : ""} data-path={path}>
        <span className="json-number">{data ? "true" : "false"}</span>
      </span>
    );
  }

  if (typeof data === "number") {
    return (
      <span style={baseStyle} className={highlight ? "bg-amber-500/15 rounded px-1" : ""} data-path={path}>
        <span className="json-number">{data}</span>
      </span>
    );
  }

  if (typeof data === "string") {
    return (
      <span style={baseStyle} className={highlight ? "bg-amber-500/15 rounded px-1" : ""} data-path={path}>
        <span className="json-string">&quot;{data}&quot;</span>
      </span>
    );
  }

  if (Array.isArray(data)) {
    const isExpanded = expandedPaths.has(path);
    return (
      <span style={baseStyle} data-path={path}>
        <button
          type="button"
          onClick={() => toggleExpand(path)}
          className="inline-flex items-center hover:text-amber-400 transition-colors"
        >
          <span className="text-muted-foreground text-xs mr-1 w-3 inline-block">
            {isExpanded ? "\u25BE" : "\u25B8"}
          </span>
          <span className="json-bracket">[</span>
          {!isExpanded && (
            <span className="text-muted-foreground text-xs mx-1">{data.length} items</span>
          )}
          {!isExpanded && <span className="json-bracket">]</span>}
        </button>
        {isExpanded && (
          <>
            {data.map((item, idx) => (
              <div key={idx} className="pl-4" style={{ paddingLeft: `${(depth + 1) * 16}px` }}>
                <span className="json-bracket text-xs mr-1">[{idx}]</span>
                <JsonTreeNode
                  data={item}
                  path={`${path}[${idx}]`}
                  depth={depth + 1}
                  matchedPaths={matchedPaths}
                  leafPaths={leafPaths}
                  expandedPaths={expandedPaths}
                  toggleExpand={toggleExpand}
                  hasQuery={hasQuery}
                />
                {idx < data.length - 1 && <span className="json-bracket">,</span>}
              </div>
            ))}
            <div style={{ paddingLeft: `${depth * 16}px` }}>
              <span className="json-bracket">]</span>
            </div>
          </>
        )}
      </span>
    );
  }

  if (typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>);
    const isExpanded = expandedPaths.has(path);
    return (
      <span style={baseStyle} data-path={path} className={highlight ? "bg-amber-500/15 rounded px-1 inline-block" : ""}>
        <button
          type="button"
          onClick={() => toggleExpand(path)}
          className="inline-flex items-center hover:text-amber-400 transition-colors"
        >
          <span className="text-muted-foreground text-xs mr-1 w-3 inline-block">
            {isExpanded ? "\u25BE" : "\u25B8"}
          </span>
          <span className="json-bracket">{"{"}</span>
          {!isExpanded && (
            <span className="text-muted-foreground text-xs mx-1">{entries.length} keys</span>
          )}
          {!isExpanded && <span className="json-bracket">{"}"}</span>}
        </button>
        {isExpanded && (
          <>
            {entries.map(([key, val], idx) => {
              const childPath = `${path}.${key}`;
              const childIsLeafMatch = leafPaths.has(childPath);
              const childIsMatched = matchedPaths.has(childPath);
              const childDimmed = hasQuery && !childIsMatched;
              return (
                <div
                  key={key}
                  style={{ paddingLeft: `${(depth + 1) * 16}px`, ...(childDimmed ? { opacity: 0.4 } : {}) }}
                  className={childIsLeafMatch ? "bg-amber-500/15 rounded" : ""}
                  data-path={childPath}
                >
                  <span className="json-key">&quot;{key}&quot;</span>
                  <span className="json-bracket">: </span>
                  <JsonTreeNode
                    data={val}
                    path={childPath}
                    depth={depth + 1}
                    matchedPaths={matchedPaths}
                    leafPaths={leafPaths}
                    expandedPaths={expandedPaths}
                    toggleExpand={toggleExpand}
                    hasQuery={hasQuery}
                  />
                  {idx < entries.length - 1 && <span className="json-bracket">,</span>}
                </div>
              );
            })}
            <div style={{ paddingLeft: `${depth * 16}px` }}>
              <span className="json-bracket">{"}"}</span>
            </div>
          </>
        )}
      </span>
    );
  }

  return null;
}

// ---------- Collect all expandable paths ----------

function collectExpandablePaths(data: unknown, path: string): string[] {
  const paths: string[] = [];
  if (data !== null && typeof data === "object") {
    paths.push(path);
    if (Array.isArray(data)) {
      data.forEach((item, idx) => {
        paths.push(...collectExpandablePaths(item, `${path}[${idx}]`));
      });
    } else {
      for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
        paths.push(...collectExpandablePaths(val, `${path}.${key}`));
      }
    }
  }
  return paths;
}

// ---------- Format a value for display ----------

function formatValue(val: unknown): string {
  if (val === null) return "null";
  if (typeof val === "string") return `"${val}"`;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val) || typeof val === "object") {
    return JSON.stringify(val, null, 2);
  }
  return String(val);
}

// ---------- Widget ----------

export function JsonPathWidget() {
  const [query, setQuery] = useState("");
  const [matchedPaths, setMatchedPaths] = useState<Set<string>>(new Set());
  const [leafPaths, setLeafPaths] = useState<Set<string>>(new Set());
  const [resultValues, setResultValues] = useState<{ path: string; value: unknown }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => {
    return new Set(collectExpandablePaths(sampleDoc, "$"));
  });

  const allExpandable = useMemo(() => collectExpandablePaths(sampleDoc, "$"), []);

  const toggleExpand = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Debounced evaluation
  useEffect(() => {
    if (query.trim() === "") {
      setMatchedPaths(new Set());
      setLeafPaths(new Set());
      setResultValues([]);
      setError(null);
      return;
    }

    const timer = setTimeout(() => {
      const segments = parsePathExpression(query);
      if (!segments) {
        setError("Invalid path expression");
        setMatchedPaths(new Set());
        setLeafPaths(new Set());
        setResultValues([]);
        return;
      }

      const result = evaluatePath(segments, sampleDoc);
      if (result.values.length === 0) {
        setError("No matches found");
        setMatchedPaths(new Set());
        setLeafPaths(new Set());
        setResultValues([]);
        return;
      }

      setError(null);
      setMatchedPaths(result.matchedPaths);
      // Leaf paths are only the direct match targets (not ancestors)
      const leaves = new Set(result.values.map((v) => v.path));
      setLeafPaths(leaves);
      setResultValues(result.values);

      // Auto-expand paths to matched nodes
      setExpandedPaths((prev) => {
        const next = new Set(prev);
        for (const p of result.matchedPaths) {
          if (allExpandable.includes(p)) {
            next.add(p);
          }
        }
        return next;
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [query, allExpandable]);

  const hasQuery = query.trim().length > 0;

  return (
    <div className="widget-container bg-card border border-border rounded-xl p-6 my-8 overflow-hidden">
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-mono">
        Interactive &middot; SQL/JSON Path Playground
      </div>

      {/* Example buttons */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs text-muted-foreground font-mono mr-1">Examples:</span>
        {examples.map((ex) => (
          <button
            key={ex.label}
            onClick={() => setQuery(ex.path)}
            className={`btn-mono ${query === ex.path ? "active" : ""}`}
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border rounded-lg overflow-hidden">
        {/* Left: JSON tree */}
        <div className="bg-card p-4 min-h-[320px] overflow-auto">
          <div className="flex items-center gap-2 mb-3 text-sm">
            <span className="text-amber-400 font-mono text-xs">{"{ }"}</span>
            <span className="text-amber-400 font-mono text-xs uppercase tracking-wider">JSON Document</span>
          </div>
          <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
            <JsonTreeNode
              data={sampleDoc}
              path="$"
              depth={0}
              matchedPaths={matchedPaths}
              leafPaths={leafPaths}
              expandedPaths={expandedPaths}
              toggleExpand={toggleExpand}
              hasQuery={hasQuery}
            />
          </pre>
        </div>

        {/* Right: Query and results */}
        <div className="bg-card p-4 min-h-[320px] flex flex-col">
          <div className="flex items-center gap-2 mb-3 text-sm">
            <span className="text-amber-400 font-mono text-xs">$</span>
            <span className="text-amber-400 font-mono text-xs uppercase tracking-wider">Path Expression</span>
          </div>

          {/* Query input */}
          <div className="relative mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="$.store.books[*].title"
              className="w-full bg-transparent border border-border rounded-lg px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-amber-400/50 transition-colors placeholder:text-muted-foreground/50"
              spellCheck={false}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="text-red-400 font-mono text-xs mb-3 flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}

          {/* Results */}
          {resultValues.length > 0 && (
            <div className="flex-1 overflow-auto">
              <div className="text-xs text-muted-foreground font-mono mb-2 uppercase tracking-wider">
                {resultValues.length} Match{resultValues.length !== 1 ? "es" : ""}
              </div>
              <div className="space-y-2">
                {resultValues.map((rv, idx) => (
                  <div
                    key={idx}
                    className="border border-border rounded-lg p-3 bg-amber-500/5"
                  >
                    <div className="text-xs text-amber-400 font-mono mb-1">{rv.path}</div>
                    <div className="font-mono text-sm text-foreground">
                      {typeof rv.value === "object" && rv.value !== null ? (
                        <pre className="text-xs leading-relaxed whitespace-pre-wrap">
                          {formatValue(rv.value)}
                        </pre>
                      ) : (
                        <span>
                          {typeof rv.value === "string" && (
                            <span className="json-string">&quot;{rv.value}&quot;</span>
                          )}
                          {typeof rv.value === "number" && (
                            <span className="json-number">{rv.value}</span>
                          )}
                          {typeof rv.value === "boolean" && (
                            <span className="json-number">{String(rv.value)}</span>
                          )}
                          {rv.value === null && (
                            <span className="text-muted-foreground">null</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!error && resultValues.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground font-mono text-xs">
                <div className="text-2xl mb-2 opacity-30">$</div>
                <div>Type a JSON path expression above</div>
                <div className="mt-1 opacity-60">or click an example to get started</div>
              </div>
            </div>
          )}

          {/* Supported syntax */}
          <div className="mt-4 pt-3 border-t border-border">
            <div className="text-xs text-muted-foreground font-mono space-y-1">
              <div><span className="text-amber-400">$</span> root &nbsp; <span className="text-amber-400">.key</span> property &nbsp; <span className="text-amber-400">[n]</span> index</div>
              <div><span className="text-amber-400">[*]</span> all items &nbsp; <span className="text-amber-400">..key</span> recursive search</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
