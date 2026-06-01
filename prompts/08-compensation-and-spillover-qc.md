# Prompt 8 — Compensation editor & spillover QC

**Milestone:** M2 — It quantifies & corrects  
**Depends on:** Prompts 4, 6

> Paste the text below into Codex as a single task.

---

Implement compensation for conventional (non-spectral) data: correcting the spillover of each fluorophore's signal into other detectors. Let the user view and edit the compensation matrix as a clear, editable grid (rows = source fluorophore, columns = detector), import a matrix embedded in the FCS file, or compute one from single-stain control samples plus an unstained control. Provide an automated compensation option in the spirit of established auto-compensation algorithms, with the result always reviewable and adjustable.

Crucially, provide a spillover quality-control view: an N-by-N grid of small plots for every fluorophore pair so the user can visually confirm populations are neither under- nor over-compensated (the diagonal-skew tell-tale). Changes to the matrix re-compensate the data and update all plots live. Make it obvious which samples a given matrix applies to, and allow per-sample or per-group matrices.

Done when: I can view/edit/import a compensation matrix, compute one from single-stain controls, auto-compensate with reviewable results, and inspect an N-by-N spillover grid where adjustments update all plots live.
