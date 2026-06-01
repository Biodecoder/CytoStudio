# Prompt 1 — App shell, navigation & design system

**Milestone:** M1 — It gates  
**Depends on:** Prompt 0

> Paste the text below into Codex as a single task.

---

Flesh out the application shell and design system. Build the three-pane workspace: a left rail that splits into a sample/experiment browser (top) and a population hierarchy tree (bottom); a center canvas that will hold a freeform arrangement of plots; a right inspector that shows context-sensitive properties and statistics; a top toolbar for tools and actions; and a bottom status bar showing total event count and workspace status.

The chrome should be quiet and monochrome so that all color lives inside the data later. Add full keyboard navigation, a Command-K command palette to jump to any sample/gate/parameter/action, standard macOS menus, and trackpad gestures wired up as no-ops for now (pinch, two-finger pan) so plots can adopt them later. Panels should be resizable and collapsible; the layout state should persist between launches.

Done when: I can resize/collapse panels, the layout persists across relaunch, the command palette opens with Command-K and can focus each region, and the whole thing feels like a native Mac app in both appearance modes.
