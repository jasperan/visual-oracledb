"use client";

import {
  JsonDualityWidget,
  CascadeWidget,
  PropertyGraphWidget,
  VectorSearchWidget,
  HnswIndexWidget,
  RagPipelineWidget,
  AcidRaceWidget,
  OnnxInDbWidget,
  JsonPathWidget,
} from "@/components/widgets";

export default function Home() {
  return (
    <main>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/85 backdrop-blur-xl border-b border-border px-4 md:px-6 py-3 flex items-center gap-4">
        <a href="#" className="flex items-center gap-2 font-bold text-foreground no-underline shrink-0">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center font-extrabold text-white text-sm">
            O
          </div>
          <span className="hidden md:inline text-lg">/ blog</span>
        </a>
        <div className="flex gap-3 md:gap-4 overflow-x-auto whitespace-nowrap scrollbar-hide ml-auto">
          <a href="#duality" className="text-muted-foreground no-underline text-xs md:text-sm font-medium hover:text-foreground transition-colors">Duality</a>
          <a href="#graphs" className="text-muted-foreground no-underline text-xs md:text-sm font-medium hover:text-foreground transition-colors">Graphs</a>
          <a href="#vectors" className="text-muted-foreground no-underline text-xs md:text-sm font-medium hover:text-foreground transition-colors">Vectors</a>
          <a href="#hnsw" className="text-muted-foreground no-underline text-xs md:text-sm font-medium hover:text-foreground transition-colors">HNSW</a>
          <a href="#rag" className="text-muted-foreground no-underline text-xs md:text-sm font-medium hover:text-foreground transition-colors">RAG</a>
          <a href="#acid" className="text-muted-foreground no-underline text-xs md:text-sm font-medium hover:text-foreground transition-colors">ACID</a>
          <a href="#onnx" className="text-muted-foreground no-underline text-xs md:text-sm font-medium hover:text-foreground transition-colors">ONNX</a>
          <a href="#jsonpath" className="text-muted-foreground no-underline text-xs md:text-sm font-medium hover:text-foreground transition-colors">JSON Path</a>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden py-16 px-6 hero-gradient">
        <div className="hero-glow" />
        <div className="max-w-3xl mx-auto relative">
          <div className="flex items-center gap-3 mb-8 text-sm">
            <span className="text-muted-foreground">MAR 31, 2026</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">Interactive Guide</span>
            <span className="text-muted-foreground">·</span>
            <span className="bg-purple-500/15 text-purple-300 px-2 py-0.5 rounded text-xs font-semibold uppercase">
              AI Database
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight mb-4">
            Oracle AI Database<br />from the ground up
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            Oracle Database 23ai converges <span className="text-relational">relational</span>,{" "}
            <span className="text-json">JSON</span>, <span className="text-graph">graph</span>, and{" "}
            <span className="text-vector">vector</span> data into a single engine — with <span className="text-rag">RAG pipelines</span>,{" "}
            <span className="text-hnsw">HNSW indexing</span>, <span className="text-onnx">in-database ML</span>, and{" "}
            <span className="text-acid">ACID guarantees</span>. Let&apos;s explore each capability interactively.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 pb-24">
        {/* Table of Contents */}
        <div className="bg-card border border-border rounded-xl p-6 my-8">
          <h4 className="font-semibold mb-3">In this post, you are going to learn:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><a href="#duality" className="text-muted-foreground no-underline hover:text-cyan-400">How JSON Duality Views unify relational tables and JSON documents</a></li>
            <li><a href="#cascade" className="text-muted-foreground no-underline hover:text-cyan-400">How cascading updates propagate across dual views in real time</a></li>
            <li><a href="#graphs" className="text-muted-foreground no-underline hover:text-cyan-400">What property graphs are and how they model relationships</a></li>
            <li><a href="#vectors" className="text-muted-foreground no-underline hover:text-cyan-400">How similarity search works, simplified to 3D space</a></li>
            <li><a href="#hnsw" className="text-muted-foreground no-underline hover:text-cyan-400">How HNSW indexes achieve O(log n) similarity search</a></li>
            <li><a href="#rag" className="text-muted-foreground no-underline hover:text-cyan-400">How RAG pipelines combine vector search with language models</a></li>
            <li><a href="#acid" className="text-muted-foreground no-underline hover:text-cyan-400">Why ACID transactions matter for AI workloads</a></li>
            <li><a href="#onnx" className="text-muted-foreground no-underline hover:text-cyan-400">Running neural network inference inside the database</a></li>
            <li><a href="#jsonpath" className="text-muted-foreground no-underline hover:text-cyan-400">Querying JSON documents with SQL/JSON path expressions</a></li>
          </ul>
        </div>

        {/* ===== JSON Duality Section ===== */}
        <section id="duality">
          <h2 className="text-3xl font-bold leading-tight mt-14 mb-4">What are JSON Duality Views?</h2>
          <p className="text-muted-foreground mb-4">
            Relational databases store data in <span className="text-relational">tables</span> — rows and columns with strict schemas. Document databases store data as flexible <span className="text-json">JSON documents</span>. Developers have been forced to choose one or the other, or glue them together with complex ORM layers.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>JSON Duality Views</strong> solve this. They give you <em>both representations simultaneously</em> from the same underlying data. Think of it like looking at a sculpture from two angles — same object, different views.
          </p>
          <p className="text-muted-foreground mb-4">
            Below is a live example. On the left, data lives in a <span className="text-relational">relational table</span>. On the right, the same data is exposed as a <span className="text-json">JSON document</span>. <strong>Click any name</strong> in either view to edit it, and watch the other side update instantly.
          </p>
          <JsonDualityWidget />
        </section>

        {/* ===== Cascading Updates Section ===== */}
        <section id="cascade">
          <h2 className="text-3xl font-bold leading-tight mt-14 mb-4">How cascading updates propagate</h2>
          <p className="text-muted-foreground mb-4">
            The real magic happens when data has <em>relationships</em>. In a duality view, updating a <span className="text-keyword">foreign key</span> in the relational side automatically restructures the JSON document.
          </p>
          <p className="text-muted-foreground mb-4">
            Play with the slider below. It controls the <span className="text-relational">department_id</span> of employee &quot;Alice&quot;. Watch how the JSON document restructures itself — the <span className="text-json">department</span> nested object changes, and the <span className="text-relational">relational row</span> updates simultaneously.
          </p>
          <CascadeWidget />
          <p className="text-muted-foreground mb-4">
            Notice how when you change the <code className="bg-white/5 px-1 rounded text-sm">dept_id</code> from <code className="bg-white/5 px-1 rounded text-sm">1</code> to <code className="bg-white/5 px-1 rounded text-sm">2</code>, the nested JSON object transforms from <span className="text-json">&quot;Engineering&quot;</span> to <span className="text-json">&quot;Marketing&quot;</span>. The database resolves the foreign key relationship and produces the correct document shape — no application code needed.
          </p>
        </section>

        {/* ===== Property Graphs Section ===== */}
        <section id="graphs">
          <h2 className="text-3xl font-bold leading-tight mt-14 mb-4">What are Property Graphs?</h2>
          <p className="text-muted-foreground mb-4">
            Some data is inherently about <em>connections</em>. Social networks, supply chains, fraud rings — these are best understood as <span className="text-graph">graphs</span> of entities linked by relationships.
          </p>
          <p className="text-muted-foreground mb-4">
            A <strong>property graph</strong> consists of <span className="text-graph">nodes</span> (entities) and <span className="text-graph">edges</span> (relationships). Both can carry <span className="text-keyword">properties</span> — key-value pairs. Oracle Database 23ai lets you define property graphs on your relational tables, querying them with the SQL/PGQ standard.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>Hover</strong> over any node to see its properties and highlight connections. <strong>Click</strong> to lock selection.
          </p>
          <PropertyGraphWidget />
          <p className="text-muted-foreground mb-4">
            Each <span className="text-graph">green node</span> is a Person, each <span className="text-destructive">red node</span> is a Movie, and each <span className="text-vector">purple node</span> is a Review. Edges encode relationships like <code className="bg-white/5 px-1 rounded text-sm">ACTED_IN</code>, <code className="bg-white/5 px-1 rounded text-sm">DIRECTED</code>, and <code className="bg-white/5 px-1 rounded text-sm">REVIEWS</code>.
          </p>
        </section>

        {/* ===== Vector Search Section ===== */}
        <section id="vectors">
          <h2 className="text-3xl font-bold leading-tight mt-14 mb-4">How does Similarity Search work?</h2>
          <p className="text-muted-foreground mb-4">
            Modern AI models convert text, images, and audio into <span className="text-vector">vectors</span> — arrays of numbers that capture <em>semantic meaning</em>. Similar things end up close together in vector space. Oracle Database 23ai stores these vectors and finds closest matches via <strong>similarity search</strong>.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>Click anywhere</strong> in the space to move the <span className="text-purple-400 font-bold">pink query point</span> and watch nearest neighbors update. Use the <strong>k slider</strong> to change how many neighbors to find.
          </p>
          <VectorSearchWidget />
          <p className="text-muted-foreground mb-4">
            Oracle supports multiple distance metrics: <span className="text-vector">Euclidean</span> (straight-line), <span className="text-vector">Cosine</span> (angular similarity), and <span className="text-vector">Dot Product</span> (direction + magnitude).
          </p>
        </section>

        {/* ===== HNSW Index Section ===== */}
        <section id="hnsw">
          <h2 className="text-3xl font-bold leading-tight mt-14 mb-4">Inside the HNSW Index</h2>
          <p className="text-muted-foreground mb-4">
            Brute-force similarity search checks every vector — that&apos;s O(n) and far too slow for millions of vectors. Oracle uses <span className="text-hnsw">HNSW</span> (Hierarchical Navigable Small World) indexes to achieve <span className="text-hnsw">O(log n)</span> approximate nearest neighbor search.
          </p>
          <p className="text-muted-foreground mb-4">
            HNSW builds a multi-layer graph. <strong>Layer 0</strong> contains all points with dense connections. Higher layers contain progressively fewer points with long-range &quot;highway&quot; connections. Searching starts at the top layer and greedily descends, narrowing candidates at each level.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>Add points</strong> one at a time to watch the index build itself. Then <strong>search</strong> to see the greedy walk traverse layers.
          </p>
          <HnswIndexWidget />
          <p className="text-muted-foreground mb-4">
            Notice how the search only visits a fraction of nodes compared to brute force. The hierarchical structure means query time grows logarithmically — making billion-scale vector search practical.
          </p>
        </section>

        {/* ===== RAG Pipeline Section ===== */}
        <section id="rag">
          <h2 className="text-3xl font-bold leading-tight mt-14 mb-4">The RAG Pipeline, demystified</h2>
          <p className="text-muted-foreground mb-4">
            <span className="text-rag">Retrieval-Augmented Generation</span> (RAG) is the dominant pattern for building AI applications that need factual, up-to-date answers. Instead of relying solely on the LLM&apos;s training data, RAG retrieves relevant documents and feeds them as context.
          </p>
          <p className="text-muted-foreground mb-4">
            Oracle Database 23ai runs the entire RAG pipeline in-database: <span className="text-vector">vector embeddings</span>, <span className="text-hnsw">similarity search</span>, and context assembly — all without data ever leaving the database. Type a question and watch each stage light up.
          </p>
          <RagPipelineWidget />
          <p className="text-muted-foreground mb-4">
            Each stage is clickable — freeze the pipeline at any point to inspect the intermediate data. This transparency is what makes Oracle&apos;s in-database RAG powerful: you can debug, audit, and optimize every step.
          </p>
        </section>

        {/* ===== ACID Section ===== */}
        <section id="acid">
          <h2 className="text-3xl font-bold leading-tight mt-14 mb-4">Why ACID matters for AI</h2>
          <p className="text-muted-foreground mb-4">
            Most vector databases sacrifice <span className="text-acid">ACID transactions</span> for speed. This works fine for demos — but in production, concurrent users reading and writing vectors creates real problems: <em>phantom reads</em>, <em>dirty reads</em>, and <em>lost updates</em>.
          </p>
          <p className="text-muted-foreground mb-4">
            Oracle Database 23ai provides full ACID guarantees on vector operations. Below, watch two concurrent users interact with the same data. On the left: Oracle&apos;s transactional consistency. On the right: what happens without it.
          </p>
          <AcidRaceWidget />
          <p className="text-muted-foreground mb-4">
            Try each scenario. The <span className="text-acid">anomalies</span> on the right aren&apos;t theoretical — they happen in production when vector data is modified during queries. Oracle&apos;s MVCC isolation ensures every read sees a consistent snapshot.
          </p>
        </section>

        {/* ===== ONNX In-DB Section ===== */}
        <section id="onnx">
          <h2 className="text-3xl font-bold leading-tight mt-14 mb-4">Neural Networks inside the Database</h2>
          <p className="text-muted-foreground mb-4">
            Traditionally, ML inference requires extracting data from the database, sending it to an external service, and writing predictions back. Oracle Database 23ai runs <span className="text-onnx">ONNX models directly inside the database</span> — data never leaves.
          </p>
          <p className="text-muted-foreground mb-4">
            This eliminates network latency, reduces security risk, and simplifies architecture. Toggle between <span className="text-onnx">in-database</span> and <span className="text-relational">traditional</span> modes to see the difference.
          </p>
          <OnnxInDbWidget />
          <p className="text-muted-foreground mb-4">
            In-database inference means your ML pipeline is a single SQL statement. No API calls, no serialization overhead, no data exposure — just <code className="bg-white/5 px-1 rounded text-sm">SELECT predict(model, features) FROM table</code>.
          </p>
        </section>

        {/* ===== JSON Path Section ===== */}
        <section id="jsonpath">
          <h2 className="text-3xl font-bold leading-tight mt-14 mb-4">SQL/JSON Path Expressions</h2>
          <p className="text-muted-foreground mb-4">
            Oracle Database 23ai supports the <span className="text-jsonpath">SQL/JSON path language</span> for querying nested JSON documents. Path expressions let you navigate objects, filter arrays, and extract values — all within SQL.
          </p>
          <p className="text-muted-foreground mb-4">
            Type a path expression in the input below and watch matching nodes <span className="text-jsonpath">light up</span> in real time. Try the pre-built examples to explore different path features.
          </p>
          <JsonPathWidget />
          <p className="text-muted-foreground mb-4">
            Path expressions combine with Oracle&apos;s JSON Duality Views — query the JSON shape of your relational data using powerful path syntax, with indexes accelerating the search. It&apos;s the best of both worlds.
          </p>
        </section>

        {/* ===== Conclusion ===== */}
        <section>
          <h2 className="text-3xl font-bold leading-tight mt-14 mb-4">The convergence advantage</h2>
          <p className="text-muted-foreground mb-4">
            What makes Oracle Database 23ai unique is that <span className="text-relational">relational</span>, <span className="text-json">JSON</span>, <span className="text-graph">graph</span>, and <span className="text-vector">vector</span> operations all happen in the <strong>same engine, on the same data</strong>. Add <span className="text-hnsw">HNSW indexing</span> for scale, <span className="text-rag">RAG pipelines</span> for AI applications, <span className="text-onnx">in-database ML inference</span> for simplicity, and <span className="text-acid">ACID transactions</span> for production reliability.
          </p>
          <p className="text-muted-foreground mb-4">
            This isn&apos;t just convenient — it&apos;s a fundamental architectural advantage. When your AI application needs to combine semantic search with structured filters, relationship traversals, and ML inference, Oracle 23ai handles it all natively, in a single SQL query, with full transactional guarantees.
          </p>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center font-extrabold text-white text-xs">O</div>
            <span className="font-semibold">Oracle Database 23ai</span>
          </div>
          <p className="text-muted-foreground text-sm mb-3">
            9 interactive explorations: JSON Duality Views, Cascading Updates, Property Graphs, Vector Search, HNSW Indexing, RAG Pipelines, ACID Transactions, In-Database ONNX, and SQL/JSON Path.
          </p>
          <p className="text-muted-foreground text-xs">
            Inspired by the visual style of educational technical blogs. Built with Next.js + React + TypeScript.
          </p>
        </div>
      </footer>
    </main>
  );
}
