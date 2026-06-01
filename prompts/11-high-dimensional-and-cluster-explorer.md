# Prompt 11 — High-dimensional analysis & cluster explorer

**Milestone:** M3 — It scales & sees high-dim  
**Depends on:** Prompts 4, 6

> Paste the text below into Codex as a single task.

---

Add the high-dimensional toolkit for modern high-parameter and spectral panels. Implement dimensionality-reduction embeddings (UMAP and t-SNE) and automated clustering (a self-organizing-map approach such as FlowSOM, plus a graph-based community-detection clustering option). The user selects which parameters to include, runs the analysis on a chosen population (with sensible event-count sampling for speed), and gets an embedding plot they can gate on like any other plot.

Build a cluster explorer: clusters are shown on the embedding and as a marker-expression heatmap (clusters by markers) so the user can read each cluster's phenotype at a glance; selecting a cluster backgates it onto traditional plots and reports its size. Support coloring the embedding by any marker and comparing embeddings across samples/conditions. Run these heavier computations off the main thread with progress and the ability to cancel. Keep results reproducible and recorded in the pipeline.

Done when: I can run UMAP/t-SNE and FlowSOM-style clustering on selected parameters/populations, view a labeled embedding and a cluster-by-marker heatmap, color the embedding by markers, gate and backgate clusters, and the run is reproducible.
