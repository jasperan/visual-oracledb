"use client";

import { useEffect, useState } from "react";
import {
  JsonDualityWidget,
  CascadeWidget,
  PropertyGraphWidget,
  VectorSearchWidget,
  HnswIndexWidget,
  RagPipelineWidget,
  AcidRaceWidget,
  DeepSecurityWidget,
  OnnxInDbWidget,
  JsonPathWidget,
  RacWidget,
} from "@/components/widgets";

const SECTIONS = [
  { id: "duality", short: "Duality", full: "JSON Duality Views", num: "01" },
  { id: "cascade", short: "Cascade", full: "Cascading updates", num: "02" },
  { id: "graphs", short: "Graphs", full: "Property Graphs", num: "03" },
  { id: "vectors", short: "Vectors", full: "Similarity Search", num: "04" },
  { id: "hnsw", short: "HNSW", full: "HNSW Indexing", num: "05" },
  { id: "rag", short: "RAG", full: "RAG Pipelines", num: "06" },
  { id: "acid", short: "ACID", full: "ACID Transactions", num: "07" },
  { id: "security", short: "Security", full: "Deep Data Security", num: "08" },
  { id: "onnx", short: "ONNX", full: "In-database ML", num: "09" },
  { id: "jsonpath", short: "JSON Path", full: "SQL/JSON Path", num: "10" },
  { id: "rac", short: "RAC", full: "Real Application Clusters", num: "11" },
];

export default function V2Page() {
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".v2 .reveal").forEach((el) => revealObs.observe(el));

    const sectionObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection(e.target.id);
        });
      },
      { threshold: 0.15, rootMargin: "-15% 0px -65% 0px" }
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) sectionObs.observe(el);
    });

    return () => {
      revealObs.disconnect();
      sectionObs.disconnect();
    };
  }, []);

  return (
    <div className="v2 bg-background text-foreground min-h-dvh">
      <div className="v2-grain" aria-hidden="true" />

      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[300] focus:bg-background focus:text-foreground focus:px-4 focus:py-2 focus:rounded-md focus:ring-2 focus:ring-[#C74634]"
      >
        Skip to content
      </a>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/92 backdrop-blur-lg px-6 py-3 flex items-center gap-6 border-b border-[rgba(255,255,255,0.05)]">
        <a href=".." className="flex items-center gap-2.5 shrink-0 group no-underline">
          <div className="w-7 h-7 rounded-md flex items-center justify-center font-extrabold text-white text-sm bg-[#C74634] group-hover:scale-105 transition-transform">
            O
          </div>
          <span className="hidden md:inline text-sm font-semibold tracking-tight text-foreground">Oracle AI Database</span>
        </a>

        <div className="flex gap-3.5 md:gap-4 overflow-x-auto whitespace-nowrap scrollbar-hide ml-auto items-center">
          {SECTIONS.map(({ id, short }) => (
            <a
              key={id}
              href={`#${id}`}
              className={`v2-nav-link text-xs font-medium no-underline transition-colors pb-0.5 ${
                activeSection === id
                  ? "text-foreground active"
                  : "text-[#6b6d7a] hover:text-foreground"
              }`}
            >
              {short}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-3 text-xs border-l border-[rgba(255,255,255,0.06)] pl-4">
          <a href=".." className="text-[#6b6d7a] hover:text-foreground transition-colors px-1.5 py-0.5 rounded no-underline">v1</a>
          <span className="text-foreground font-semibold border-b-2 border-[#C74634] px-1.5 py-0.5">v2</span>
        </div>
      </nav>

      {/* Hero */}
      <header className="v2-hero relative overflow-hidden px-6 pt-20 pb-14 md:pt-28 md:pb-20">
        <div className="v2-hero-glow" aria-hidden="true" />
        <div className="v2-hero-grid" aria-hidden="true" />
        <div className="max-w-4xl mx-auto relative">
          <div className="flex items-center gap-3 mb-10">
            <span className="text-xs font-medium tracking-[0.12em] uppercase text-[#6b6d7a]">Apr 2026</span>
            <span className="w-1 h-1 rounded-full bg-[#6b6d7a]/40" />
            <span className="text-xs font-medium tracking-[0.12em] uppercase text-[#6b6d7a]">Interactive guide</span>
          </div>
          <h1 className="v2-display text-5xl md:text-7xl lg:text-[5.5rem] font-black leading-[0.88] tracking-[-0.04em] mb-8 text-foreground">
            Oracle AI<br />Database
          </h1>
          <p className="text-lg md:text-xl text-[#8b8d9a] max-w-lg leading-relaxed" style={{ textWrap: "pretty" }}>
            Relational, JSON, graph, vector, and more converged in a single engine.
            Explore each capability through 11 interactive demos.
          </p>
        </div>
      </header>

      {/* Content */}
      <div id="content" className="max-w-4xl mx-auto px-6 pb-28">

        {/* TOC */}
        <div className="py-8 mb-4 border-y border-[rgba(255,255,255,0.06)]">
          <p className="text-xs font-medium tracking-[0.1em] uppercase text-[#6b6d7a] mb-5">Contents</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-1">
            {SECTIONS.map(({ id, full, num }) => (
              <a
                key={id}
                href={`#${id}`}
                className="flex items-center gap-3 py-1.5 text-sm text-[#8b8d9a] hover:text-foreground transition-colors group no-underline"
              >
                <span className="font-mono text-xs text-[#C74634]/50 group-hover:text-[#C74634] transition-colors w-5">{num}</span>
                <span>{full}</span>
              </a>
            ))}
          </div>
        </div>

        {/* ===== 01 JSON Duality ===== */}
        <section id="duality" className="reveal v2-section">
          <div className="v2-divider" />
          <div className="flex items-start gap-4 mb-5">
            <span className="v2-section-num mt-1.5">01</span>
            <h2 className="v2-heading text-2xl md:text-4xl font-bold">What are JSON Duality Views?</h2>
          </div>
          <div className="max-w-2xl">
            <p className="text-[#8b8d9a] mb-4 leading-relaxed">
              Relational databases store data in <span className="text-relational">tables</span> (rows and columns, strict schemas). Document databases store data as flexible <span className="text-json">JSON documents</span>. Developers have been forced to pick one, or glue them together with complex ORM layers.
            </p>
            <p className="text-[#8b8d9a] mb-4 leading-relaxed">
              <strong className="text-foreground">JSON Duality Views</strong> give you both representations simultaneously from the same underlying data. Same object, different views.
            </p>
            <p className="text-[#8b8d9a] mb-4 leading-relaxed">
              Below, data lives in a <span className="text-relational">relational table</span> on the left and appears as a <span className="text-json">JSON document</span> on the right. <strong className="text-foreground">Click any name</strong> to edit it and watch the other side update instantly. Try <strong className="text-foreground">Both Views</strong> to see an employee-centric and department-centric JSON shape update simultaneously from one table change.
            </p>
          </div>
          <div className="v2-widget-frame my-8">
            <JsonDualityWidget />
          </div>
        </section>

        {/* ===== 02 Cascading Updates ===== */}
        <section id="cascade" className="reveal v2-section">
          <div className="v2-divider" />
          <div className="flex items-start gap-4 mb-5">
            <span className="v2-section-num mt-1.5">02</span>
            <h2 className="v2-heading text-2xl md:text-4xl font-bold">How cascading updates propagate</h2>
          </div>
          <div className="max-w-2xl">
            <p className="text-[#8b8d9a] mb-4 leading-relaxed">
              The real magic happens with <em>relationships</em>. Updating a <span className="text-keyword">foreign key</span> in the relational side automatically restructures the JSON document.
            </p>
            <p className="text-[#8b8d9a] mb-4 leading-relaxed">
              The slider below controls the <span className="text-relational">department_id</span> of employee &quot;Alice&quot;. Watch how the JSON document restructures itself as the relational row updates simultaneously.
            </p>
          </div>
          <div className="v2-widget-frame my-8">
            <CascadeWidget />
          </div>
          <div className="max-w-2xl">
            <p className="text-[#8b8d9a] leading-relaxed">
              When <code className="v2-code">dept_id</code> changes from <code className="v2-code">1</code> to <code className="v2-code">2</code>, the nested JSON object transforms from <span className="text-json">&quot;Engineering&quot;</span> to <span className="text-json">&quot;Marketing&quot;</span>. The database resolves the foreign key relationship and produces the correct document shape, no application code needed.
            </p>
          </div>
        </section>

        {/* ===== 03 Property Graphs ===== */}
        <section id="graphs" className="reveal v2-section">
          <div className="v2-divider" />
          <div className="flex items-start gap-4 mb-5">
            <span className="v2-section-num mt-1.5">03</span>
            <h2 className="v2-heading text-2xl md:text-4xl font-bold">What are Property Graphs?</h2>
          </div>
          <div className="max-w-2xl">
            <p className="text-[#8b8d9a] mb-4 leading-relaxed">
              Some data is inherently about <em>connections</em>. Social networks, supply chains, fraud rings are best understood as <span className="text-graph">graphs</span> of entities linked by relationships.
            </p>
            <p className="text-[#8b8d9a] mb-4 leading-relaxed">
              A <strong className="text-foreground">property graph</strong> has <span className="text-graph">nodes</span> (entities) and <span className="text-graph">edges</span> (relationships), both carrying <span className="text-keyword">properties</span> as key-value pairs. Oracle AI Database lets you define property graphs on relational tables, querying them with SQL/PGQ.
            </p>
            <p className="text-[#8b8d9a] mb-4 leading-relaxed">
              <strong className="text-foreground">Hover</strong> over any node to see its properties and highlight connections. <strong className="text-foreground">Click</strong> to lock selection.
            </p>
          </div>
          <div className="v2-widget-frame my-8">
            <PropertyGraphWidget />
          </div>
        </section>

        {/* ===== 04 Vector Search ===== */}
        <section id="vectors" className="reveal v2-section">
          <div className="v2-divider" />
          <div className="flex items-start gap-4 mb-5">
            <span className="v2-section-num mt-1.5">04</span>
            <h2 className="v2-heading text-2xl md:text-4xl font-bold">How does Similarity Search work?</h2>
          </div>
          <div className="max-w-2xl">
            <p className="text-[#8b8d9a] mb-4 leading-relaxed">
              Modern AI models convert text, images, and audio into <span className="text-vector">vectors</span> (arrays of numbers capturing semantic meaning). Similar things end up close together in vector space. Oracle AI Database stores these vectors and finds closest matches via <strong className="text-foreground">similarity search</strong>.
            </p>
            <p className="text-[#8b8d9a] mb-4 leading-relaxed">
              <strong className="text-foreground">Click anywhere</strong> in the space to move the query point and watch nearest neighbors update. Use the <strong className="text-foreground">k slider</strong> to change how many neighbors to find.
            </p>
          </div>
          <div className="v2-widget-frame my-8">
            <VectorSearchWidget />
          </div>
          <div className="max-w-2xl">
            <p className="text-[#8b8d9a] leading-relaxed">
              Oracle supports multiple distance metrics: <span className="text-vector">Euclidean</span> (straight-line), <span className="text-vector">Cosine</span> (angular similarity), and <span className="text-vector">Dot Product</span> (direction + magnitude).
            </p>
          </div>
        </section>

        {/* ===== 05 HNSW ===== */}
        <section id="hnsw" className="reveal v2-section">
          <div className="v2-divider" />
          <div className="flex items-start gap-4 mb-5">
            <span className="v2-section-num mt-1.5">05</span>
            <h2 className="v2-heading text-2xl md:text-4xl font-bold">Inside the HNSW Index</h2>
          </div>
          <div className="max-w-2xl">
            <p className="text-[#8b8d9a] mb-4 leading-relaxed">
              Brute-force similarity search checks every vector, O(n) and far too slow for millions of vectors. Oracle uses <span className="text-hnsw">HNSW</span> (Hierarchical Navigable Small World) indexes to achieve <span className="text-hnsw">O(log n)</span> approximate nearest neighbor search.
            </p>
            <p className="text-[#8b8d9a] mb-4 leading-relaxed">
              HNSW builds a multi-layer graph. <strong className="text-foreground">Layer 0</strong> contains all points with dense connections. Higher layers contain progressively fewer points with long-range &quot;highway&quot; connections. <strong className="text-foreground">Add points</strong> one at a time, then <strong className="text-foreground">search</strong> to see the greedy walk traverse layers.
            </p>
          </div>
          <div className="v2-widget-frame my-8">
            <HnswIndexWidget />
          </div>
          <div className="max-w-2xl">
            <p className="text-[#8b8d9a] leading-relaxed">
              The search only visits a fraction of nodes compared to brute force. The hierarchical structure means query time grows logarithmically, making billion-scale vector search practical.
            </p>
          </div>
        </section>

        {/* ===== 06 RAG Pipeline ===== */}
        <section id="rag" className="reveal v2-section">
          <div className="v2-divider" />
          <div className="flex items-start gap-4 mb-5">
            <span className="v2-section-num mt-1.5">06</span>
            <h2 className="v2-heading text-2xl md:text-4xl font-bold">The RAG Pipeline, demystified</h2>
          </div>
          <div className="max-w-2xl">
            <p className="text-[#8b8d9a] mb-4 leading-relaxed">
              <span className="text-rag">Retrieval-Augmented Generation</span> (RAG) is the dominant pattern for building AI applications that need factual, up-to-date answers. Instead of relying solely on the LLM&apos;s training data, RAG retrieves relevant documents and feeds them as context.
            </p>
            <p className="text-[#8b8d9a] mb-4 leading-relaxed">
              Oracle AI Database runs the entire RAG pipeline in-database: <span className="text-vector">vector embeddings</span>, <span className="text-hnsw">similarity search</span>, and context assembly, all without data ever leaving the database. Type a question and watch each stage light up.
            </p>
          </div>
          <div className="v2-widget-frame my-8">
            <RagPipelineWidget />
          </div>
          <div className="max-w-2xl">
            <p className="text-[#8b8d9a] leading-relaxed">
              Each stage is clickable. Freeze the pipeline at any point to inspect the intermediate data. This transparency is what makes Oracle&apos;s in-database RAG powerful: you can debug, audit, and optimize every step.
            </p>
          </div>
        </section>

        {/* ===== 07 ACID ===== */}
        <section id="acid" className="reveal v2-section">
          <div className="v2-divider" />
          <div className="flex items-start gap-4 mb-5">
            <span className="v2-section-num mt-1.5">07</span>
            <h2 className="v2-heading text-2xl md:text-4xl font-bold">Why ACID matters for AI</h2>
          </div>
          <div className="max-w-2xl">
            <p className="text-[#8b8d9a] mb-4 leading-relaxed">
              Most vector databases sacrifice <span className="text-acid">ACID transactions</span> for speed. Fine for demos, but in production, concurrent users reading and writing vectors creates real problems: phantom reads, dirty reads, lost updates.
            </p>
            <p className="text-[#8b8d9a] mb-4 leading-relaxed">
              Oracle AI Database provides full ACID guarantees on vector operations. Below, watch two concurrent users interact with the same data. Left: Oracle&apos;s transactional consistency. Right: what happens without it.
            </p>
          </div>
          <div className="v2-widget-frame my-8">
            <AcidRaceWidget />
          </div>
          <div className="max-w-2xl">
            <p className="text-[#8b8d9a] leading-relaxed">
              Try each scenario. The <span className="text-acid">anomalies</span> on the right aren&apos;t theoretical. They happen in production when vector data is modified during queries. Oracle&apos;s MVCC isolation ensures every read sees a consistent snapshot.
            </p>
          </div>
        </section>

        {/* ===== 08 Security ===== */}
        <section id="security" className="reveal v2-section">
          <div className="v2-divider" />
          <div className="flex items-start gap-4 mb-5">
            <span className="v2-section-num mt-1.5">08</span>
            <h2 className="v2-heading text-2xl md:text-4xl font-bold">Deep Data Security for Vector Search</h2>
          </div>
          <div className="max-w-2xl">
            <p className="text-[#8b8d9a] mb-4 leading-relaxed">
              Vector databases typically have no concept of row-level security. If you can query, you can see everything. Oracle AI Database applies <strong className="text-foreground">Deep Data Security</strong> policies directly to vector operations: similarity search results are automatically filtered based on the user&apos;s security clearance.
            </p>
            <p className="text-[#8b8d9a] mb-4 leading-relaxed">
              Switch between user roles below and <strong className="text-foreground">click anywhere</strong> to run a similarity search. The same query returns different results depending on who is logged in. The database enforces this at the storage level, not the application layer.
            </p>
          </div>
          <div className="v2-widget-frame my-8">
            <DeepSecurityWidget />
          </div>
          <div className="max-w-2xl">
            <p className="text-[#8b8d9a] leading-relaxed">
              HR data, financial reports, and legal documents can all live in the same vector store. Each user only ever sees what their security label permits. No application-level filtering required.
            </p>
          </div>
        </section>

        {/* ===== 09 ONNX ===== */}
        <section id="onnx" className="reveal v2-section">
          <div className="v2-divider" />
          <div className="flex items-start gap-4 mb-5">
            <span className="v2-section-num mt-1.5">09</span>
            <h2 className="v2-heading text-2xl md:text-4xl font-bold">Neural Networks inside the Database</h2>
          </div>
          <div className="max-w-2xl">
            <p className="text-[#8b8d9a] mb-4 leading-relaxed">
              Traditionally, ML inference means extracting data from the database, sending it to an external service, and writing predictions back. Oracle AI Database runs <span className="text-onnx">ONNX models directly inside the database</span>. Data never leaves.
            </p>
            <p className="text-[#8b8d9a] mb-4 leading-relaxed">
              This eliminates network latency, reduces security risk, and simplifies architecture. Toggle between <span className="text-onnx">in-database</span> and <span className="text-relational">traditional</span> modes to see the difference.
            </p>
          </div>
          <div className="v2-widget-frame my-8">
            <OnnxInDbWidget />
          </div>
          <div className="max-w-2xl">
            <p className="text-[#8b8d9a] leading-relaxed">
              In-database inference means your ML pipeline is a single SQL statement. No API calls, no serialization overhead: <code className="v2-code">SELECT predict(model, features) FROM table</code>.
            </p>
          </div>
        </section>

        {/* ===== 10 JSON Path ===== */}
        <section id="jsonpath" className="reveal v2-section">
          <div className="v2-divider" />
          <div className="flex items-start gap-4 mb-5">
            <span className="v2-section-num mt-1.5">10</span>
            <h2 className="v2-heading text-2xl md:text-4xl font-bold">SQL/JSON Path Expressions</h2>
          </div>
          <div className="max-w-2xl">
            <p className="text-[#8b8d9a] mb-4 leading-relaxed">
              Oracle AI Database supports the <span className="text-jsonpath">SQL/JSON path language</span> for querying nested JSON documents. Path expressions let you navigate objects, filter arrays, and extract values, all within SQL.
            </p>
            <p className="text-[#8b8d9a] mb-4 leading-relaxed">
              Type a path expression below and watch matching nodes <span className="text-jsonpath">light up</span> in real time. Try the pre-built examples.
            </p>
          </div>
          <div className="v2-widget-frame my-8">
            <JsonPathWidget />
          </div>
          <div className="max-w-2xl">
            <p className="text-[#8b8d9a] leading-relaxed">
              Path expressions combine with Oracle&apos;s JSON Duality Views: query the JSON shape of your relational data using powerful path syntax, with indexes accelerating the search.
            </p>
          </div>
        </section>

        {/* ===== 11 RAC ===== */}
        <section id="rac" className="reveal v2-section">
          <div className="v2-divider" />
          <div className="flex items-start gap-4 mb-5">
            <span className="v2-section-num mt-1.5">11</span>
            <h2 className="v2-heading text-2xl md:text-4xl font-bold">Oracle RAC: Scalability and Resilience</h2>
          </div>
          <div className="max-w-2xl">
            <p className="text-[#8b8d9a] mb-4 leading-relaxed">
              <strong className="text-foreground">Oracle RAC</strong> (Real Application Clusters) provides the foundation for running Oracle AI Database at scale. Multiple active-active instances share the same storage, each capable of reading and writing simultaneously.
            </p>
            <p className="text-[#8b8d9a] mb-4 leading-relaxed">
              RAC 26ai introduces Smart Connection Rebalancing, linear scaling of AI vector search across instances, Two-Stage Rolling Patching for zero-downtime updates, and Fast Start Reconfiguration that resumes work 6x faster after failures.
            </p>
          </div>
          <div className="v2-widget-frame my-8">
            <RacWidget />
          </div>
          <div className="max-w-2xl">
            <p className="text-[#8b8d9a] leading-relaxed">
              Oracle RAC is the ideal platform for AI workloads: isolate CPU-intensive vector search on dedicated instances while OLTP continues uninterrupted. The shared-storage architecture means every instance sees the same data, including HNSW indexes, enabling distributed similarity search at scale.
            </p>
          </div>
        </section>

        {/* ===== Conclusion ===== */}
        <section className="reveal v2-section">
          <div className="v2-divider" />
          <h2 className="v2-heading text-2xl md:text-4xl font-bold mb-5">The convergence advantage</h2>
          <div className="max-w-2xl">
            <p className="text-[#8b8d9a] mb-4 leading-relaxed">
              What makes Oracle AI Database unique is that <span className="text-relational">relational</span>, <span className="text-json">JSON</span>, <span className="text-graph">graph</span>, <span className="text-vector">vector</span>, and beyond (XML, Text, Spatial, RDF) all happen in the same engine, on the same data. Add <span className="text-hnsw">HNSW indexing</span> for scale, <span className="text-rag">RAG pipelines</span> for AI applications, <span className="text-onnx">in-database ML inference</span> for simplicity, and <span className="text-acid">ACID transactions</span> for production reliability.
            </p>
            <p className="text-[#8b8d9a] leading-relaxed">
              When your AI application needs to combine semantic search with structured filters, relationship traversals, and ML inference, Oracle AI Database handles it all natively, in a single SQL query, with full transactional guarantees.
            </p>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="v2-footer px-6 py-16">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-6 h-6 rounded-md flex items-center justify-center font-extrabold text-white text-xs bg-[#C74634]">O</div>
              <span className="font-semibold text-sm tracking-tight">Oracle AI Database</span>
            </div>
            <p className="text-[#6b6d7a] text-sm max-w-sm leading-relaxed">
              11 interactive explorations of Oracle AI Database capabilities.
              Built with Next.js, React, and TypeScript.
            </p>
          </div>
          <div className="flex gap-4 text-xs text-[#6b6d7a]">
            <a href=".." className="hover:text-foreground transition-colors no-underline">v1</a>
            <span className="text-foreground font-medium">v2</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
