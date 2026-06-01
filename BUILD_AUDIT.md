# CytoStudio Build Audit

This audit maps the current prototype to the requested prompt sequence. The app is now a runnable local-first product prototype, not merely the original blueprint catalog. Science-heavy and regulatory capabilities are represented as UI/state scaffolds until real reference data, engines, and validation suites are added.

## Current evidence

- Git repository initialized and committed: `b599ea8 Initial CytoStudio prototype`.
- App entrypoint: `index.html`.
- Application logic: `app.js`.
- Design system: `styles.css`.
- Original blueprint preserved: `blueprint-catalog.html`, `CytoStudio-Blueprint-and-Codex-Prompts.md`, and `prompts/`.
- Visual concept asset: `assets/design/cytostudio-workspace-concept.png`.
- FCS foundation: `fcs-core.js` plus `tests/fcs-core.test.cjs`.
- Verification performed: JavaScript syntax check, local HTTP 200 check, Playwright desktop/mobile screenshots, Command-K check, tab-surface checks, and mobile overflow check.

## Prompt-by-prompt status

| Prompt | Status | Evidence / current behavior |
|---|---|---|
| 00 Vision / guardrails | Prototype complete | Three-pane app shell, state store, README architecture choice, light/dark support. Tauri/Rust/Arrow are documented next steps. |
| 01 Shell / navigation / design system | Prototype complete | Left sample rail, population tree, center canvas, inspector, toolbar, status bar, Command-K, responsive layout, persisted theme. Panel resizing/collapse is only lightly scaffolded. |
| 02 FCS import / experiment manager | Prototype partial | Drag-drop and file-picker imports now parse FCS 3.0/3.1 header/TEXT metadata, parameter labels, common numeric event data, keyword counts, and sampled events through `fcs-core.js`. Large-file memory mapping, worker import, grouping drag-drop, and broad fixture coverage remain. |
| 03 Transforms / scaling | Prototype partial | Linear, log, arcsinh, and logicle-like transforms now live in shared tested code, expose per-axis floor/width/cofactor controls, drive scatter/density normalization, and bin histograms from active event data. Reference parity with `flowCore`, canonical tick semantics, and auto-default tuning remain. |
| 04 Plot canvas | Prototype complete | Canvas scatter, density, histogram, UMAP-style plots, legends, overlays, zoom gesture capture, publication-style chrome. GPU/datashader-scale rendering is not yet implemented. |
| 05 Manual gating | Prototype partial | Toolbar tools, gate creation, rectangle/polygon/lasso/ellipse/quadrant/interval overlays, labels, hierarchy updates, keyboard nudge feedback, and normalized gate geometry evaluation. Full vertex editing and robust boolean geometry remain. |
| 06 Hierarchy / live-linking / backgating | Prototype partial | Gate tree, child population creation, recursive parent-filtered population counts, sample-aware stats, selection-linked inspector/table updates, and live gate-label refresh are implemented for sampled events. True million-event incremental recomputation and visual backgate overlays remain engine work. |
| 07 Statistics / table | Prototype partial | Inspector and table statistics now compute from gated event subsets: count, % parent, % total, median, mean, geometric mean, robust CV, percentiles, CSV export, clipboard copy, and a CD4/CD8 derived parameter. Full drag-and-drop table builder, samples-as-rows pivot, sorting, and native Excel export remain. |
| 08 Compensation / spillover QC | Scaffolded | Editable compensation matrix surface, apply action, N-by-N spillover QC mini-plots. Auto-comp from controls remains unvalidated. |
| 09 Spectral unmixing | Scaffolded | Reference library, autofluorescence, signature curves, colinearity warning, NNLS action surface. Real spectral ingest/unmixing remains. |
| 10 Templates / batch | Scaffolded | Hierarchy/template language and combined statistics are present; batch review needs a dedicated view in the next pass. |
| 11 High-dimensional / cluster explorer | Scaffolded | UMAP/t-SNE/FlowSOM surface, reproducible seed, parameter list, cluster heatmap, run/cancel/gate actions. Real algorithms remain. |
| 12 Figure editor | Prototype partial | Multi-panel publication figure canvas and export/template actions. High-fidelity vector/PDF/TIFF export remains. |
| 13 Pipeline / reports / export | Prototype partial | Ordered pipeline history, replay/export/report actions, CSV export. Gated FCS, GatingML, and report generation remain. |
| 14 Collaboration / workspace / interop | Scaffolded | Workspace save/open/share UI, hash-reference policy, autosave/audit language. GatingML/FlowJo/Cytobank round-trip remains. |
| 15 Onboarding / accessibility / polish | Prototype partial | Drop zone, sample data, tooltips/titles, keyboard Command-K, mobile responsive pass, color-separated plots. Full VoiceOver QA remains. |
| 16 Clinical / compliance | Scaffolded | Gated clinical-mode surface, lock/e-sign/audit checklist, explicit no-compliance-claim warning. Validation/legal review remains. |

## Next best slice

The best next build slice is to deepen Prompt 02 into a robust import pipeline: move parsing into a worker, add cancellation and byte/event progress, collect real public FCS fixtures, and expand compatibility tests for spillover keywords, mixed byte orders, integer bit widths, and large files.
