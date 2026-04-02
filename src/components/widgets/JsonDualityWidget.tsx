"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const roles: Record<number, string> = { 1: "Engineer", 2: "Designer", 3: "Manager" };
const departments: Record<number, { name: string; floor: number }> = {
  1: { name: "Platform", floor: 3 },
  2: { name: "Product", floor: 5 },
  3: { name: "Operations", floor: 2 },
};

interface Person {
  id: number;
  name: string;
  roleId: number;
  deptId: number;
}

const initialData: Person[] = [
  { id: 1, name: "Alice", roleId: 1, deptId: 1 },
  { id: 2, name: "Bob", roleId: 2, deptId: 2 },
  { id: 3, name: "Carol", roleId: 3, deptId: 3 },
];

type ActiveView = "employee" | "department";

export function JsonDualityWidget() {
  const [data, setData] = useState(initialData);
  const [editingField, setEditingField] = useState<{ idx: number; field: "name" } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);
  const [highlightedJsonField, setHighlightedJsonField] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>("employee");
  const [showBothViews, setShowBothViews] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingField && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingField]);

  const flashRow = useCallback((idx: number, jsonField?: string) => {
    setHighlightedRow(idx);
    if (jsonField) setHighlightedJsonField(jsonField);
    setTimeout(() => { setHighlightedRow(null); setHighlightedJsonField(null); }, 800);
  }, []);

  const handleEditName = (index: number) => {
    setEditingField({ idx: index, field: "name" });
    setEditValue(data[index].name);
  };

  const handleSaveName = useCallback(() => {
    if (editingField) {
      const idx = editingField.idx;
      setData((prev) => {
        const newData = [...prev];
        newData[idx] = { ...newData[idx], name: editValue };
        return newData;
      });
      flashRow(idx, "name");
    }
    setEditingField(null);
    setEditValue("");
  }, [editingField, editValue, flashRow]);

  const handleBlur = useCallback(() => {
    setTimeout(() => handleSaveName(), 150);
  }, [handleSaveName]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSaveName();
    if (e.key === "Escape") { setEditingField(null); setEditValue(""); }
  };

  const handleRoleChange = (idx: number, roleId: number) => {
    setData((prev) => {
      const newData = [...prev];
      newData[idx] = { ...newData[idx], roleId };
      return newData;
    });
    flashRow(idx, "role");
  };

  const handleDeptChangeFromJson = (idx: number, deptId: number) => {
    setData((prev) => {
      const newData = [...prev];
      newData[idx] = { ...newData[idx], deptId };
      return newData;
    });
    flashRow(idx, "dept");
  };

  const resetData = () => { setData(initialData); setEditingField(null); };

  // Build department-centric view: group employees by department
  const deptGroups = Object.entries(departments).map(([idStr, dept]) => {
    const deptId = Number(idStr);
    const members = data.filter((p) => p.deptId === deptId);
    return { deptId, ...dept, members };
  }).filter((g) => g.members.length > 0);

  // Employee-centric JSON view
  const renderEmployeeView = (compact?: boolean) => (
    <div className={`bg-card ${compact ? "p-3" : "p-4"} min-h-[280px]`}>
      <div className="flex items-center gap-2 mb-3 text-sm">
        <span className="text-cyan-400">{"{}"}</span>
        <span className="text-cyan-400 font-mono text-xs uppercase tracking-wider">employee_dv</span>
      </div>
      <pre className={`font-mono ${compact ? "text-[10px]" : "text-xs"} leading-relaxed`}>
        <span className="json-bracket">[</span>
        {data.map((row, idx) => {
          const dept = departments[row.deptId];
          const isHighlighted = highlightedRow === idx;
          return (
            <span key={row.id}>
              {"\n  "}
              <span className="json-bracket">{"{"}</span>
              {"\n    "}
              <span className="json-key">&quot;id&quot;</span>: <span className="json-number">{row.id}</span>,
              {"\n    "}
              <span className="json-key">&quot;name&quot;</span>:{" "}
              {!compact && editingField?.idx === idx && editingField.field === "name" ? (
                <input
                  ref={editInputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  className="bg-transparent border-b border-cyan-400 outline-none w-16 json-string font-mono text-xs"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => !compact && handleEditName(idx)}
                  className={`json-string ${compact ? "" : "cursor-pointer hover:json-highlight"} px-0.5 ${isHighlighted && highlightedJsonField === "name" ? "json-highlight" : ""}`}
                >
                  {`"${row.name}"`}
                </button>
              )}
              ,{"\n    "}
              <span className="json-key">&quot;role&quot;</span>:{" "}
              <span className={`json-string ${isHighlighted && highlightedJsonField === "role" ? "json-highlight" : ""}`}>
                &quot;{roles[row.roleId]}&quot;
              </span>
              ,{"\n    "}
              <span className="json-key">&quot;department&quot;</span>: <span className="json-bracket">{"{"}</span>
              {"\n      "}
              <span className="json-key">&quot;id&quot;</span>: <span className={`json-number ${isHighlighted && highlightedJsonField === "dept" ? "json-highlight" : ""}`}>{row.deptId}</span>,
              {"\n      "}
              <span className="json-key">&quot;name&quot;</span>:{" "}
              <button
                type="button"
                onClick={() => !compact && handleDeptChangeFromJson(idx, (row.deptId % 3) + 1)}
                className={`json-string ${compact ? "" : "cursor-pointer hover:json-highlight"} px-0.5 ${isHighlighted && highlightedJsonField === "dept" ? "json-highlight" : ""}`}
                title={compact ? undefined : "Click to cycle department"}
              >
                &quot;{dept.name}&quot;
              </button>
              ,{"\n      "}
              <span className="json-key">&quot;floor&quot;</span>: <span className={`json-number ${isHighlighted && highlightedJsonField === "dept" ? "json-highlight" : ""}`}>{dept.floor}</span>
              {"\n    "}
              <span className="json-bracket">{"}"}</span>
              {"\n  "}
              <span className="json-bracket">{"}"}</span>
              {idx < data.length - 1 && <span className="json-bracket">,</span>}
            </span>
          );
        })}
        {"\n"}
        <span className="json-bracket">]</span>
      </pre>
      {!compact && (
        <div className="mt-3 pt-2 border-t border-border text-xs text-muted-foreground font-mono">
          Click <span className="json-string">&quot;department.name&quot;</span> in JSON to change it — watch the <span className="text-orange-500">DEPT</span> column update.
        </div>
      )}
    </div>
  );

  // Department-centric JSON view
  const renderDepartmentView = (compact?: boolean) => (
    <div className={`bg-card ${compact ? "p-3" : "p-4"} min-h-[280px]`}>
      <div className="flex items-center gap-2 mb-3 text-sm">
        <span className="text-emerald-400">{"{}"}</span>
        <span className="text-emerald-400 font-mono text-xs uppercase tracking-wider">department_dv</span>
      </div>
      <pre className={`font-mono ${compact ? "text-[10px]" : "text-xs"} leading-relaxed`}>
        <span className="json-bracket">[</span>
        {deptGroups.map((dept, dIdx) => {
          const anyHighlighted = dept.members.some((_, mIdx) => {
            const globalIdx = data.findIndex((d) => d.id === dept.members[mIdx].id);
            return highlightedRow === globalIdx;
          });
          return (
            <span key={dept.deptId}>
              {"\n  "}
              <span className="json-bracket">{"{"}</span>
              {"\n    "}
              <span className="json-key">&quot;dept_id&quot;</span>: <span className="json-number">{dept.deptId}</span>,
              {"\n    "}
              <span className="json-key">&quot;name&quot;</span>: <span className={`json-string ${anyHighlighted && highlightedJsonField === "dept" ? "json-highlight" : ""}`}>&quot;{dept.name}&quot;</span>,
              {"\n    "}
              <span className="json-key">&quot;floor&quot;</span>: <span className="json-number">{dept.floor}</span>,
              {"\n    "}
              <span className="json-key">&quot;employees&quot;</span>: <span className="json-bracket">[</span>
              {dept.members.map((member, mIdx) => {
                const globalIdx = data.findIndex((d) => d.id === member.id);
                const isHighlighted = highlightedRow === globalIdx;
                return (
                  <span key={member.id}>
                    {"\n      "}
                    <span className="json-bracket">{"{"}</span>
                    {" "}
                    <span className="json-key">&quot;id&quot;</span>: <span className="json-number">{member.id}</span>,{" "}
                    <span className="json-key">&quot;name&quot;</span>:{" "}
                    <span className={`json-string ${isHighlighted && highlightedJsonField === "name" ? "json-highlight" : ""}`}>&quot;{member.name}&quot;</span>,{" "}
                    <span className="json-key">&quot;role&quot;</span>:{" "}
                    <span className={`json-string ${isHighlighted && highlightedJsonField === "role" ? "json-highlight" : ""}`}>&quot;{roles[member.roleId]}&quot;</span>
                    {" "}
                    <span className="json-bracket">{"}"}</span>
                    {mIdx < dept.members.length - 1 && <span className="json-bracket">,</span>}
                  </span>
                );
              })}
              {"\n    "}
              <span className="json-bracket">]</span>
              {"\n  "}
              <span className="json-bracket">{"}"}</span>
              {dIdx < deptGroups.length - 1 && <span className="json-bracket">,</span>}
            </span>
          );
        })}
        {"\n"}
        <span className="json-bracket">]</span>
      </pre>
      {!compact && (
        <div className="mt-3 pt-2 border-t border-border text-xs text-muted-foreground font-mono">
          Same data, different shape: employees nested <span className="text-emerald-400">under departments</span>.
        </div>
      )}
    </div>
  );

  return (
    <div className="widget-container bg-card border border-border rounded-xl p-6 my-8 overflow-hidden">
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-mono">Interactive · JSON Duality Views</div>

      {/* View toggle */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={() => { setActiveView("employee"); setShowBothViews(false); }}
          className={`btn-mono ${!showBothViews && activeView === "employee" ? "active" : ""}`}
        >
          Employee View
        </button>
        <button
          onClick={() => { setActiveView("department"); setShowBothViews(false); }}
          className={`btn-mono ${!showBothViews && activeView === "department" ? "active" : ""}`}
        >
          Department View
        </button>
        <button
          onClick={() => setShowBothViews((v) => !v)}
          className={`btn-mono ${showBothViews ? "active" : ""}`}
        >
          Both Views
        </button>
        <div className="flex-1" />
        <button onClick={resetData} className="btn-mono">Reset Data</button>
      </div>

      {showBothViews ? (
        /* ===== Three-panel layout: table + 2 JDVs ===== */
        <>
          {/* Relational table on top */}
          <div className="bg-card border border-border rounded-lg p-4 mb-2">
            <div className="flex items-center gap-2 mb-3 text-sm">
              <span className="text-orange-500">⊕</span>
              <span className="text-orange-500 font-mono text-xs uppercase tracking-wider">employees table</span>
              <span className="text-muted-foreground font-mono text-[10px] ml-2">(single source of truth)</span>
            </div>
            <div className="grid grid-cols-[40px_1fr_100px_60px] gap-2 text-xs font-mono mb-1 pb-2 border-b border-border">
              <span className="text-muted-foreground">ID</span>
              <span className="text-muted-foreground">NAME</span>
              <span className="text-muted-foreground">ROLE_ID</span>
              <span className="text-muted-foreground">DEPT</span>
            </div>
            {data.map((row, idx) => (
              <div
                key={row.id}
                className={`grid grid-cols-[40px_1fr_100px_60px] gap-2 py-2 px-2 rounded text-sm font-mono transition-colors items-center ${
                  highlightedRow === idx ? "pulse-highlight" : "hover:bg-white/5"
                }`}
              >
                <span className="text-muted-foreground">{row.id}</span>
                {editingField?.idx === idx && editingField.field === "name" ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="bg-transparent border-b border-cyan-400 outline-none w-full text-yellow-400 text-sm font-mono"
                  />
                ) : (
                  <button type="button" onClick={() => handleEditName(idx)} className="text-left text-yellow-400 hover:text-cyan-400 cursor-pointer">
                    {row.name}
                  </button>
                )}
                <div className="flex items-center gap-1">
                  <input type="range" min="1" max="3" value={row.roleId} onChange={(e) => handleRoleChange(idx, Number(e.target.value))} className="w-12" style={{ height: 4 }} />
                  <span className="text-cyan-400 text-xs w-3 text-center">{row.roleId}</span>
                </div>
                <span className="text-muted-foreground text-xs">{row.deptId}</span>
              </div>
            ))}
            <div className="mt-3 pt-2 border-t border-border text-xs text-muted-foreground font-mono">
              Edit the table — watch <span className="text-cyan-400">both</span> JSON views update simultaneously.
            </div>
          </div>

          {/* Two JDVs side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border rounded-lg overflow-hidden">
            {renderEmployeeView(true)}
            {renderDepartmentView(true)}
          </div>

          {/* Arrow indicators */}
          <div className="flex justify-center gap-8 mt-3">
            <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <span className="text-orange-500">TABLE</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-cyan-400">employee_dv</span>
              <span className="text-muted-foreground">+</span>
              <span className="text-emerald-400">department_dv</span>
            </div>
          </div>
        </>
      ) : (
        /* ===== Original two-panel layout: table + one JDV ===== */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border rounded-lg overflow-hidden">
          {/* Relational Table */}
          <div className="bg-card p-4 min-h-[280px]">
            <div className="flex items-center gap-2 mb-3 text-sm">
              <span className="text-orange-500">⊕</span>
              <span className="text-orange-500 font-mono text-xs uppercase tracking-wider">employees table</span>
            </div>
            <div className="grid grid-cols-[40px_1fr_100px_60px] gap-2 text-xs font-mono mb-1 pb-2 border-b border-border">
              <span className="text-muted-foreground">ID</span>
              <span className="text-muted-foreground">NAME</span>
              <span className="text-muted-foreground">ROLE_ID</span>
              <span className="text-muted-foreground">DEPT</span>
            </div>
            {data.map((row, idx) => (
              <div
                key={row.id}
                className={`grid grid-cols-[40px_1fr_100px_60px] gap-2 py-2 px-2 rounded text-sm font-mono transition-colors items-center ${
                  highlightedRow === idx ? "pulse-highlight" : "hover:bg-white/5"
                }`}
              >
                <span className="text-muted-foreground">{row.id}</span>
                {editingField?.idx === idx && editingField.field === "name" ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="bg-transparent border-b border-cyan-400 outline-none w-full text-yellow-400 text-sm font-mono"
                  />
                ) : (
                  <button type="button" onClick={() => handleEditName(idx)} className="text-left text-yellow-400 hover:text-cyan-400 cursor-pointer">
                    {row.name}
                  </button>
                )}
                <div className="flex items-center gap-1">
                  <input type="range" min="1" max="3" value={row.roleId} onChange={(e) => handleRoleChange(idx, Number(e.target.value))} className="w-12" style={{ height: 4 }} />
                  <span className="text-cyan-400 text-xs w-3 text-center">{row.roleId}</span>
                </div>
                <span className="text-muted-foreground text-xs">{row.deptId}</span>
              </div>
            ))}
            <div className="mt-3 pt-2 border-t border-border text-xs text-muted-foreground font-mono">
              Slide <span className="text-cyan-400">ROLE_ID</span> to change role. Click <span className="text-yellow-400">NAME</span> to edit.
            </div>
          </div>

          {/* Single JDV */}
          {activeView === "employee" ? renderEmployeeView() : renderDepartmentView()}
        </div>
      )}
    </div>
  );
}
