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
- Manual gate tool selection, gate creation, gate hierarchy, boolean-gate scaffold, backgating/live-linking messaging, and live statistics.
- Axis controls for linear, log, logicle-like, and arcsinh transforms.
- Statistics table, CSV export, compensation matrix, spillover QC grid, spectral unmixing scaffold, high-dimensional cluster explorer scaffold, figure layout, reproducible pipeline view, workspace sharing surface, onboarding-ready empty/import states, and gated clinical-mode concept.

## Architecture choice

The blueprint recommends Tauri 2 plus a Rust/Arrow data core and optional Python scientific sidecar. This first pass keeps the app in vanilla HTML/CSS/JavaScript so it can be launched immediately from the folder while preserving a clean separation between:

- `app.js` application state, synthetic event generation, transforms, plot drawing, gate hierarchy, and export behavior.
- `styles.css` app design system and responsive macOS-style layout.
- `index.html` app shell.
- `blueprint-catalog.html`, `CytoStudio-Blueprint-and-Codex-Prompts.md`, and `prompts/` source product blueprint.

The next engineering step is to wrap this surface with Tauri and replace the synthetic/scaffolded science layers with validated Rust/Arrow and Python/R reference-backed implementations.

## Scaffolded, not scientifically validated yet

These areas are represented in the UI and state model but should not be treated as validated scientific or regulatory behavior:

- Full FCS 3.0/3.1 parsing, memory mapping, and raw spectral vendor formats.
- Reference-validated logicle/biexponential parity with `flowCore`.
- Million-event GPU/datashader rendering guarantees.
- Automated compensation from single-stain controls.
- NNLS spectral unmixing on real raw spectra.
- UMAP/t-SNE/FlowSOM numerical algorithms and reproducibility tests.
- GatingML / FlowJo / Cytobank round-trip interoperability.
- 21 CFR Part 11 or clinical compliance.

## Original blueprint package

The original docs-only landing page is preserved as `blueprint-catalog.html`. The prompt files remain in `prompts/` and the complete blueprint remains in `CytoStudio-Blueprint-and-Codex-Prompts.md`.
