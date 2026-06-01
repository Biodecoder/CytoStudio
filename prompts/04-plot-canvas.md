# Prompt 4 — The plot canvas (the visual heart)

**Milestone:** M1 — It gates  
**Depends on:** Prompts 3, 4

> Paste the text below into Codex as a single task.

---

Build the plotting system — this is where the app earns its reputation, so it must be both beautiful and fast on millions of events. Support these plot types: 2D scatter (dot) plot, density plot (color-mapped by event density), contour plot, pseudocolor, zebra/contour hybrids, and 1D histograms. Default to a perceptually-uniform density colormap with classic alternatives available.

Plots live on the center canvas in a freeform, rearrangeable grid; the user can add a plot, pick its X and Y parameters (X only for histograms), resize and move it, and zoom/pan it (including trackpad pinch and two-finger pan). For very large samples, render so the app stays at a smooth frame rate — aggregate or down-represent points as needed so the experience never stutters, while still looking like real data. Support overlays: dropping one population's data onto a plot overlays it as a tinted contour or histogram for direct comparison, with a clear legend. Axes show human-readable marker names and the chosen scale.

Done when: I can create scatter/density/contour/histogram plots, choose parameters, rearrange and zoom them fluidly even with millions of events, overlay multiple populations with a legend, and everything looks publication-clean.
