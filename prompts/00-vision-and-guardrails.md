# Prompt 0 — Vision, scope & guardrails

**Milestone:** Foundation  
**Depends on:** Run first

> Paste the text below into Codex as a single task.

---

You are building CytoStudio, a native-feeling macOS desktop application for flow cytometry analysis. Its mission is to combine the best of three existing tools: the population-hierarchy gating workspace and "apply one gating scheme to many samples" model of FlowJo; the live-linked, publication-quality visualization and figure-layout craft of FCS Express; and the high-dimensional analysis (UMAP / t-SNE / FlowSOM) plus collaboration and reproducibility of Cytobank.

Non-negotiable qualities, in priority order: (1) manual gating must feel as fluid as a drawing app, with everything live-linked so adjusting a gate instantly updates every dependent plot and statistic; (2) it must stay fast and responsive on samples with millions of events; (3) it must look and behave like a first-class macOS app (light/dark mode, system fonts, trackpad gestures, native window behavior); (4) it must eventually handle spectral / high-parameter data and automated clustering.

You choose the languages, frameworks, and libraries — pick whatever best delivers native macOS polish and the performance to render millions of points smoothly, while letting you reuse the mature scientific cytometry ecosystem for correct math (transforms, compensation, clustering) rather than reinventing it. Favor a clean separation between a fast data/rendering core and the scientific algorithms.

Set up the project skeleton, a component/design-system foundation themed to Apple's Human Interface Guidelines with a signature teal-cyan accent, app-wide light/dark support, and a placeholder three-pane window (left sidebar, center canvas, right inspector, top toolbar, bottom status bar). Establish a single source of truth for application state so that data, gates, plots, and statistics can all stay synchronized automatically. Deliver a running, empty app I can launch. Document your stack choices and why in a README.

Done when: the app launches on macOS, shows the three-pane shell in both light and dark mode, the window behaves natively, and the README explains the architecture and how to run it.
