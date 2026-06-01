# Prompt 6 — Population hierarchy, live-linking & backgating

**Milestone:** M1 — It gates  
**Depends on:** Prompt 5

> Paste the text below into Codex as a single task.

---

Connect gates into a population hierarchy and make the whole app live-linked. When a gate is drawn inside a population's plot, it creates a child population that contains only the parent's events that fall inside the gate; this nesting is shown as an indented tree in the left rail (e.g., Cells > Single Cells > Live > CD3+ > CD4+ / CD8+). Selecting a population in the tree filters the relevant plots and statistics to that subset.

Live-linking is the signature feel: dragging a gate vertex, moving a gate, or changing a transform must instantly recompute all descendant populations, every dependent plot, and every statistic — in real time, smoothly, even on large samples. Add backgating: selecting a leaf population highlights exactly where those events sit within any ancestor plot ("show in parent"). Let users reparent gates by dragging in the tree, and delete/duplicate populations with confirmation where data would be lost.

Done when: drawing a gate creates the correct nested population, the tree reflects the hierarchy, selecting a population filters plots/stats, editing any gate updates everything downstream live, and backgating highlights a child population within its ancestors.
