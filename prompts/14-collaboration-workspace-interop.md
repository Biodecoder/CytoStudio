# Prompt 14 — Collaboration, workspace files & interoperability

**Milestone:** M4 — It communicates  
**Depends on:** Prompt 13

> Paste the text below into Codex as a single task.

---

Enable saving, sharing, and interchange. Define a workspace file that captures the entire experiment — sample references (by path and content hash, never duplicating raw data), the full pipeline, gates, layouts, and settings — so a colleague can open the same workspace and pick up exactly where it left off. Make open/save robust, with autosave and recovery.

Add interoperability: import gating from and export gating to the GatingML standard, and best-effort import of FlowJo and Cytobank workspaces (using the established interchange tooling) so users can migrate existing work. Provide a lightweight sharing/collaboration path appropriate for a desktop app: export a self-contained shareable package, and (optionally, behind a setting) sync a workspace to a shared location with a simple change log so a small team can hand work back and forth. Keep an audit trail of who changed what when, which also lays groundwork for a future clinical mode.

Done when: I can save/reopen a complete workspace that references rather than copies raw files, recover from a crash via autosave, import/export GatingML, import existing FlowJo/Cytobank work, share a self-contained package, and review an audit log of changes.
