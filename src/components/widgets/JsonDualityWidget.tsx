"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export function JsonDualityWidget() {
  const initialData = [
    { id: 1, name: "Alice", role: "Engineer" },
    { id: 2, name: "Bob", role: "Designer" },
    { id: 3, name: "Carol", role: "Manager" },
  ];

  const [data, setData] = useState(initialData);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingIndex]);

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(data[index].name);
  };

  const handleSave = useCallback(() => {
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
  }, [editingIndex, editValue]);

  const handleBlur = useCallback(() => {
    setTimeout(() => handleSave(), 150);
  }, [handleSave]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") { setEditingIndex(null); setEditValue(""); }
  };

  const resetData = () => setData(initialData);

  return (
    <div className="widget-container bg-card border border-border rounded-xl p-6 my-8 overflow-hidden">
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-mono">Interactive · JSON Duality View</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border rounded-lg overflow-hidden">
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
              {editingIndex === idx ? (
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
                  onClick={() => handleEdit(idx)}
                  className="text-left text-yellow-400 hover:text-cyan-400 cursor-pointer"
                >
                  {row.name}
                </button>
              )}
              <span className="text-muted-foreground truncate">{row.role}</span>
            </div>
          ))}
        </div>

        <div className="bg-card p-4 min-h-[200px]">
          <div className="flex items-center gap-2 mb-3 text-sm">
            <span className="text-cyan-400">{"{}"}</span>
            <span className="text-cyan-400 font-mono text-xs uppercase tracking-wider">JSON Document</span>
          </div>
          <pre className="font-mono text-sm leading-relaxed">
            <span className="json-bracket">[</span>
            {data.map((row, idx) => (
              <span key={row.id}>
                {"\n  "}
                <span className="json-bracket">{"{"}</span>
                {"\n    "}
                <span className="json-key">&quot;id&quot;</span>: <span className="json-number">{row.id}</span>,
                {"\n    "}
                <span className="json-key">&quot;name&quot;</span>:{" "}
                {editingIndex === idx ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="bg-transparent border-b border-cyan-400 outline-none w-20 json-string font-mono text-sm"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => handleEdit(idx)}
                    className="json-string cursor-pointer hover:json-highlight px-1"
                  >
                    {`"${row.name}"`}
                  </button>
                )}
                ,{"\n    "}
                <span className="json-key">&quot;role&quot;</span>: <span className="json-string">&quot;{row.role}&quot;</span>
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
