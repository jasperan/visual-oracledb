"use client";

import { useState } from "react";

export default function TestPage() {
  const [count, setCount] = useState(0);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d0d0f",
      color: "#e4e4e7",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui"
    }}>
      <h1 style={{ marginBottom: "2rem" }}>Minimal React Test</h1>
      <button
        onClick={() => setCount(c => c + 1)}
        style={{
          background: "#f97316",
          color: "white",
          border: "none",
          padding: "1rem 2rem",
          fontSize: "1.5rem",
          borderRadius: "0.5rem",
          cursor: "pointer"
        }}
      >
        Clicked {count} times
      </button>
      <p style={{ marginTop: "1rem", color: "#71717a" }}>
        If this doesn't work, JavaScript is broken.
      </p>
    </div>
  );
}