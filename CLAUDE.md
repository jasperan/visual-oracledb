# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Interactive showcase website for Oracle AI Database features. Pure client-side static site (no backend, no DB connections) built with Next.js, deployed to GitHub Pages. Each Oracle feature gets its own self-contained widget component with animated visualizations.

## Commands

```bash
npm run dev        # Local dev server (http://localhost:3000)
npm run build      # Production static export to out/
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

No test framework is configured. Quality checks are `lint` + `typecheck`.

## Architecture

**Stack**: Next.js 16 (static export) + React 19 + TypeScript 5 + Tailwind CSS v4

**Layout**: Single-page app. `src/app/page.tsx` is the main page (`"use client"`) containing a hero section, sticky nav with anchor links, and 9 widget sections revealed on scroll via IntersectionObserver.

**Widgets** (`src/components/widgets/`): Each Oracle feature is an isolated React component with its own local state (useState/useEffect). No shared state management. All data is client-side (hardcoded or computed). Barrel-exported from `index.ts`.

The 9 widgets in display order:
1. **JsonDualityWidget** - Relational <-> JSON dual view with edit sync and role slider
2. **CascadeWidget** - Foreign key cascading updates
3. **PropertyGraphWidget** - Interactive node/edge graph
4. **VectorSearchWidget** - 3D similarity search with click-to-query (uses inverse projection)
5. **HnswIndexWidget** - Multi-layer hierarchical index
6. **RagPipelineWidget** - RAG pipeline stages with dynamic values per run
7. **AcidRaceWidget** - ACID vs non-transactional side-by-side
8. **OnnxInDbWidget** - In-database vs traditional ML inference latency
9. **JsonPathWidget** - SQL/JSON path query with live highlighting

**Styling**: Tailwind v4 with custom CSS color variables per widget theme (relational, json, graph, vector, rag, hnsw, onnx, acid, jsonpath). Google Fonts: Inter (body) + JetBrains Mono (code). Uses `clsx` + `tailwind-merge` for class composition.

## Deployment

GitHub Pages via `.github/workflows/deploy.yml`. Pushes to `main` trigger build + deploy automatically.

`next.config.ts` sets `basePath: "/visual-oracledb"` and `assetPrefix: "/visual-oracledb/"` in production. All asset references must work with this prefix. `output: "export"` produces a fully static `out/` directory.

## Adding a New Widget

1. Create `src/components/widgets/YourWidget.tsx` as a `"use client"` component
2. Export it from `src/components/widgets/index.ts`
3. Add a new section in `src/app/page.tsx` with an `id` for the anchor nav
4. Add the corresponding nav link and CSS color variable for the widget theme
