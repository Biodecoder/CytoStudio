# Prompt 13 — Reproducible pipeline, reports & data export

**Milestone:** M4 — It communicates  
**Depends on:** Prompts 5–11

> Paste the text below into Codex as a single task.

---

Make every analysis reproducible and reportable. Record every meaningful action — transforms, compensation/unmixing, each gate, derived parameters, clustering runs — as an ordered, human-readable pipeline/history that can be reviewed, and replayed on new data. Surface this as a clear timeline the user can inspect and step back through (undo/redo throughout the app should tie into it).

Add report generation: a one-click summary of an experiment or sample including the gating hierarchy, key plots, and the statistics table, exportable to PDF. Support data export in useful forms: gated populations as new FCS files, event tables as CSV/Parquet, statistics as CSV/Excel, and the gating definition in the interoperable GatingML standard so other tools can read it.

Done when: I can view and step through a complete action history, replay a pipeline on another sample, generate a PDF report of an experiment, and export gated FCS files, statistics tables, and a standards-based gating definition.
