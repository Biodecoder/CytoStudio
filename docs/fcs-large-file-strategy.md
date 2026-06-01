# FCS Large-File Import Strategy

CytoStudio's browser prototype supports two import modes:

- **Worker event preview:** files below the large-file threshold are read into a browser worker and parsed into a capped event preview. This keeps the UI responsive for normal prototype files while preserving metadata, parameters, spillover, and sampled event data.
- **Metadata-only large-file preflight:** files at or above 512 MB read only the FCS header and TEXT segment. The sample is added with event count, parameters, keywords, and instrument metadata, but event payload parsing is deferred.

The metadata-only branch is intentional. A static browser page cannot memory-map local files the way the target Tauri/Rust/Arrow engine can. Rather than freezing the UI or claiming full large-file support, the prototype imports enough metadata to organize and inspect the experiment, then marks the sample as requiring the planned memory-mapped data core for full events.

## Native Engine Handoff

The production data core should replace the metadata-only branch with:

1. Open the FCS file through the native file handle and compute a content hash without duplicating raw data.
2. Parse HEADER/TEXT/ANALYSIS segments into the workspace metadata model.
3. Memory-map the DATA segment into an Arrow-backed columnar store.
4. Build capped preview tiles for immediate plotting while keeping raw event columns addressable for gates, statistics, compensation, and export.
5. Stream progress as bytes mapped, events indexed, and preview tiles materialized.
6. Keep the workspace JSON as references to file path/hash plus derived analysis state, never embedded raw event data.

## Current Guardrails

- Oversized files never enter the full browser `arrayBuffer()` event parse path.
- Metadata-only samples use a visible import mode in the inspector and sample rail.
- Full scientific analysis remains scaffolded until the memory-mapped engine is implemented and validated.
