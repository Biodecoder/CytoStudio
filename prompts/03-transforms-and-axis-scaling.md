# Prompt 3 — Data transforms & per-axis scaling

**Milestone:** M1 — It gates  
**Depends on:** Prompt 2

> Paste the text below into Codex as a single task.

---

Add the data transforms that make populations visually separable. Because fluorescence intensity spans several orders of magnitude and can become negative after spillover correction, a plain logarithmic scale is inadequate. Implement the standard cytometry scales: biexponential / logicle (linear near zero, logarithmic far from it), arcsinh (for high-parameter and spectral data), plain log, and linear. Match the established, validated behavior of these transforms used across the field — correctness matters because biologists make gating decisions on these axes.

Each plot axis can independently choose its scale and adjust the relevant parameters (e.g., the width / linear-region of a biexponential, the cofactor of an arcsinh) via simple, well-labeled controls in the inspector, with sensible auto-computed defaults per parameter. Provide an obvious "reset to default scaling" action. Changing a scale must update the plot live.

Done when: I can switch any axis between linear, log, biexponential/logicle, and arcsinh; negative post-compensation values display correctly; defaults look reasonable automatically; and adjustments update the view instantly.
