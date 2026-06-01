# Prompt 7 — Statistics engine & table editor

**Milestone:** M2 — It quantifies & corrects  
**Depends on:** Prompt 6

> Paste the text below into Codex as a single task.

---

Add population statistics and a spreadsheet-style table for reporting them. For any population, compute and display in the inspector: event count, % of parent, % of total, and per-parameter statistics such as median, mean, geometric mean, robust CV, and percentiles (these are the numbers cytometrists publish; "MFI" usually means the median on the chosen scale). All statistics update live as gates change.

Build a table editor where the user drags populations into rows and statistics into columns (and can pivot to samples-as-rows), producing a clean, sortable, exportable table — the way a researcher assembles a results table across many populations or samples. Support copying to clipboard and exporting to CSV/Excel. Let the user define derived parameters (simple arithmetic/ratios of existing parameters, e.g., a ratio of two markers) that then become usable on plots and in statistics.

Done when: the inspector shows live counts/percentages/MFI for the selected population, I can build a custom statistics table by dragging populations and stats, sort and export it, and create derived parameters that work in plots and stats.
