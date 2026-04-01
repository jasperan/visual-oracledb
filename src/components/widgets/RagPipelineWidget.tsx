"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const STAGE_LABELS = [
  "Question",
  "Embedding",
  "Vector Search",
  "Retrieval",
  "Prompt Assembly",
  "LLM Response",
];

const STAGE_ICONS = ["\u2753", "\u{1F9EE}", "\u{1F50D}", "\u{1F4C4}", "\u{1F9E9}", "\u{1F916}"];

const DOC_CHUNKS = [
  "Oracle AI Database supports JSON Duality Views that provide both relational and JSON access to the same data...",
  "Vector indexes in Oracle use HNSW or IVF algorithms for approximate nearest neighbor search at scale...",
  "Property graphs in Oracle enable traversal queries using SQL/PGQ standard syntax...",
];

const SAMPLE_RESPONSE =
  "Oracle AI Database provides JSON Duality Views which allow simultaneous relational and JSON access. Combined with vector similarity search and property graph traversal, it offers a converged data platform for AI applications.";

function hashCode(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function generateEmbedding(question: string): number[] {
  const h = hashCode(question);
  const embedding: number[] = [];
  for (let i = 0; i < 8; i++) {
    const seed = hashCode(question + String(i) + String(h));
    embedding.push(parseFloat(((seed % 10000) / 10000 - 0.5).toFixed(4)));
  }
  return embedding;
}

interface ScatterPoint {
  x: number;
  y: number;
  nearest: boolean;
}

function generateScatterPoints(question: string): ScatterPoint[] {
  const h = hashCode(question);
  const points: ScatterPoint[] = [];
  for (let i = 0; i < 8; i++) {
    const sx = hashCode(question + "x" + i + h) % 1000;
    const sy = hashCode(question + "y" + i + h) % 1000;
    points.push({
      x: 10 + (sx / 1000) * 80,
      y: 10 + (sy / 1000) * 80,
      nearest: i < 3,
    });
  }
  return points;
}

function ArrowConnector({ completed }: { completed: boolean }) {
  return (
    <svg
      width="32"
      height="24"
      viewBox="0 0 32 24"
      className="flex-shrink-0 mx-1"
      style={{ opacity: completed ? 1 : 0.3 }}
    >
      <line
        x1="0"
        y1="12"
        x2="24"
        y2="12"
        stroke={completed ? "#4ade80" : "#a1a1aa"}
        strokeWidth="2"
      />
      <polygon
        points="22,6 32,12 22,18"
        fill={completed ? "#4ade80" : "#a1a1aa"}
      />
    </svg>
  );
}

export function RagPipelineWidget() {
  const [question, setQuestion] = useState("");
  const [stage, setStage] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [frozenStage, setFrozenStage] = useState<number | null>(null);
  const [streamedText, setStreamedText] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      clearInterval(streamRef.current);
      streamRef.current = null;
    }
  }, []);

  const advanceStage = useCallback(
    (current: number) => {
      if (current >= 5) {
        setIsAnimating(false);
        return;
      }
      timerRef.current = setTimeout(() => {
        const next = current + 1;
        setStage(next);
        if (next < 5) {
          advanceStage(next);
        } else {
          // Stage 5: start streaming
          let idx = 0;
          setStreamedText("");
          streamRef.current = setInterval(() => {
            idx++;
            if (idx > SAMPLE_RESPONSE.length) {
              if (streamRef.current) clearInterval(streamRef.current);
              streamRef.current = null;
              setIsAnimating(false);
              return;
            }
            setStreamedText(SAMPLE_RESPONSE.slice(0, idx));
          }, 18);
        }
      }, 1500);
    },
    []
  );

  const runPipeline = useCallback(() => {
    if (!question.trim() || isAnimating) return;
    clearTimers();
    setFrozenStage(null);
    setStreamedText("");
    setIsAnimating(true);
    setStage(0);
    advanceStage(0);
  }, [question, isAnimating, clearTimers, advanceStage]);

  const resetPipeline = useCallback(() => {
    clearTimers();
    setStage(-1);
    setIsAnimating(false);
    setFrozenStage(null);
    setStreamedText("");
    setQuestion("");
  }, [clearTimers]);

  const handleStageClick = useCallback(
    (idx: number) => {
      if (idx <= stage) {
        setFrozenStage((prev) => (prev === idx ? null : idx));
      }
    },
    [stage]
  );

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const embedding = question.trim() ? generateEmbedding(question) : [];
  const scatterPoints = question.trim() ? generateScatterPoints(question) : [];

  const stageBoxStyle = (idx: number): React.CSSProperties => {
    const isActive = idx === stage && isAnimating;
    const isCompleted = idx < stage || (idx === stage && !isAnimating);
    const isFrozen = frozenStage === idx;

    return {
      width: 100,
      minHeight: 80,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "8px 4px",
      borderRadius: 8,
      border: isActive
        ? "2px solid #fb923c"
        : isCompleted
          ? "2px solid #4ade80"
          : "1px solid rgba(255,255,255,0.08)",
      background: isFrozen
        ? "rgba(251,146,60,0.1)"
        : isActive
          ? "rgba(251,146,60,0.06)"
          : "rgba(255,255,255,0.02)",
      boxShadow: isActive
        ? "0 0 16px rgba(251,146,60,0.3)"
        : "none",
      cursor: idx <= stage ? "pointer" : "default",
      opacity: idx <= stage || stage === -1 ? 1 : 0.4,
      transition: "all 0.3s ease",
      flexShrink: 0,
    };
  };

  const searchScores = scatterPoints.map((pt, i) => ({
    doc: `doc_${String(i + 1).padStart(3, "0")}`,
    score: pt.nearest ? (0.92 - i * 0.05).toFixed(4) : (0.3 + Math.random() * 0.2).toFixed(4),
    nearest: pt.nearest,
  })).sort((a, b) => parseFloat(b.score) - parseFloat(a.score));

  const renderVerboseLog = () => {
    if (stage < 0) return null;

    return (
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Stage 0: Question */}
        {stage >= 0 && (
          <div className="animate-fade-in" style={{ padding: 12, borderRadius: 8, border: "1px solid rgba(251,146,60,0.2)", background: "rgba(251,146,60,0.04)" }}>
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-2">
              <span style={{ color: "#4ade80" }}>&#10003;</span> Step 1 &middot; Input Question
            </div>
            <div className="font-mono text-sm" style={{ color: "#fb923c" }}>
              &gt; &quot;{question}&quot;
            </div>
          </div>
        )}

        {/* Stage 1: Embedding */}
        {stage >= 1 && (
          <div className="animate-fade-in" style={{ padding: 12, borderRadius: 8, border: "1px solid rgba(251,146,60,0.2)", background: "rgba(251,146,60,0.04)" }}>
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-2">
              <span style={{ color: "#4ade80" }}>&#10003;</span> Step 2 &middot; Generate Embedding Vector
            </div>
            <div className="font-mono text-xs mb-2" style={{ color: "#a1a1aa" }}>
              model: all-MiniLM-L6-v2 &middot; dimensions: 8 &middot; elapsed: 12ms
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
              {embedding.map((val, i) => (
                <div key={i} className="font-mono text-xs" style={{ padding: "4px 6px", borderRadius: 4, background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.15)", color: "#fb923c", textAlign: "center" }}>
                  [{i}] {val >= 0 ? "+" : ""}{val.toFixed(4)}
                </div>
              ))}
            </div>
            <div className="font-mono text-xs mt-2" style={{ color: "#a1a1aa" }}>
              vector = [{embedding.map(v => v.toFixed(3)).join(", ")}]
            </div>
          </div>
        )}

        {/* Stage 2: Vector Search */}
        {stage >= 2 && (
          <div className="animate-fade-in" style={{ padding: 12, borderRadius: 8, border: "1px solid rgba(167,139,250,0.2)", background: "rgba(167,139,250,0.04)" }}>
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-2">
              <span style={{ color: "#4ade80" }}>&#10003;</span> Step 3 &middot; HNSW Vector Index Search
            </div>
            <div className="font-mono text-xs mb-2" style={{ color: "#a1a1aa" }}>
              index: VECIDX_DOCS_HNSW &middot; metric: cosine &middot; k=3 &middot; ef_search=40 &middot; elapsed: 3ms
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <svg width="140" height="100" viewBox="0 0 100 100" style={{ background: "rgba(0,0,0,0.3)", borderRadius: 6, flexShrink: 0 }}>
                {scatterPoints.map((pt, i) => pt.nearest ? (
                  <line key={`l-${i}`} x1="50" y1="50" x2={pt.x} y2={pt.y} stroke="#a78bfa" strokeWidth="0.8" strokeDasharray="2,2" opacity="0.5" />
                ) : null)}
                <circle cx="50" cy="50" r="3" fill="#f472b6" />
                {scatterPoints.map((pt, i) => (
                  <circle key={`p-${i}`} cx={pt.x} cy={pt.y} r={pt.nearest ? 3.5 : 2} fill={pt.nearest ? "#facc15" : "#a1a1aa"} opacity={pt.nearest ? 1 : 0.4} />
                ))}
                <text x="50" y="46" textAnchor="middle" fill="#f472b6" fontSize="4" fontFamily="JetBrains Mono">query</text>
              </svg>
              <div className="font-mono text-xs" style={{ flex: 1 }}>
                <div style={{ color: "#a1a1aa", marginBottom: 4 }}>Similarity scores (top 8):</div>
                {searchScores.slice(0, 8).map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: s.nearest ? "#facc15" : "#a1a1aa" }}>
                    <span>{s.nearest ? ">" : " "} {s.doc}</span>
                    <span style={{ color: s.nearest ? "#facc15" : "#71717a" }}>{s.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stage 3: Retrieval */}
        {stage >= 3 && (
          <div className="animate-fade-in" style={{ padding: 12, borderRadius: 8, border: "1px solid rgba(34,211,238,0.2)", background: "rgba(34,211,238,0.04)" }}>
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-2">
              <span style={{ color: "#4ade80" }}>&#10003;</span> Step 4 &middot; Retrieve Document Chunks
            </div>
            <div className="font-mono text-xs mb-2" style={{ color: "#a1a1aa" }}>
              source: DOCS_CHUNKS table &middot; retrieved: 3 chunks &middot; max_tokens: 512 each
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {DOC_CHUNKS.map((chunk, i) => (
                <div key={i} className="animate-slide-in font-mono text-xs" style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid rgba(34,211,238,0.15)", background: "rgba(34,211,238,0.04)", color: "#e4e4e7", animationDelay: `${i * 0.15}s` }}>
                  <span style={{ color: "#22d3ee", marginRight: 4 }}>chunk[{i}]</span>
                  <span style={{ color: "#facc15", marginRight: 4 }}>score={searchScores[i]?.score}</span>
                  <br />
                  <span style={{ color: "#a1a1aa" }}>{chunk}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stage 4: Prompt Assembly */}
        {stage >= 4 && (
          <div className="animate-fade-in" style={{ padding: 12, borderRadius: 8, border: "1px solid rgba(74,222,128,0.2)", background: "rgba(74,222,128,0.04)" }}>
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-2">
              <span style={{ color: "#4ade80" }}>&#10003;</span> Step 5 &middot; Assemble Prompt
            </div>
            <div className="font-mono text-xs mb-2" style={{ color: "#a1a1aa" }}>
              template: rag_v2 &middot; total_tokens: ~620 &middot; context_window: 4096
            </div>
            <pre className="font-mono text-xs" style={{ padding: 10, borderRadius: 6, background: "rgba(0,0,0,0.3)", color: "#e4e4e7", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
              <span style={{ color: "#4ade80" }}>system:</span> You are a helpful Oracle Database assistant.{"\n\n"}
              <span style={{ color: "#4ade80" }}>context:</span>{"\n"}
              {DOC_CHUNKS.map((c, i) => <span key={i}><span style={{ color: "#fb923c" }}>[{i + 1}]</span> <span style={{ color: "#a1a1aa" }}>{c}</span>{"\n"}</span>)}
              {"\n"}
              <span style={{ color: "#22d3ee" }}>question:</span> <span style={{ color: "#fb923c" }}>{question}</span>{"\n\n"}
              <span style={{ color: "#4ade80" }}>answer:</span>
            </pre>
          </div>
        )}

        {/* Stage 5: LLM Response */}
        {stage >= 5 && (
          <div className="animate-fade-in" style={{ padding: 12, borderRadius: 8, border: "1px solid rgba(244,114,182,0.2)", background: "rgba(244,114,182,0.04)" }}>
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-2">
              {isAnimating ? <span style={{ color: "#fb923c" }}>&#9679;</span> : <span style={{ color: "#4ade80" }}>&#10003;</span>} Step 6 &middot; LLM Response
            </div>
            <div className="font-mono text-xs mb-2" style={{ color: "#a1a1aa" }}>
              model: oracle-genai-v1 &middot; temperature: 0.1 &middot; tokens: {streamedText.length || SAMPLE_RESPONSE.length}
            </div>
            <div className="font-mono text-sm" style={{ color: "#e4e4e7", lineHeight: 1.6, padding: "8px 10px", borderRadius: 6, background: "rgba(0,0,0,0.2)" }}>
              {streamedText || SAMPLE_RESPONSE}
              {isAnimating && stage === 5 && (
                <span style={{ display: "inline-block", width: 8, height: 14, background: "#fb923c", marginLeft: 2, animation: "pulse-highlight 0.8s ease-out infinite" }} />
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="widget-container bg-card border border-border rounded-xl p-6 my-8 overflow-hidden">
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-mono">
        Interactive &middot; RAG Pipeline
      </div>

      {/* Question input */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") runPipeline();
          }}
          placeholder="Ask about Oracle AI Database..."
          disabled={isAnimating}
          className="font-mono text-sm"
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)",
            color: "#e4e4e7",
            outline: "none",
          }}
        />
      </div>

      {/* Pipeline stages */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          overflowX: "auto",
          paddingBottom: 8,
          gap: 0,
        }}
      >
        {STAGE_LABELS.map((label, idx) => (
          <div
            key={label}
            style={{ display: "flex", alignItems: "center" }}
          >
            <div
              style={stageBoxStyle(idx)}
              onClick={() => handleStageClick(idx)}
              role="button"
              tabIndex={idx <= stage ? 0 : -1}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleStageClick(idx);
              }}
            >
              <span style={{ fontSize: 20, marginBottom: 4 }}>
                {STAGE_ICONS[idx]}
              </span>
              <span
                className="font-mono"
                style={{
                  fontSize: 10,
                  color:
                    idx === stage && isAnimating
                      ? "#fb923c"
                      : idx <= stage
                        ? "#e4e4e7"
                        : "#a1a1aa",
                  textAlign: "center",
                  lineHeight: 1.2,
                }}
              >
                {label}
              </span>
            </div>
            {idx < STAGE_LABELS.length - 1 && (
              <ArrowConnector completed={idx < stage} />
            )}
          </div>
        ))}
      </div>

      {/* Verbose output log */}
      {renderVerboseLog()}

      {/* Buttons */}
      <div className="flex gap-2 mt-5">
        <button
          className={`btn-mono ${!isAnimating && question.trim() ? "active" : ""}`}
          onClick={runPipeline}
          disabled={isAnimating || !question.trim()}
          style={{
            opacity: isAnimating || !question.trim() ? 0.5 : 1,
          }}
        >
          Run Pipeline
        </button>
        <button className="btn-mono" onClick={resetPipeline}>
          Reset
        </button>
      </div>
    </div>
  );
}
