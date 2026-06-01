# Prompt 10 — Gating templates & batch apply across samples

**Milestone:** M3 — It scales & sees high-dim  
**Depends on:** Prompts 5, 6, 7

> Paste the text below into Codex as a single task.

---

Make gating scale to many samples the way a real study requires. Let the user define a gating scheme on one sample and apply it as a template to a whole group of samples at once, so all samples inherit the same hierarchy. Then provide an efficient review-and-adjust workflow: page through every sample seeing the same gate layout, and where a gate doesn't fit a particular sample, tailor (nudge) it for that sample only — without breaking the shared template — with tailored samples clearly badged.

Provide a batch view that shows the same plot+gate for every sample in a grid (small multiples) so outliers are obvious at a glance, and a one-click way to recompute all statistics across the group into the table editor. Templates should be saveable and reusable across experiments.

Done when: I can build a gating scheme once, apply it to many samples, flip through them in a consistent layout, tailor individual samples without affecting others, see all samples as small-multiples, and export combined statistics for the whole group.
