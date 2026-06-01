# Prompt 9 — Spectral unmixing (high-parameter support)

**Milestone:** M3 — It scales & sees high-dim  
**Depends on:** Prompts 3, 4, 8

> Paste the text below into Codex as a single task.

---

Extend the app to spectral cytometry. Here, instead of one detector per fluorophore, the instrument captures each fluorophore's full emission across many detectors as a spectral signature; the software must unmix the mixed spectra into per-fluorophore abundances using reference signatures. Add support for ingesting spectral data, building or importing a reference spectra library (from single-color and autofluorescence controls), and unmixing samples into named fluorophore parameters that then behave like ordinary parameters everywhere else (plottable, gateable, quantifiable).

Include autofluorescence handling (treating cellular autofluorescence as its own signature to extract), a view to inspect and compare spectral signatures, and quality indicators that flag poor unmixing (e.g., similar/colinear spectra). Use the well-understood least-squares family of unmixing methods. Keep unmixing as a first-class, reviewable step in the pipeline, not a hidden conversion.

Done when: I can load spectral data, assemble/import reference signatures including autofluorescence, unmix into named fluorophore parameters usable in all plots and gates, inspect signatures, and see warnings when unmixing quality is questionable.
