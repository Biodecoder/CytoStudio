# Prompt 2 — FCS import, metadata & experiment manager

**Milestone:** M1 — It gates  
**Depends on:** Prompts 0–1

> Paste the text below into Codex as a single task.

---

Implement loading of cytometry data files (FCS 3.0 and 3.1 to start; structure it so raw spectral formats can be added later). The user can drag-and-drop files or folders, or open them via the menu. On import, read every event and every parameter, plus the file's embedded metadata (keywords) such as the parameter names, detector/fluorophore labels, instrument, operator, acquisition date, and any existing compensation matrix stored in the file.

Organize files into an Experiment containing Samples, with the ability to group samples (e.g., by condition or timepoint) by drag-and-drop in the left browser. Show each sample's key metadata in the inspector when selected. Display friendly parameter names (the marker/fluorophore label) everywhere, while keeping the raw channel name available. Handle large files gracefully — show progress, never freeze the UI, and be ready to work with files too big to hold fully in memory.

Done when: I can drag in multiple FCS files, see them listed and groupable, inspect each sample's metadata and parameter list with human-readable marker names, and large files import with visible progress and no UI freeze.
