"use client";

import { useState, useEffect } from "react";

const departments = {
  1: { id: 1, name: "Engineering", head: "Dave", budget: 500000 },
  2: { id: 2, name: "Marketing", head: "Eve", budget: 300000 },
  3: { id: 3, name: "Sales", head: "Frank", budget: 450000 },
};

export function CascadeWidget() {
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
        <label className="font-mono text-sm text-muted-foreground whitespace-nowrap">Alice&apos;s dept_id:</label>
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

        <div className="bg-card p-4">
          <div className="flex items-center gap-2 mb-3 text-sm">
            <span className="text-cyan-400">{"{}"}</span>
            <span className="text-cyan-400 font-mono text-xs uppercase tracking-wider">employee_dv</span>
          </div>
          <pre className="font-mono text-sm leading-relaxed">
            <span className="json-bracket">{"{"}</span>
            {"\n  "}
            <span className="json-key">&quot;_id&quot;</span>: <span className="json-number">101</span>,
            {"\n  "}
            <span className="json-key">&quot;name&quot;</span>: <span className="json-string">&quot;Alice&quot;</span>,
            {"\n  "}
            <span className="json-key">&quot;department&quot;</span>: <span className="json-bracket">{"{"}</span>
            {"\n    "}
            <span className="json-key">&quot;id&quot;</span>: <span className="json-number json-highlight">{dept.id}</span>,
            {"\n    "}
            <span className="json-key">&quot;name&quot;</span>: <span className="json-string" style={{ background: "rgba(74,222,128,0.12)", padding: "0 .2em", borderRadius: "2px" }}>&quot;{dept.name}&quot;</span>,
            {"\n    "}
            <span className="json-key">&quot;head&quot;</span>: <span className="json-string">&quot;{dept.head}&quot;</span>,
            {"\n    "}
            <span className="json-key">&quot;budget&quot;</span>: <span className="json-number">{dept.budget.toLocaleString()}</span>
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
