# CytoStudio

CytoStudio is a local-first prototype for a native-feeling macOS flow cytometry workspace. It is built from the sequenced blueprint prompts in `prompts/00` through `prompts/16`, with the current implementation focused on the product surface, interaction model, and data-flow scaffolding.

## Run

Open `index.html` directly, or run a small local server:

```bash
npm run start
```

Then visit `http://localhost:5178`.

## What is implemented now

- Three-pane macOS-style workspace with toolbar, sample rail, population hierarchy, canvas, inspector, and status bar.
- Dark/light appearance toggle, Command-K palette, keyboard shortcuts, drag-drop import scaffold, and persisted appearance state.
- Synthetic cytometry event model with scatter, density, histogram, and UMAP-style plot tiles drawn on canvas.
- Local FCS 3.0/3.1 parser for standard list-mode numeric files, including header/TEXT parsing, keywords, parameter labels, common integer/float event payloads, spillover, escaped delimiters, max-event limits, big-endian integer fixtures, and a public Bioconductor FCS3.0 regression fixture.
- Worker-backed FCS import path parses dropped files off the UI thread when served locally, with streamed byte-level progress, event-level parse progress, cancellation, direct parser fallback for constrained contexts, and metadata-only preflight for oversized files.
- Experiment browser supports sample grouping by dragging one sample onto another sample's group.
- Manual gate tool selection, direct plot drawing for drag gates and click-to-place polygon gates, direct SVG handle editing/nudging, inspector rename/recolor, gate hierarchy, computed AND/OR/NOT boolean gates, backgating/live-linking messaging, and live statistics.
- Gate geometry evaluation for rectangle, polygon/lasso, ellipse, quadrant, and histogram interval gates, with recursive parent-to-child population counts based on active sample events.
- Selecting a child population now backgates it onto ancestor plots with highlighted event positions and rug marks.
- Shared axis transform module for linear, log, logicle / biexponential, and arcsinh transforms, with inspector controls for log floor, transform width, arcsinh cofactor, auto-tuned defaults from the active parameter range/event preview, and scale-aware axis ticks.
- Histograms now bin active event data through the selected axis transform instead of drawing fixed placeholder curves.
- Statistics table, CSV export, compensation matrix, spillover QC grid, spectral unmixing scaffold, high-dimensional cluster explorer scaffold, figure layout, reproducible pipeline view, workspace sharing surface, onboarding-ready empty/import states, and gated clinical-mode concept.
- Live population statistics include count, % parent, % total, median, mean, geometric mean, robust CV, percentiles, a configurable/sortable table editor with population rows or samples-as-rows pivoting, CSV/Excel-compatible export, clipboard copy, and a CD4/CD8 derived-parameter workflow.
- Compensation matrix edits apply to the active event stream, can be assigned to a sample/group/workspace scope, parse embedded spillover keywords when present, support import and single-stain-fit proof workflows, and drive the N-by-N spillover QC grid.
- Spectral data proof loading, reference signature import/build workflows, autofluorescence modeling, quality warnings, least-squares-style review metadata, and reviewable unmixing create named fluorophore and residual parameters for plots and statistics.
- Gating templates can be saved from the active hierarchy, applied across a sample group, reviewed as small multiples, tailored per sample, and recomputed into a combined batch statistics table.
- High-dimensional analysis can run a sampled reproducible UMAP/t-SNE-style embedding, assign FlowSOM/graph-style clusters, color by marker, inspect a cluster heatmap, compare samples, and backgate a selected cluster into the population tree.
- Figure layout editor supports live linked plot tiles, labels, arrows, inset plots, snapping/alignment controls, appearance controls, template saving, and browser-native export proofs.
- Pipeline view supports timeline stepping, replay recording, report proof generation, pipeline JSON, gated FCS proof, event CSV/Parquet proof, statistics Excel-compatible export, and GatingML proof export.
- Workspace sharing view saves raw-data-referencing workspace JSON, autosaves recovery state, exports share packages, records audit/change logs, and provides GatingML/FlowJo/Cytobank import proof actions.
- Onboarding overlay, bundled conventional/spectral sample launch paths, coach marks, keyboard cheat sheet, high-contrast mode, and direct shortcuts support first-run exploration and accessibility.
- Optional clinical mode remains off by default and adds role configuration, locked/finalized analysis state, electronic signature proof, immutable audit preview, retention/access settings, and compliance export proof without making validation claims.

## Architecture choice

The blueprint recommends Tauri 2 plus a Rust/Arrow data core and optional Python scientific sidecar. This first pass keeps the app in vanilla HTML/CSS/JavaScript so it can be launched immediately from the folder while preserving a clean separation between:

- `app.js` application state, synthetic event generation, import wiring, plot drawing, gate hierarchy, and export behavior.
- `fcs-core.js` FCS parsing and cytometry transform helpers, usable in both browser and Node tests.
- `fcs-import-worker.js` worker adapter for off-main-thread FCS parsing.
- `docs/fcs-large-file-strategy.md` explicit browser-prototype boundary and native memory-map handoff plan.
- `tests/fixtures/public/flowWorkspaceData/manifest.json` provenance for the curated public FCS fixture from Bioconductor `flowWorkspaceData` (GPL-2).
- `styles.css` app design system and responsive macOS-style layout.
- `index.html` app shell.
- `blueprint-catalog.html`, `CytoStudio-Blueprint-and-Codex-Prompts.md`, and `prompts/` source product blueprint.

The next engineering step is to wrap this surface with Tauri and replace the synthetic/scaffolded science layers with validated Rust/Arrow and Python/R reference-backed implementations.

## Scaffolded, not scientifically validated yet

These areas are represented in the UI and state model but should not be treated as validated scientific or regulatory behavior:

- Complete FCS edge-case coverage beyond the current curated public fixture, production memory mapping, and raw spectral vendor formats.
- Reference-validated biexponential/logicle parity with `flowCore` and canonical tick semantics.
- Million-event GPU/datashader rendering guarantees and optimized incremental gate recomputation.
- Full drag-and-drop table-builder UX, samples-as-rows pivoting, and native Excel export.
- Validated compensation fitting from single-stain controls beyond the current reviewable proof workflow.
- Validated NNLS spectral unmixing on real raw spectra and vendor-specific spectral imports.
- Durable reusable template files, robust per-sample gate editing, group assignment UX, and large-study batch recomputation.
- Validated UMAP/t-SNE/FlowSOM numerical algorithms, graph community detection, worker-backed execution, and reproducibility tests.
- High-fidelity PDF/TIFF/vector export, full drag-resize handles, print color management, and per-plot export packaging.
- Validated PDF generation, binary FCS writing, Parquet/Excel writers, GatingML conformance, and FlowJo / Cytobank round-trip interoperability.
- Robust native open/save dialogs, file locks, conflict resolution, real shared-location sync, and production FlowJo/Cytobank migration tooling.
- Full VoiceOver audit, formal color-contrast certification, and large-file memory/performance profiling on production datasets.
- 21 CFR Part 11 validation, lab SOP/legal review, production authentication, validated e-signatures, retention enforcement, and clinical compliance.

## Original blueprint package

The original docs-only landing page is preserved as `blueprint-catalog.html`. The prompt files remain in `prompts/` and the complete blueprint remains in `CytoStudio-Blueprint-and-Codex-Prompts.md`.
