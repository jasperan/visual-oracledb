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
  PlaybackWidget,
  type PlaybackTrace,
} from "@/components/widgets";

const SQL_TRACE: PlaybackTrace = {
  source: [
    "SELECT id, name, VECTOR_DISTANCE(embedding, :q, COSINE) AS dist",
    "FROM   products",
    "ORDER  BY dist",
    "FETCH  FIRST 3 ROWS ONLY;",
  ].join("\n"),
  steps: [
    { line: 1, vars: { stage: "parse", rows_scanned: 0 }, note: "Query parsed. Cosine distance against query vector :q." },
    { line: 2, vars: { stage: "scan", rows_scanned: 12048 }, note: "HNSW index traversal narrows candidates." },
    { line: 3, vars: { stage: "sort", rows_scanned: 12048, top_dist: 0.0312 }, note: "Top candidates sorted by distance." },
    { line: 4, vars: { stage: "fetch", rows_scanned: 12048, top_dist: 0.0312, rows_returned: 3 }, note: "Returning top-3 nearest neighbors." },
  ],
};

const SECTIONS = [
  { id: "duality", short: "Duality", full: "JSON Duality Views", num: "1" },
  { id: "cascade", short: "Cascade", full: "Cascading updates", num: "2" },
  { id: "graphs", short: "Graphs", full: "Property Graphs", num: "3" },
  { id: "vectors", short: "Vectors", full: "Similarity Search", num: "4" },
  { id: "hnsw", short: "HNSW", full: "HNSW Indexing", num: "5" },
  { id: "rag", short: "RAG", full: "RAG Pipelines", num: "6" },
  { id: "acid", short: "ACID", full: "ACID Transactions", num: "7" },
  { id: "security", short: "Security", full: "Deep Data Security", num: "8" },
  { id: "onnx", short: "ONNX", full: "In-database ML", num: "9" },
  { id: "jsonpath", short: "JSON Path", full: "SQL/JSON Path", num: "10" },
  { id: "rac", short: "RAC", full: "Real Application Clusters", num: "11" },
];

export default function Home() {
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

      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[300] focus:bg-background focus:text-foreground focus:px-4 focus:py-2 focus:rounded-md focus:ring-2 focus:ring-[#C74634]"
      >
        Skip to content
      </a>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/92 backdrop-blur-md px-6 py-3 flex items-center gap-6 border-b border-white/[0.07]">
        <a href="#" className="flex items-center gap-2.5 shrink-0 group no-underline">
          <div className="w-7 h-7 rounded-md flex items-center justify-center font-semibold text-white text-sm bg-[#C74634]">
            O
          </div>
          <span className="hidden md:inline text-sm font-medium text-foreground">Oracle AI Database</span>
        </a>

        <div className="flex gap-4 overflow-x-auto whitespace-nowrap scrollbar-hide ml-auto items-center">
          {SECTIONS.map(({ id, short }) => (
            <a
              key={id}
              href={`#${id}`}
              className={`v2-nav-link text-xs font-medium no-underline transition-colors pb-1 ${
                activeSection === id
                  ? "text-foreground active"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {short}
            </a>
          ))}
        </div>
      </nav>

      {/* Hero */}
      <header className="v2-hero px-6 pt-20 pb-14 md:pt-28 md:pb-16">
        <div className="max-w-[1024px] mx-auto">
          <div className="flex items-center gap-3 mb-10 text-xs text-muted-foreground">
            <span>April 2026</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
            <span>Interactive guide</span>
          </div>
          <h1 className="v2-display text-[3.25rem] md:text-7xl lg:text-[5rem] font-medium mb-8 text-foreground">
            Oracle AI<br />Database
          </h1>
          <p className="text-lg text-muted-foreground max-w-[46rem] leading-[1.6]" style={{ textWrap: "pretty" }}>
            Relational, JSON, graph and vector data in one engine. Eleven demos you can drive
            yourself, each showing one capability at work.
          </p>
        </div>
      </header>

      {/* Content */}
      <div id="content" className="max-w-[1024px] mx-auto px-6">

        {/* TOC */}
        <div className="py-8 mb-4 border-y border-white/[0.07]">
          <p className="text-xs text-muted-foreground mb-5">Contents</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-1">
            {SECTIONS.map(({ id, full, num }) => (
              <a
                key={id}
                href={`#${id}`}
                className="flex items-center gap-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors no-underline"
              >
                <span className="font-mono text-xs text-muted-foreground/70 w-5">{num}</span>
                <span>{full}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Playback preview: a vector-search SQL query, step by step */}
        <section className="reveal">
          <PlaybackWidget trace={SQL_TRACE} label="Vector search query · step through" />
        </section>

        {/* ===== 01 JSON Duality ===== */}
        <section id="duality" className="reveal v2-section">
          <div className="v2-divider" />
          <p className="v2-section-num">1</p>
          <h2 className="v2-heading text-3xl md:text-[2rem] text-foreground">What are JSON Duality Views?</h2>
          <div className="mt-6 max-w-[46rem] space-y-4 text-[1rem] leading-[1.65]">
            <p className="text-muted-foreground">
              Relational databases store data in <strong className="text-foreground">tables</strong> (rows and columns, strict schemas). Document databases store data as flexible <strong className="text-foreground">JSON documents</strong>. Developers have been forced to pick one, or glue them together with complex ORM layers.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">JSON Duality Views</strong> give you both representations simultaneously from the same underlying data. Same object, different views.
            </p>
            <p className="text-muted-foreground">
              Below, data lives in a <strong className="text-foreground">relational table</strong> on the left and appears as a <strong className="text-foreground">JSON document</strong> on the right. <strong className="text-foreground">Click any name</strong> to edit it and watch the other side update instantly. Try <strong className="text-foreground">Both Views</strong> to see an employee-centric and department-centric JSON shape update simultaneously from one table change.
            </p>
          </div>
          <JsonDualityWidget />
        </section>

        {/* ===== 02 Cascading Updates ===== */}
        <section id="cascade" className="reveal v2-section">
          <div className="v2-divider" />
          <p className="v2-section-num">2</p>
          <h2 className="v2-heading text-3xl md:text-[2rem] text-foreground">How cascading updates propagate</h2>
          <div className="mt-6 max-w-[46rem] space-y-4 text-[1rem] leading-[1.65]">
            <p className="text-muted-foreground">
              Relationships are the point. Updating a <strong className="text-foreground">foreign key</strong> in the relational side automatically restructures the JSON document.
            </p>
            <p className="text-muted-foreground">
              The slider below controls the <strong className="text-foreground">department_id</strong> of employee &quot;Alice&quot;. Watch how the JSON document restructures itself as the relational row updates simultaneously.
            </p>
          </div>
          <CascadeWidget />
          <div className="mt-6 max-w-[46rem] space-y-4 text-[1rem] leading-[1.65]">
            <p className="text-muted-foreground">
              When <code className="v2-code">dept_id</code> changes from <code className="v2-code">1</code> to <code className="v2-code">2</code>, the nested JSON object transforms from <strong className="text-foreground">&quot;Engineering&quot;</strong> to <strong className="text-foreground">&quot;Marketing&quot;</strong>. The database resolves the foreign key relationship and produces the correct document shape, no application code needed.
            </p>
          </div>
        </section>

        {/* ===== 03 Property Graphs ===== */}
        <section id="graphs" className="reveal v2-section">
          <div className="v2-divider" />
          <p className="v2-section-num">3</p>
          <h2 className="v2-heading text-3xl md:text-[2rem] text-foreground">What are Property Graphs?</h2>
          <div className="mt-6 max-w-[46rem] space-y-4 text-[1rem] leading-[1.65]">
            <p className="text-muted-foreground">
              Some data is inherently about connections. Social networks, supply chains, fraud rings are best understood as <strong className="text-foreground">graphs</strong> of entities linked by relationships.
            </p>
            <p className="text-muted-foreground">
              A <strong className="text-foreground">property graph</strong> has <strong className="text-foreground">nodes</strong> (entities) and <strong className="text-foreground">edges</strong> (relationships), both carrying <strong className="text-foreground">properties</strong> as key-value pairs. Oracle AI Database lets you define property graphs on relational tables, querying them with SQL/PGQ.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Hover</strong> over any node to see its properties and highlight connections. <strong className="text-foreground">Click</strong> to lock selection.
            </p>
          </div>
          <PropertyGraphWidget />
        </section>

        {/* ===== 04 Vector Search ===== */}
        <section id="vectors" className="reveal v2-section">
          <div className="v2-divider" />
          <p className="v2-section-num">4</p>
          <h2 className="v2-heading text-3xl md:text-[2rem] text-foreground">How does Similarity Search work?</h2>
          <div className="mt-6 max-w-[46rem] space-y-4 text-[1rem] leading-[1.65]">
            <p className="text-muted-foreground">
              Modern AI models convert text, images, and audio into <strong className="text-foreground">vectors</strong> (arrays of numbers capturing semantic meaning). Similar things end up close together in vector space. Oracle AI Database stores these vectors and finds closest matches via <strong className="text-foreground">similarity search</strong>.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Click anywhere</strong> in the space to move the query point and watch nearest neighbors update. Use the <strong className="text-foreground">k slider</strong> to change how many neighbors to find.
            </p>
          </div>
          <VectorSearchWidget />
          <div className="mt-6 max-w-[46rem] space-y-4 text-[1rem] leading-[1.65]">
            <p className="text-muted-foreground">
              Oracle supports multiple distance metrics: <strong className="text-foreground">Euclidean</strong> (straight-line), <strong className="text-foreground">Cosine</strong> (angular similarity), and <strong className="text-foreground">Dot Product</strong> (direction + magnitude).
            </p>
          </div>
        </section>

        {/* ===== 05 HNSW ===== */}
        <section id="hnsw" className="reveal v2-section">
          <div className="v2-divider" />
          <p className="v2-section-num">5</p>
          <h2 className="v2-heading text-3xl md:text-[2rem] text-foreground">Inside the HNSW Index</h2>
          <div className="mt-6 max-w-[46rem] space-y-4 text-[1rem] leading-[1.65]">
            <p className="text-muted-foreground">
              Brute-force similarity search checks every vector, O(n) and far too slow for millions of vectors. Oracle uses <strong className="text-foreground">HNSW</strong> (Hierarchical Navigable Small World) indexes to achieve <strong className="text-foreground">O(log n)</strong> approximate nearest neighbor search.
            </p>
            <p className="text-muted-foreground">
              HNSW builds a multi-layer graph. <strong className="text-foreground">Layer 0</strong> contains all points with dense connections. Higher layers contain progressively fewer points with long-range &quot;highway&quot; connections. <strong className="text-foreground">Add points</strong> one at a time, then <strong className="text-foreground">search</strong> to see the greedy walk traverse layers.
            </p>
          </div>
          <HnswIndexWidget />
          <div className="mt-6 max-w-[46rem] space-y-4 text-[1rem] leading-[1.65]">
            <p className="text-muted-foreground">
              The search only visits a fraction of nodes compared to brute force. The hierarchical structure means query time grows logarithmically, making billion-scale vector search practical.
            </p>
          </div>
        </section>

        {/* ===== 06 RAG Pipeline ===== */}
        <section id="rag" className="reveal v2-section">
          <div className="v2-divider" />
          <p className="v2-section-num">6</p>
          <h2 className="v2-heading text-3xl md:text-[2rem] text-foreground">The RAG pipeline, step by step</h2>
          <div className="mt-6 max-w-[46rem] space-y-4 text-[1rem] leading-[1.65]">
            <p className="text-muted-foreground">
              <strong className="text-foreground">Retrieval-Augmented Generation</strong> (RAG) is the dominant pattern for building AI applications that need factual, up-to-date answers. Instead of relying solely on the LLM&apos;s training data, RAG retrieves relevant documents and feeds them as context.
            </p>
            <p className="text-muted-foreground">
              Oracle AI Database runs the entire RAG pipeline in-database: <strong className="text-foreground">vector embeddings</strong>, <strong className="text-foreground">similarity search</strong>, and context assembly, all without data ever leaving the database. Type a question and watch each stage light up.
            </p>
          </div>
          <RagPipelineWidget />
          <div className="mt-6 max-w-[46rem] space-y-4 text-[1rem] leading-[1.65]">
            <p className="text-muted-foreground">
              Each stage is clickable. Freeze the pipeline at any point to inspect the intermediate data. This transparency is what makes Oracle&apos;s in-database RAG powerful: you can debug, audit, and optimize every step.
            </p>
          </div>
        </section>
      </div>

      {/* ===== 07 ACID — full-bleed comparison ===== */}
      <section id="acid" className="v2-compare reveal">
        <div className="v2-compare-grid">
          <div className="v2-compare-copy">
            <p className="v2-section-num">7</p>
            <h2 className="v2-heading text-3xl md:text-[2rem] text-foreground">Why ACID matters for AI</h2>
            <div className="mt-6 space-y-4 text-[1rem] leading-[1.65]">
              <p className="text-muted-foreground">
                Most vector databases sacrifice <strong className="text-foreground">ACID transactions</strong> for speed. Fine for demos, but in production, concurrent users reading and writing vectors creates real problems: phantom reads, dirty reads, lost updates.
              </p>
              <p className="text-muted-foreground">
                Oracle AI Database provides full ACID guarantees on vector operations. Watch two concurrent users interact with the same data: Oracle&apos;s transactional consistency on the left, the same workload without it on the right.
              </p>
              <p className="text-muted-foreground">
                Try each scenario. The <strong className="text-foreground">anomalies</strong> on the right aren&apos;t theoretical. They happen in production when vector data is modified during queries. Oracle&apos;s MVCC isolation ensures every read sees a consistent snapshot.
              </p>
            </div>
          </div>
          <div className="v2-compare-stage">
            <AcidRaceWidget />
          </div>
        </div>
      </section>

      {/* ===== 08 Security — full-bleed comparison ===== */}
      <section id="security" className="v2-compare reveal">
        <div className="v2-compare-grid">
          <div className="v2-compare-copy">
            <p className="v2-section-num">8</p>
            <h2 className="v2-heading text-3xl md:text-[2rem] text-foreground">Deep Data Security for Vector Search</h2>
            <div className="mt-6 space-y-4 text-[1rem] leading-[1.65]">
              <p className="text-muted-foreground">
                Vector databases typically have no concept of row-level security. If you can query, you can see everything. Oracle AI Database applies <strong className="text-foreground">Deep Data Security</strong> policies directly to vector operations: similarity search results are automatically filtered based on the user&apos;s security clearance.
              </p>
              <p className="text-muted-foreground">
                Switch between user roles and <strong className="text-foreground">click anywhere</strong> to run a similarity search. The same query returns different results depending on who is logged in. The database enforces this at the storage level, not the application layer.
              </p>
              <p className="text-muted-foreground">
                HR data, financial reports, and legal documents can all live in the same vector store. Each user only ever sees what their security label permits. No application-level filtering required.
              </p>
            </div>
          </div>
          <div className="v2-compare-stage">
            <DeepSecurityWidget />
          </div>
        </div>
      </section>

      <div className="max-w-[1024px] mx-auto px-6 pb-28">
        {/* ===== 09 ONNX ===== */}
        <section id="onnx" className="reveal v2-section">
          <div className="v2-divider" />
          <p className="v2-section-num">9</p>
          <h2 className="v2-heading text-3xl md:text-[2rem] text-foreground">Neural Networks inside the Database</h2>
          <div className="mt-6 max-w-[46rem] space-y-4 text-[1rem] leading-[1.65]">
            <p className="text-muted-foreground">
              Traditionally, ML inference means extracting data from the database, sending it to an external service, and writing predictions back. Oracle AI Database runs <strong className="text-foreground">ONNX models directly inside the database</strong>. Data never leaves.
            </p>
            <p className="text-muted-foreground">
              This eliminates network latency, reduces security risk, and simplifies architecture. Toggle between <strong className="text-foreground">in-database</strong> and <strong className="text-foreground">traditional</strong> modes to see the difference.
            </p>
          </div>
          <OnnxInDbWidget />
          <div className="mt-6 max-w-[46rem] space-y-4 text-[1rem] leading-[1.65]">
            <p className="text-muted-foreground">
              In-database inference means your ML pipeline is a single SQL statement. No API calls, no serialization overhead: <code className="v2-code">SELECT predict(model, features) FROM table</code>.
            </p>
          </div>
        </section>

        {/* ===== 10 JSON Path ===== */}
        <section id="jsonpath" className="reveal v2-section">
          <div className="v2-divider" />
          <p className="v2-section-num">10</p>
          <h2 className="v2-heading text-3xl md:text-[2rem] text-foreground">SQL/JSON Path Expressions</h2>
          <div className="mt-6 max-w-[46rem] space-y-4 text-[1rem] leading-[1.65]">
            <p className="text-muted-foreground">
              Oracle AI Database supports the <strong className="text-foreground">SQL/JSON path language</strong> for querying nested JSON documents. Path expressions let you navigate objects, filter arrays, and extract values, all within SQL.
            </p>
            <p className="text-muted-foreground">
              Type a path expression below and watch matching nodes <strong className="text-foreground">light up</strong> in real time. Try the pre-built examples.
            </p>
          </div>
          <JsonPathWidget />
          <div className="mt-6 max-w-[46rem] space-y-4 text-[1rem] leading-[1.65]">
            <p className="text-muted-foreground">
              Path expressions combine with Oracle&apos;s JSON Duality Views: query the JSON shape of your relational data using powerful path syntax, with indexes accelerating the search.
            </p>
          </div>
        </section>

        {/* ===== 11 RAC ===== */}
        <section id="rac" className="reveal v2-section">
          <div className="v2-divider" />
          <p className="v2-section-num">11</p>
          <h2 className="v2-heading text-3xl md:text-[2rem] text-foreground">Oracle RAC: Scalability and Resilience</h2>
          <div className="mt-6 max-w-[46rem] space-y-4 text-[1rem] leading-[1.65]">
            <p className="text-muted-foreground">
              <strong className="text-foreground">Oracle RAC</strong> (Real Application Clusters) provides the foundation for running Oracle AI Database at scale. Multiple active-active instances share the same storage, each capable of reading and writing simultaneously.
            </p>
            <p className="text-muted-foreground">
              RAC 26ai introduces Smart Connection Rebalancing, linear scaling of AI vector search across instances, Two-Stage Rolling Patching for zero-downtime updates, and Fast Start Reconfiguration that resumes work 6x faster after failures.
            </p>
          </div>
          <RacWidget />
          <div className="mt-6 max-w-[46rem] space-y-4 text-[1rem] leading-[1.65]">
            <p className="text-muted-foreground">
              Oracle RAC is the ideal platform for AI workloads: isolate CPU-intensive vector search on dedicated instances while OLTP continues uninterrupted. The shared-storage architecture means every instance sees the same data, including HNSW indexes, enabling distributed similarity search at scale.
            </p>
          </div>
        </section>

        {/* ===== Conclusion ===== */}
        <section className="reveal v2-section">
          <div className="v2-divider" />
          <p className="v2-section-num">12</p>
          <h2 className="v2-heading text-3xl md:text-[2rem] text-foreground">The convergence advantage</h2>
          <div className="mt-6 max-w-[46rem] space-y-4 text-[1rem] leading-[1.65]">
            <p className="text-muted-foreground">
              What makes Oracle AI Database unique is that <strong className="text-foreground">relational</strong>, <strong className="text-foreground">JSON</strong>, <strong className="text-foreground">graph</strong>, <strong className="text-foreground">vector</strong>, and beyond (XML, Text, Spatial, RDF) all happen in the same engine, on the same data. Add <strong className="text-foreground">HNSW indexing</strong> for scale, <strong className="text-foreground">RAG pipelines</strong> for AI applications, <strong className="text-foreground">in-database ML inference</strong> for simplicity, and <strong className="text-foreground">ACID transactions</strong> for production reliability.
            </p>
            <p className="text-muted-foreground">
              When your AI application needs to combine semantic search with structured filters, relationship traversals, and ML inference, Oracle AI Database handles it all natively, in a single SQL query, with full transactional guarantees.
            </p>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="v2-footer px-6 py-16">
        <div className="max-w-[1024px] mx-auto">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-6 h-6 rounded-md flex items-center justify-center font-semibold text-white text-xs bg-[#C74634]">O</div>
            <span className="font-medium text-sm">Oracle AI Database</span>
          </div>
          <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
            11 interactive explorations of Oracle AI Database capabilities.
            Built with Next.js, React, and TypeScript.
          </p>
        </div>
      </footer>
    </div>
  );
}
