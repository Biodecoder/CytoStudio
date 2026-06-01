# CytoStudio — Blueprint & Codex Build Prompts

*A native macOS flow cytometry application that fuses the gating workspace of FlowJo, the live-linked publication visualization of FCS Express, and the high-dimensional + collaborative analysis of Cytobank.*

> "CytoStudio" is a placeholder name — rename freely. Primary user: mixed (bench researchers, core facilities, clinical labs). v1 priority order: (1) manual gating + polished UI, (2) high-dimensional / spectral, (3) auto-gating / ML clustering.

---

## 1. Product north star (first principles)

Strip flow cytometry to its physics and the software's job becomes obvious. Cells flow single-file past lasers; each cell scatters light and re-emits fluorescence from bound antibody–fluorophore conjugates; detectors turn that into numbers. So **one cell = one row of numbers (an "event"), one detector = one column (a "parameter"), one sample = a table** of up to tens of millions of rows by dozens of columns. An `.fcs` file is that table plus metadata.

Everything the software does is a verb applied to that table:

1. **Read** the table (FCS 3.0/3.1, and raw spectral data).
2. **Transform** the numbers so populations become visually separable (because fluorescence spans ~5 decades *and* goes negative after spillover correction, plain log fails — you need logicle/biexponential/arcsinh).
3. **Show** it as 2D scatter, 1D histograms, density/contour plots, and high-dimensional embeddings.
4. **Gate** — let users draw regions that carve the table into a *hierarchy* of sub-populations. This is the core, most-repeated interaction; it must feel effortless.
5. **Correct spillover** — compensation (matrix subtraction) for conventional cytometry, full-spectrum unmixing for spectral.
6. **Quantify** — count populations, compute statistics (%parent, %total, MFI, medians), export tables.
7. **Scale** — apply one gating scheme across hundreds of samples, then review and adjust per sample.
8. **Communicate** — assemble figures, export publication graphics, share, and keep a reproducible record.

**The thesis:** no single competitor nails all eight. FlowJo owns gating organization but feels dated and slow on big data. FCS Express owns live-linked visualization and clinical polish but is Windows-first. Cytobank owns high-dim algorithms and collaboration but is browser-bound and feels remote. **CytoStudio wins by being the only tool that is native-fast, beautiful on macOS, live-linked end-to-end, and high-dim-native — with gating that feels like a drawing app, not a database.**

---

## 2. Feature synthesis — what to take from each

| Capability | FlowJo (take this) | FCS Express (take this) | Cytobank (take this) | CytoStudio's version |
|---|---|---|---|---|
| Gating organization | Population hierarchy tree; drag gates between samples; gating templates | — | Experiment-centric grouping | Hierarchy tree **+** template-per-sample-group, both first-class |
| Live updates | Recompute on demand | **Move a gate → every dependent plot + stat updates instantly** | — | Instant live-linking everywhere (the headline feel) |
| Visualization quality | Adequate | **Publication-grade plots, overlays, heat maps, picture-in-picture** | Good web charts | Publication-grade *and* GPU-fast on millions of events |
| Figure assembly | Layout editor | **Best-in-class layout, animations, tokens** | Illustrations | Freeform layout canvas with live data tiles |
| High-dimensional | Plugins (FlowSOM, t-SNE) | Some | **viSNE, SPADE, CITRUS, FlowSOM built-in** | UMAP / t-SNE / FlowSOM native, cluster explorer, marker heatmaps |
| Spectral | Limited | Some | Emerging | Full-spectrum unmixing as a core, not a bolt-on |
| Compensation | Matrix editor | Strong | Auto | Visual matrix editor + N×N QC + AutoSpill-style auto-comp |
| Batch / automation | Workspace apply-to-all | **Token/pipeline automation** | Reproducible compute | Reproducible pipeline log replayable across samples |
| Collaboration | File-based | File-based | **Cloud share, audit trail** | Shareable workspace files + optional cloud sync + audit log |
| Compliance | — | **21 CFR Part 11** | Audit trails | Optional clinical mode with e-signatures + audit (gated) |
| Statistics export | Tables editor | Spreadsheet view | Equalizer | Spreadsheet-style table editor with drag-in stats |

---

## 3. Architecture & open-source libraries (guidance, not gospel)

> These prompts deliberately let Codex choose *how* to build. This section is **recommendation and rationale** so Codex starts from a sane foundation rather than reinventing solved problems. Treat it as defaults to deviate from with reason.

### 3.1 Recommended shape

- **App shell:** Tauri 2 (Rust core + web UI) for a small, fast, native-feeling macOS binary. *Alternative if you want maximum Mac-native polish and can afford to reimplement science:* SwiftUI + Metal.
- **Data engine (Rust):** FCS 3.0/3.1 + raw-spectral parsing; columnar in-memory store (Apache Arrow) with memory-mapping for files too big for RAM; transforms (logicle/biexponential/arcsinh/hyperlog); compensation math; gate evaluation (point-in-polygon, boolean ops). Arrow enables zero-copy hand-off to Python.
- **GPU rendering:** WebGPU/WebGL2 (`regl` / `deck.gl`) or `wgpu` to draw millions of points as density-shaded scatter at 60 fps; server-side aggregation (datashader-style binning) for the largest files so the UI never plots raw megapoints.
- **UI:** TypeScript + a reactive component framework, styled to Apple HIG. A single reactive state store keeps **gates ↔ plots ↔ stats** in lockstep (this is what makes live-linking feel magical).
- **Science sidecar (Python), bundled:** the heavy algorithms via the mature ecosystem; talks to Rust over Arrow IPC / a local socket.

### 3.2 Open-source libraries to lean on

**FCS parsing / reference behavior**
- `flowio` (pure-Python FCS reader), `fcsparser` (Python) — use as ground truth while building the Rust parser; `fcs` (npm) for any JS-side reads.

**Canonical analysis stack (R/Bioconductor)** — reference these for *correct* transform/gating math
- `flowCore`, `flowWorkspace`, `openCyto` (automated gating), `ggcyto` (plotting grammar), `CytoML` (GatingML / FlowJo / Cytobank interchange), `flowStats`, `flowClust`.

**Quality control**
- `flowAI`, `PeacoQC`, `flowCut` — anomaly/flow-rate QC patterns to replicate.

**High-dimensional**
- `FlowSOM` (R + Python ports), `openTSNE`, `umap-learn`, `PaCMAP`, `EmbedSOM`, `PhenoGraph` (community detection via `leidenalg` / `python-louvain`), `ConsensusClusterPlus`.

**Spillover / spectral**
- `scipy` NNLS for unmixing; `AutoSpill` (open algorithm) for automated compensation; spectral-signature least-squares.

**Transforms**
- Logicle reference implementation (Moore & Parks); `flowCore::logicleTransform`; arcsinh for CyTOF/spectral.

**Plotting at scale**
- `datashader` (aggregate millions → image), `deck.gl` / `regl` (GPU scatter), `holoviews`, `plotly` scattergl.

**Interchange / standards**
- ISAC **GatingML 2.0**, FCS 3.1 spec, `CytoML` for round-tripping with FlowJo/Cytobank.

**Rust building blocks**
- `arrow`/`arrow2`, `polars` (fast columnar ops), `wgpu` (GPU), `tauri`.

### 3.3 Core data model (conceptual)

- **Experiment** → contains **Samples** (one per FCS file) grouped into **Groups** (e.g., conditions/timepoints).
- **Sample** → an Arrow table of events × parameters + keyword metadata + a per-sample **compensation/unmixing matrix** + a transform set.
- **Gate** → a geometry (rect/poly/ellipse/interval/quadrant/boolean/auto) bound to a parameter pair, owning a **parent** gate (forms the hierarchy). Gates can be **global** (shared definition) or **tailored** (overridden per sample).
- **Population** = the set of events passing a gate's full ancestry. Statistics are computed against populations.
- **Pipeline** = the ordered, replayable list of every transform/comp/gate/derived-parameter action (Cytobank-style reproducibility).
- **Workspace file** = JSON describing experiment + pipeline + layouts, referencing FCS files by path/hash (never duplicating raw data).

---

## 4. UI/UX design language & layout

### 4.1 The flagship screen — three-pane workspace

```
┌───────────────────────────────────────────────────────────────────────────┐
│ ◉ ◉ ◉   CytoStudio — PBMC Panel        [▮ Pointer ▭ ▱ ◯ ⊞ ⋔]  Comp ▾  Unmix │  ← toolbar: gate tools + transform/comp
├───────────────┬───────────────────────────────────────────┬───────────────┤
│ SAMPLES       │                CANVAS                     │ INSPECTOR     │
│  • Donor1.fcs │   ┌──────────────┐    ┌──────────────┐    │ Plot          │
│  • Donor2.fcs │   │ FSC-A/SSC-A  │    │ CD4 / CD8     │    │  X: CD4 ▾     │
│  • Donor3.fcs │   │   ▢ Cells     │    │  ⊞ quadrants  │    │  Y: CD8 ▾     │
│               │   └──────────────┘    └──────────────┘    │  Scale: Logicle│
│ HIERARCHY     │   ┌──────────────┐    ┌──────────────┐    │ Population    │
│  Cells        │   │ CD3 hist      │    │ UMAP overlay  │    │  CD4+  42.1% │
│   └ Single    │   └──────────────┘    └──────────────┘    │  events 81,344│
│     └ Live    │                                           │  MFI 2,140    │
│       └ CD3+  │                                           │               │
│         ├CD4+ │                                           │  [+ add stat] │
│         └CD8+ │                                           │               │
├───────────────┴───────────────────────────────────────────┴───────────────┤
│ 2,481,019 events · gating template: "T-cell panel" · live-linked ✓          │  ← status bar
└───────────────────────────────────────────────────────────────────────────┘
```

- **Left rail (split):** top = sample/experiment browser with groups; bottom = the **population hierarchy tree** (the FlowJo idea, modernized). Selecting a population filters every plot to that subset.
- **Center canvas:** a freeform grid of linked plots. Plots are the hero; chrome recedes. Drawing a gate here instantly spawns its child population in the tree and updates all dependent tiles.
- **Right inspector:** context-sensitive — plot properties (axes, scale, color-by, overlays) and **live statistics** for the selected population. Drag a stat into the table editor.
- **Toolbar:** gate tools (pointer, rectangle, polygon, ellipse, quadrant, interval, freehand, boolean), plus transform, compensation, and unmixing entry points.

### 4.2 Design language

- Native macOS: SF Pro typography, system materials/translucency, full light + dark mode, vibrancy in sidebars, proper window/traffic-light behavior, trackpad gestures (pinch-zoom plots, two-finger pan).
- **Identity color: cytometry teal/cyan** (a signal/laser feel) used sparingly as accent — *not* the default system blue, so the app has a recognizable face. Plots use perceptually-uniform density colormaps (viridis-like) by default with classic rainbow available.
- Chrome is quiet and monochrome; **all saturated color lives inside the data**. Generous whitespace, hairline separators, no skeuomorphism.
- Motion is functional: gates animate their fill on creation; stats count up on change; nothing bounces gratuitously.

### 4.3 Signature interactions

- **Live-linking:** drag any gate vertex → dependent plots, child gates, and every statistic recompute in real time.
- **Backgating:** select a leaf population → "show in parent" highlights exactly where those cells sit in any ancestor plot.
- **Tailoring:** a global gate can be nudged on a single sample without breaking the template; tailored samples are badged.
- **Drag-to-overlay:** drop one population onto another plot to overlay histograms/contours for comparison.
- **Spotlight-style command bar** (⌘K): jump to any sample, gate, parameter, or action.

---

## 5. OpenAI Imagegen asset prompts (run these in the image generator)

**Shared style anchor — prepend or keep consistent across every asset:**

> *Style: clean, modern, native-macOS aesthetic. Flat with soft depth, generous negative space, rounded geometry. Cool palette of deep charcoal, off-white, and a single signature teal-cyan accent (laser/signal feel). Subtle perceptually-uniform color gradients reminiscent of fluorescence density plots. Crisp, premium, scientific-but-friendly. No text unless specified, no clutter, no stock-photo realism, no hard drop shadows.*

1. **App icon (macOS):** "A macOS app icon on the standard rounded-square (squircle) canvas. A stylized cluster of glowing cells flowing single-file through a thin beam of teal-cyan light, rendered as soft luminous dots forming a subtle density gradient from cool to warm. Minimal, iconic, instantly legible at small sizes. Centered, balanced, premium."
2. **Welcome / onboarding hero:** "A wide hero illustration for an app welcome screen: an abstract, elegant flow-cytometry scatter plot where thousands of tiny points bloom into distinct glowing clusters, a faint laser line crossing the field. Inviting, spacious, optimistic, lots of dark negative space with teal-cyan highlights."
3. **Empty state — no samples loaded:** "A friendly minimal illustration: an empty translucent sample tube / data card with a faint dotted outline and a single cyan plus-sign glow, suggesting 'drag your FCS files here.' Calm, uncluttered, plenty of breathing room."
4. **Empty state — no gates yet:** "A minimal illustration of a soft scatter-plot cloud with a dashed lasso about to encircle a cluster of points, hinting at the act of drawing a gate. Light, instructional, gentle teal accent."
5. **Processing / unmixing animation frame:** "An abstract loop-friendly illustration of overlapping colored spectral curves separating into clean distinct bands, conveying spectral unmixing. Smooth, scientific, luminous, dark background, teal-to-warm gradient."
6. **High-dimensional motif:** "An abstract UMAP/t-SNE-style embedding: organic islands of densely packed glowing points in different hues drifting across a dark field, suggesting cell populations in high-dimensional space. Beautiful, painterly-but-precise."
7. **About / splash banner:** "A premium horizontal splash banner: the signature single-file stream of luminous cells crossing a teal laser, dissolving on the right into a galaxy of clustered data points. Cinematic, minimal, brandable, room for a wordmark on the left."
8. **Feature spot set (generate as a matched series):** small square illustrations, same style, for: *gating* (a lasso around a cluster), *compensation* (a tilted grid straightening), *statistics* (glowing bars/percentages emerging from a cell cloud), *collaboration* (two overlapping data fields merging), *reports* (a tidy figure sheet of mini-plots).

*Tip for the generator:* request a 1024×1024 master for the icon, ask for transparent or solid-charcoal backgrounds explicitly, and generate the feature-spot set in one batch with the shared style block to keep them visually consistent.

---

## 6. Codex build prompts (the deliverable)

**How to use these:** feed **Prompt 0 first** to set context, then run the rest roughly in order (Section 7 has the dependency map). Each prompt is written in plain product language — *what* to build and *how it should behave/feel* — and intentionally leaves implementation choices to Codex. Each ends with user-facing acceptance criteria. Paste one prompt per task/PR.

---

### Prompt 0 — Vision, scope & guardrails (run first)

> You are building **CytoStudio**, a native-feeling macOS desktop application for flow cytometry analysis. Its mission is to combine the best of three existing tools: the population-hierarchy gating workspace and "apply one gating scheme to many samples" model of FlowJo; the live-linked, publication-quality visualization and figure-layout craft of FCS Express; and the high-dimensional analysis (UMAP/t-SNE/FlowSOM) plus collaboration and reproducibility of Cytobank.
>
> Non-negotiable qualities, in priority order: (1) **manual gating must feel as fluid as a drawing app**, with everything live-linked so adjusting a gate instantly updates every dependent plot and statistic; (2) it must stay **fast and responsive on samples with millions of events**; (3) it must look and behave like a **first-class macOS app** (light/dark mode, system fonts, trackpad gestures, native window behavior); (4) it must eventually handle **spectral / high-parameter data** and **automated clustering**.
>
> You choose the languages, frameworks, and libraries — pick whatever best delivers native macOS polish *and* the performance to render millions of points smoothly, while letting you reuse the mature scientific cytometry ecosystem for correct math (transforms, compensation, clustering) rather than reinventing it. Favor a clean separation between a fast data/rendering core and the scientific algorithms.
>
> Set up the project skeleton, a component/design-system foundation themed to Apple's Human Interface Guidelines with a signature teal-cyan accent, app-wide light/dark support, and a placeholder three-pane window (left sidebar, center canvas, right inspector, top toolbar, bottom status bar). Establish a single source of truth for application state so that data, gates, plots, and statistics can all stay synchronized automatically. Deliver a running, empty app I can launch. Document your stack choices and why in a README.
>
> **Done when:** the app launches on macOS, shows the three-pane shell in both light and dark mode, the window behaves natively, and the README explains the architecture and how to run it.

---

### Prompt 1 — App shell, navigation & design system

> Flesh out the application shell and design system. Build the three-pane workspace: a left rail that splits into a **sample/experiment browser** (top) and a **population hierarchy tree** (bottom); a **center canvas** that will hold a freeform arrangement of plots; a **right inspector** that shows context-sensitive properties and statistics; a **top toolbar** for tools and actions; and a **bottom status bar** showing total event count and workspace status.
>
> The chrome should be quiet and monochrome so that all color lives inside the data later. Add full keyboard navigation, a **⌘K command palette** to jump to any sample/gate/parameter/action, standard macOS menus, and trackpad gestures wired up as no-ops for now (pinch, two-finger pan) so plots can adopt them later. Panels should be resizable and collapsible; the layout state should persist between launches.
>
> **Done when:** I can resize/collapse panels, the layout persists across relaunch, the command palette opens with ⌘K and can focus each region, and the whole thing feels like a native Mac app in both appearance modes.

---

### Prompt 2 — FCS import, metadata & experiment manager

> Implement loading of cytometry data files (FCS 3.0 and 3.1 to start; structure it so raw spectral formats can be added later). The user can drag-and-drop files or folders, or open them via the menu. On import, read every event and every parameter, plus the file's embedded metadata (keywords) such as the parameter names, detector/fluorophore labels, instrument, operator, acquisition date, and any existing compensation matrix stored in the file.
>
> Organize files into an **Experiment** containing **Samples**, with the ability to group samples (e.g., by condition or timepoint) by drag-and-drop in the left browser. Show each sample's key metadata in the inspector when selected. Display friendly parameter names (the marker/fluorophore label) everywhere, while keeping the raw channel name available. Handle large files gracefully — show progress, never freeze the UI, and be ready to work with files too big to hold fully in memory.
>
> **Done when:** I can drag in multiple FCS files, see them listed and groupable, inspect each sample's metadata and parameter list with human-readable marker names, and large files import with visible progress and no UI freeze.

---

### Prompt 3 — Data transforms & per-axis scaling

> Add the data transforms that make populations visually separable. Because fluorescence intensity spans several orders of magnitude *and* can become negative after spillover correction, a plain logarithmic scale is inadequate. Implement the standard cytometry scales: **biexponential / logicle** (linear near zero, logarithmic far from it), **arcsinh** (for high-parameter and spectral data), plain **log**, and **linear**. Match the established, validated behavior of these transforms used across the field — correctness matters because biologists make gating decisions on these axes.
>
> Each plot axis can independently choose its scale and adjust the relevant parameters (e.g., the width/linear-region of a biexponential, the cofactor of an arcsinh) via simple, well-labeled controls in the inspector, with sensible auto-computed defaults per parameter. Provide an obvious "reset to default scaling" action. Changing a scale must update the plot live.
>
> **Done when:** I can switch any axis between linear, log, biexponential/logicle, and arcsinh; negative post-compensation values display correctly; defaults look reasonable automatically; and adjustments update the view instantly.

---

### Prompt 4 — The plot canvas (the visual heart)

> Build the plotting system — this is where the app earns its reputation, so it must be both **beautiful** and **fast on millions of events**. Support these plot types: **2D scatter (dot) plot**, **density plot** (color-mapped by event density), **contour plot**, **pseudocolor**, **zebra/contour hybrids**, and **1D histograms**. Default to a perceptually-uniform density colormap with classic alternatives available.
>
> Plots live on the center canvas in a freeform, rearrangeable grid; the user can add a plot, pick its X and Y parameters (X only for histograms), resize and move it, and zoom/pan it (including trackpad pinch and two-finger pan). For very large samples, render so the app stays at a smooth frame rate — aggregate or down-represent points as needed so the experience never stutters, while still looking like real data. Support **overlays**: dropping one population's data onto a plot overlays it as a tinted contour or histogram for direct comparison, with a clear legend. Axes show human-readable marker names and the chosen scale.
>
> **Done when:** I can create scatter/density/contour/histogram plots, choose parameters, rearrange and zoom them fluidly even with millions of events, overlay multiple populations with a legend, and everything looks publication-clean.

---

### Prompt 5 — Manual gating tools & drawing UX

> Implement manual gating — the most-used interaction — so it feels like a precise, forgiving drawing app. Provide these gate tools in the toolbar: **rectangle**, **polygon** (click to place vertices, double-click/enter to close), **ellipse**, **quadrant** (splits a plot into four by a draggable crosshair), **interval** (a range gate on a histogram), and **freehand/spline lasso**. Also support **boolean gates** (AND / OR / NOT combinations of existing gates).
>
> Drawing mechanics: gates are drawn directly on a plot; vertices and edges are draggable after creation; the whole gate can be moved or resized; gates can be renamed inline and recolored. Snapping and nudge-with-arrow-keys help precision. Each gate visibly animates its fill on creation and shows its population's percentage right on the plot. Every gate is bound to the plot's two parameters, so a gate "means" a region in that 2D space.
>
> **Done when:** I can draw and edit every gate type directly on plots, drag vertices to reshape, create boolean gates from existing ones, rename/recolor them, and each gate shows its population percentage on the plot.

---

### Prompt 6 — Population hierarchy, live-linking & backgating

> Connect gates into a **population hierarchy** and make the whole app live-linked. When a gate is drawn inside a population's plot, it creates a **child population** that contains only the parent's events that fall inside the gate; this nesting is shown as an indented tree in the left rail (e.g., Cells → Single Cells → Live → CD3+ → CD4+ / CD8+). Selecting a population in the tree filters the relevant plots and statistics to that subset.
>
> **Live-linking is the signature feel:** dragging a gate vertex, moving a gate, or changing a transform must instantly recompute all descendant populations, every dependent plot, and every statistic — in real time, smoothly, even on large samples. Add **backgating**: selecting a leaf population highlights exactly where those events sit within any ancestor plot ("show in parent"). Let users reparent gates by dragging in the tree, and delete/duplicate populations with confirmation where data would be lost.
>
> **Done when:** drawing a gate creates the correct nested population, the tree reflects the hierarchy, selecting a population filters plots/stats, editing any gate updates everything downstream live, and backgating highlights a child population within its ancestors.

---

### Prompt 7 — Statistics engine & table editor

> Add population statistics and a spreadsheet-style table for reporting them. For any population, compute and display in the inspector: **event count**, **% of parent**, **% of total**, and per-parameter statistics such as **median, mean, geometric mean, robust CV, and percentiles** (these are the numbers cytometrists publish; "MFI" usually means the median on the chosen scale). All statistics update live as gates change.
>
> Build a **table editor** where the user drags populations into rows and statistics into columns (and can pivot to samples-as-rows), producing a clean, sortable, exportable table — the way a researcher assembles a results table across many populations or samples. Support copying to clipboard and exporting to CSV/Excel. Let the user define **derived parameters** (simple arithmetic/ratios of existing parameters, e.g., a ratio of two markers) that then become usable on plots and in statistics.
>
> **Done when:** the inspector shows live counts/percentages/MFI for the selected population, I can build a custom statistics table by dragging populations and stats, sort and export it, and create derived parameters that work in plots and stats.

---

### Prompt 8 — Compensation editor & spillover QC

> Implement **compensation** for conventional (non-spectral) data: correcting the spillover of each fluorophore's signal into other detectors. Let the user view and edit the **compensation matrix** as a clear, editable grid (rows = source fluorophore, columns = detector), import a matrix embedded in the FCS file, or compute one from **single-stain control samples** plus an unstained control. Provide an automated compensation option in the spirit of established auto-compensation algorithms, with the result always reviewable and adjustable.
>
> Crucially, provide a **spillover quality-control view**: an N×N grid of small plots for every fluorophore pair so the user can visually confirm populations are neither under- nor over-compensated (the diagonal-skew tell-tale). Changes to the matrix re-compensate the data and update all plots live. Make it obvious which samples a given matrix applies to, and allow per-sample or per-group matrices.
>
> **Done when:** I can view/edit/import a compensation matrix, compute one from single-stain controls, auto-compensate with reviewable results, and inspect an N×N spillover grid where adjustments update all plots live.

---

### Prompt 9 — Spectral unmixing (high-parameter support)

> Extend the app to **spectral cytometry**. Here, instead of one detector per fluorophore, the instrument captures each fluorophore's full emission across many detectors as a **spectral signature**; the software must **unmix** the mixed spectra into per-fluorophore abundances using reference signatures. Add support for ingesting spectral data, building or importing a **reference spectra library** (from single-color and autofluorescence controls), and unmixing samples into named fluorophore parameters that then behave like ordinary parameters everywhere else (plottable, gateable, quantifiable).
>
> Include **autofluorescence handling** (treating cellular autofluorescence as its own signature to extract), a view to inspect and compare spectral signatures, and quality indicators that flag poor unmixing (e.g., similar/colinear spectra). Use the well-understood least-squares family of unmixing methods. Keep unmixing as a first-class, reviewable step in the pipeline, not a hidden conversion.
>
> **Done when:** I can load spectral data, assemble/import reference signatures including autofluorescence, unmix into named fluorophore parameters usable in all plots and gates, inspect signatures, and see warnings when unmixing quality is questionable.

---

### Prompt 10 — Gating templates & batch apply across samples

> Make gating **scale to many samples** the way a real study requires. Let the user define a gating scheme on one sample and **apply it as a template to a whole group of samples** at once, so all samples inherit the same hierarchy. Then provide an efficient **review-and-adjust workflow**: page through every sample seeing the same gate layout, and where a gate doesn't fit a particular sample, **tailor** (nudge) it for that sample only — without breaking the shared template — with tailored samples clearly badged.
>
> Provide a **batch view** that shows the same plot+gate for every sample in a grid (small multiples) so outliers are obvious at a glance, and a one-click way to recompute all statistics across the group into the table editor. Templates should be saveable and reusable across experiments.
>
> **Done when:** I can build a gating scheme once, apply it to many samples, flip through them in a consistent layout, tailor individual samples without affecting others, see all samples as small-multiples, and export combined statistics for the whole group.

---

### Prompt 11 — High-dimensional analysis & cluster explorer

> Add the high-dimensional toolkit for modern high-parameter and spectral panels. Implement **dimensionality-reduction embeddings** (UMAP and t-SNE) and **automated clustering** (a self-organizing-map approach such as FlowSOM, plus a graph-based community-detection clustering option). The user selects which parameters to include, runs the analysis on a chosen population (with sensible event-count sampling for speed), and gets an embedding plot they can gate on like any other plot.
>
> Build a **cluster explorer**: clusters are shown on the embedding and as a **marker-expression heatmap** (clusters × markers) so the user can read each cluster's phenotype at a glance; selecting a cluster backgates it onto traditional plots and reports its size. Support **coloring the embedding by any marker** and comparing embeddings across samples/conditions. Run these heavier computations off the main thread with progress and the ability to cancel. Keep results reproducible and recorded in the pipeline.
>
> **Done when:** I can run UMAP/t-SNE and FlowSOM-style clustering on selected parameters/populations, view a labeled embedding and a cluster×marker heatmap, color the embedding by markers, gate and backgate clusters, and the run is reproducible.

---

### Prompt 12 — Layout / figure editor & publication export

> Build a dedicated **layout editor** for assembling publication-ready figures — a strength to match and beat FCS Express. On a freeform page canvas, the user drags in **live data tiles** (any plot, with its gates and statistics), text labels, titles, legends, arrows, and shapes, then arranges, aligns, and resizes them with snapping and alignment guides. Tiles stay **linked to the underlying data**, so if a gate changes, the figure updates.
>
> Support precise control of plot appearance for figures (fonts, axis ranges, tick density, colors, line weights, gate styling), **picture-in-picture/inset** plots, and consistent styling applied across tiles. Export at publication quality to **vector (PDF/SVG) and high-resolution raster (PNG/TIFF)**, plus an option to export each plot individually. Allow saving layout **templates** for reuse.
>
> **Done when:** I can assemble a multi-panel figure from live plots with text/annotations, align and style everything precisely, have it update when data changes, and export crisp vector and high-resolution images plus reusable layout templates.

---

### Prompt 13 — Reproducible pipeline, reports & data export

> Make every analysis **reproducible and reportable**. Record every meaningful action — transforms, compensation/unmixing, each gate, derived parameters, clustering runs — as an ordered, human-readable **pipeline/history** that can be reviewed, and replayed on new data. Surface this as a clear timeline the user can inspect and step back through (undo/redo throughout the app should tie into it).
>
> Add **report generation**: a one-click summary of an experiment or sample including the gating hierarchy, key plots, and the statistics table, exportable to PDF. Support data **export** in useful forms: gated populations as new FCS files, event tables as CSV/Parquet, statistics as CSV/Excel, and the gating definition in the interoperable **GatingML** standard so other tools can read it.
>
> **Done when:** I can view and step through a complete action history, replay a pipeline on another sample, generate a PDF report of an experiment, and export gated FCS files, statistics tables, and a standards-based gating definition.

---

### Prompt 14 — Collaboration, workspace files & interoperability

> Enable saving, sharing, and interchange. Define a **workspace file** that captures the entire experiment — sample references (by path and content hash, never duplicating raw data), the full pipeline, gates, layouts, and settings — so a colleague can open the same workspace and pick up exactly where it left off. Make open/save robust, with autosave and recovery.
>
> Add **interoperability**: import gating from and export gating to the GatingML standard, and best-effort import of **FlowJo** and **Cytobank** workspaces (using the established interchange tooling) so users can migrate existing work. Provide a lightweight **sharing/collaboration** path appropriate for a desktop app: export a self-contained shareable package, and (optionally, behind a setting) sync a workspace to a shared location with a simple change log so a small team can hand work back and forth. Keep an **audit trail** of who changed what when, which also lays groundwork for a future clinical mode.
>
> **Done when:** I can save/reopen a complete workspace that references rather than copies raw files, recover from a crash via autosave, import/export GatingML, import existing FlowJo/Cytobank work, share a self-contained package, and review an audit log of changes.

---

### Prompt 15 — Onboarding, sample data, accessibility & polish

> Make the first five minutes delightful and the whole app accessible. Add a **welcome/onboarding flow** with bundled **sample datasets** (a conventional panel and a spectral/high-parameter panel) so a new user can explore gating, compensation, and clustering without their own files. Include friendly, illustrated **empty states** (no samples loaded; no gates yet) and inline coach-marks for the core gestures (draw a gate, view a population, build a stats table).
>
> Polish pass: keyboard shortcuts for every common action with a discoverable cheat-sheet, full **VoiceOver/accessibility** support and sufficient color contrast (including non-color cues for colorblind users in plots and gates), graceful and specific error messages, helpful tooltips, and consistent loading/progress affordances. Ensure performance stays smooth with several large samples open at once, and tune memory use for big files.
>
> **Done when:** a brand-new user can open bundled sample data and complete gate → population → statistics within minutes guided by onboarding, the app is navigable via keyboard and screen reader with colorblind-safe visuals, errors are clear, and it stays responsive with multiple large samples loaded.

---

### Prompt 16 — Clinical / compliance mode (optional, gated)

> Add an **optional clinical mode** (off by default; enabled per-installation) that brings the regulated-environment features clinical labs need — in the spirit of FCS Express's compliance support. When enabled: enforce **user accounts with authentication and roles**, capture an immutable **audit trail** of every action with timestamps and user identity, support **electronic signatures** on reports and locked analyses, allow **locking/finalizing** an analysis so it can no longer be altered (only versioned), and produce compliance-oriented exports. Provide configuration for retention and access controls.
>
> Keep this cleanly separated so it never complicates the default research experience, and document clearly that compliance is a shared responsibility between the software configuration and the lab's procedures.
>
> **Done when:** with clinical mode enabled I get authenticated roles, a complete immutable audit trail, electronic signatures on reports, the ability to lock/finalize analyses, and compliance exports — while the default (research) mode remains unchanged and uncluttered.

---

## 7. Build sequence & dependency map

Run in this order; later prompts assume earlier ones exist.

```
0  Vision & guardrails            (foundation; run first)
        │
1  App shell & design system
        │
2  FCS import & experiment mgr ───┐
        │                          │
3  Transforms & axis scaling       │
        │                          │
4  Plot canvas  ◄──────────────────┘
        │
5  Gating tools
        │
6  Hierarchy + live-linking + backgating   ← the core experience is complete here
        │
7  Statistics & table editor
        │
8  Compensation & N×N QC
        │
9  Spectral unmixing            (needs 3,4,8 patterns)
        │
10 Templates & batch across samples
        │
11 High-dimensional & cluster explorer
        │
12 Layout / figure editor
        │
13 Reproducible pipeline, reports, export
        │
14 Workspace files, collaboration, interop
        │
15 Onboarding, sample data, accessibility, polish
        │
16 Clinical / compliance mode   (optional, last)
```

**Suggested milestones**
- **M1 "It gates" (Prompts 0–6):** load FCS, transform, plot fast, draw gates, see a live hierarchy. This alone is a usable, impressive product.
- **M2 "It quantifies & corrects" (7–8):** statistics tables + compensation. Now it's research-credible.
- **M3 "It scales & sees high-dim" (9–11):** spectral, batch templates, UMAP/FlowSOM. Now it rivals Cytobank.
- **M4 "It communicates" (12–14):** figures, reproducibility, sharing/interop. Now it rivals FCS Express + FlowJo.
- **M5 "It ships" (15–16):** polish, onboarding, optional compliance.
