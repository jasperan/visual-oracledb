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

export function JsonDualityWidget() {
  const [data, setData] = useState(initialData);
  const [editingField, setEditingField] = useState<{ idx: number; field: "name" } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);
  const [highlightedJsonField, setHighlightedJsonField] = useState<string | null>(null);
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

  // Role change — from relational slider, cascades to JSON
  const handleRoleChange = (idx: number, roleId: number) => {
    setData((prev) => {
      const newData = [...prev];
      newData[idx] = { ...newData[idx], roleId };
      return newData;
    });
    flashRow(idx, "role");
  };

  // Dept change — from JSON side buttons, cascades back to relational
  const handleDeptChangeFromJson = (idx: number, deptId: number) => {
    setData((prev) => {
      const newData = [...prev];
      newData[idx] = { ...newData[idx], deptId };
      return newData;
    });
    flashRow(idx, "dept");
  };

  const resetData = () => { setData(initialData); setEditingField(null); };

  return (
    <div className="widget-container bg-card border border-border rounded-xl p-6 my-8 overflow-hidden">
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-mono">Interactive · JSON Duality View</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border rounded-lg overflow-hidden">
        {/* ===== Relational Table ===== */}
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
                <button
                  type="button"
                  onClick={() => handleEditName(idx)}
                  className="text-left text-yellow-400 hover:text-cyan-400 cursor-pointer"
                >
                  {row.name}
                </button>
              )}
              {/* Role slider */}
              <div className="flex items-center gap-1">
                <input
                  type="range"
                  min="1"
                  max="3"
                  value={row.roleId}
                  onChange={(e) => handleRoleChange(idx, Number(e.target.value))}
                  className="w-12"
                  style={{ height: 4 }}
                />
                <span className="text-cyan-400 text-xs w-3 text-center">{row.roleId}</span>
              </div>
              <span className="text-muted-foreground text-xs">{row.deptId}</span>
            </div>
          ))}
          <div className="mt-3 pt-2 border-t border-border text-xs text-muted-foreground font-mono">
            Slide <span className="text-cyan-400">ROLE_ID</span> to change role. Click <span className="text-yellow-400">NAME</span> to edit.
          </div>
        </div>

        {/* ===== JSON Document ===== */}
        <div className="bg-card p-4 min-h-[280px]">
          <div className="flex items-center gap-2 mb-3 text-sm">
            <span className="text-cyan-400">{"{}"}</span>
            <span className="text-cyan-400 font-mono text-xs uppercase tracking-wider">employee_dv</span>
          </div>
          <pre className="font-mono text-xs leading-relaxed">
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
                  {editingField?.idx === idx && editingField.field === "name" ? (
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
                      onClick={() => handleEditName(idx)}
                      className={`json-string cursor-pointer hover:json-highlight px-0.5 ${isHighlighted && highlightedJsonField === "name" ? "json-highlight" : ""}`}
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
                    onClick={() => handleDeptChangeFromJson(idx, (row.deptId % 3) + 1)}
                    className={`json-string cursor-pointer hover:json-highlight px-0.5 ${isHighlighted && highlightedJsonField === "dept" ? "json-highlight" : ""}`}
                    title="Click to cycle department (cascades to relational table)"
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
          <div className="mt-3 pt-2 border-t border-border text-xs text-muted-foreground font-mono">
            Click <span className="json-string">&quot;department.name&quot;</span> in JSON to change it — watch the <span className="text-orange-500">DEPT</span> column update.
          </div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <button onClick={resetData} className="btn-mono active">Reset Data</button>
      </div>
    </div>
  );
}
