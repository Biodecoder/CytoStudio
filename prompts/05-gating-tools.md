# Prompt 5 — Manual gating tools & drawing UX

**Milestone:** M1 — It gates  
**Depends on:** Prompt 4

> Paste the text below into Codex as a single task.

---

Implement manual gating — the most-used interaction — so it feels like a precise, forgiving drawing app. Provide these gate tools in the toolbar: rectangle, polygon (click to place vertices, double-click / enter to close), ellipse, quadrant (splits a plot into four by a draggable crosshair), interval (a range gate on a histogram), and freehand / spline lasso. Also support boolean gates (AND / OR / NOT combinations of existing gates).

Drawing mechanics: gates are drawn directly on a plot; vertices and edges are draggable after creation; the whole gate can be moved or resized; gates can be renamed inline and recolored. Snapping and nudge-with-arrow-keys help precision. Each gate visibly animates its fill on creation and shows its population's percentage right on the plot. Every gate is bound to the plot's two parameters, so a gate "means" a region in that 2D space.

Done when: I can draw and edit every gate type directly on plots, drag vertices to reshape, create boolean gates from existing ones, rename/recolor them, and each gate shows its population percentage on the plot.
