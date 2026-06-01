# CytoStudio Build Audit

This audit maps the current prototype to the requested prompt sequence. The app is now a runnable local-first product prototype, not merely the original blueprint catalog. Science-heavy and regulatory capabilities are represented as UI/state scaffolds until real reference data, engines, and validation suites are added.

## Current evidence

- Git repository initialized and committed: `b599ea8 Initial CytoStudio prototype`.
- App entrypoint: `index.html`.
- Application logic: `app.js`.
- Design system: `styles.css`.
- Original blueprint preserved: `blueprint-catalog.html`, `CytoStudio-Blueprint-and-Codex-Prompts.md`, and `prompts/`.
- Visual concept asset: `assets/design/cytostudio-workspace-concept.png`.
- Verification performed: JavaScript syntax check, local HTTP 200 check, Playwright desktop/mobile screenshots, Command-K check, tab-surface checks, and mobile overflow check.

## Prompt-by-prompt status

| Prompt | Status | Evidence / current behavior |
|---|---|---|
| 00 Vision / guardrails | Prototype complete | Three-pane app shell, state store, README architecture choice, light/dark support. Tauri/Rust/Arrow are documented next steps. |
| 01 Shell / navigation / design system | Prototype complete | Left sample rail, population tree, center canvas, inspector, toolbar, status bar, Command-K, responsive layout, persisted theme. Panel resizing/collapse is only lightly scaffolded. |
| 02 FCS import / experiment manager | Scaffolded | Drag-drop import progress, sample model, metadata inspector data, grouping labels. Real FCS parsing and large-file memory behavior remain next-step engine work. |
| 03 Transforms / scaling | Prototype partial | Linear, log, arcsinh, and logicle-like transforms drive plotted values and inspector controls. Reference parity with `flowCore` is not validated. |
| 04 Plot canvas | Prototype complete | Canvas scatter, density, histogram, UMAP-style plots, legends, overlays, zoom gesture capture, publication-style chrome. GPU/datashader-scale rendering is not yet implemented. |
| 05 Manual gating | Prototype partial | Toolbar tools, gate creation, polygon/quadrant/interval overlays, labels, hierarchy updates, keyboard nudge feedback. Full vertex editing and robust boolean geometry remain. |
| 06 Hierarchy / live-linking / backgating | Prototype partial | Gate tree, child population creation, selection-linked inspector/stat updates, backgating/livelink UX. True million-event recomputation remains engine work. |
| 07 Statistics / table | Prototype complete | Inspector counts, percent parent/total, MFI-style fields, reporting table, derived-parameter action scaffold, CSV export. Excel export remains. |
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

The best next build slice is Prompt 02 plus Prompt 03 as a real data foundation: add a tested FCS parser adapter, fixture FCS files, metadata extraction, and reference-backed transform tests. That would turn the current convincing prototype into the start of a scientifically trustworthy application.
